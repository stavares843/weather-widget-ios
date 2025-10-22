import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Keyboard,
  Platform,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useWeather } from '../context/WeatherContext';
import { getCurrentLocation, LocationError, isLocationAvailable } from '../services/locationService';
import { getCurrentWeather, searchLocations } from '../services/weatherApi';
import { weatherCodeToEmoji, formatTemperature, celsiusToFahrenheit, Location } from '../types/weather';

const DEBOUNCE_MS = 350;

const WeatherScreen: React.FC = () => {
  const {
    state,
    setLoading,
    setWeather,
    setError,
    clearError,
    setSavedLocation,
    setTemperatureUnit,
    setLocationPermission,
  } = useWeather();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [searching, setSearching] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  // ——— Initial load
  useEffect(() => {
    loadInitial();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadInitial = useCallback(async () => {
    setLoading(true);
    try {
      if (state.savedLocation) {
        await loadForLocation(state.savedLocation);
        return;
      }
      const available = await isLocationAvailable();
      if (available) {
        await loadForCurrentLocation();
      } else {
        setLocationPermission(false);
        setError('Location access denied. Search for a city to see the weather.');
      }
    } catch (e) {
      console.error('Initial load error:', e);
      setError('Failed to load weather. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [setError, setLoading, setLocationPermission, state.savedLocation]);

  const loadForCurrentLocation = useCallback(async () => {
    try {
      const coords = await getCurrentLocation();
      setLocationPermission(true);

      const weather = await getCurrentWeather(coords);
      setWeather(weather);
      setSavedLocation(weather.location);
    } catch (e) {
      if (e instanceof LocationError) {
        setLocationPermission(false);
        if (e.type === 'permission_denied') {
          setError('Location permission denied. Please search for a city instead.');
        } else {
          setError(`Location unavailable: ${e.message}`);
        }
      } else {
        setError('Failed to get your location. Please try again.');
      }
    }
  }, [setError, setLocationPermission, setSavedLocation, setWeather]);

  const loadForLocation = useCallback(
    async (location: Location) => {
      try {
        const weather = await getCurrentWeather(
          { latitude: location.latitude, longitude: location.longitude },
          location
        );
        setWeather(weather);
        setSavedLocation(location);
      } catch {
        setError('Failed to load weather for this location.');
      }
    },
    [setError, setSavedLocation, setWeather]
  );

  // ——— Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadInitial();
    setRefreshing(false);
  }, [loadInitial]);

  // ——— Debounced search
  const debounceRef = useRef<NodeJS.Timeout | null>(null);
  const onChangeQuery = useCallback((text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!text.trim()) {
      setResults([]);
      setSearching(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await searchLocations(text.trim());
        setResults(res);
      } catch (e) {
        console.error('Search error:', e);
        Alert.alert('Search Error', 'Failed to search locations. Please try again.');
      } finally {
        setSearching(false);
      }
    }, DEBOUNCE_MS);
  }, []);

  const onSelectLocation = useCallback(
    async (loc: Location) => {
      Keyboard.dismiss();
      setQuery('');
      setResults([]);
      setLoading(true);
      try {
        await loadForLocation(loc);
      } finally {
        setLoading(false);
      }
    },
    [loadForLocation, setLoading]
  );

  const toggleUnit = useCallback(() => {
    setTemperatureUnit(state.temperatureUnit === 'C' ? 'F' : 'C');
  }, [setTemperatureUnit, state.temperatureUnit]);

  const currentTemp = useMemo(() => {
    if (!state.currentWeather) return '';
    const c = state.currentWeather.temperature;
    const value = state.temperatureUnit === 'F' ? celsiusToFahrenheit(c) : c;
    return formatTemperature(value, state.temperatureUnit);
  }, [state.currentWeather, state.temperatureUnit]);

  // ——— Renderers
  const renderSearchItem = useCallback(
    ({ item }: { item: Location }) => (
      <Pressable style={styles.searchItem} onPress={() => onSelectLocation(item)}>
        <Text style={styles.searchItemText}>
          {item.name}
          {item.region ? `, ${item.region}` : ''}
          {item.country ? `, ${item.country}` : ''}
        </Text>
      </Pressable>
    ),
    [onSelectLocation]
  );

  const keyExtractor = useCallback((item: Location) => `${item.latitude}-${item.longitude}`, []);

  // ——— UI
  const isSearching = query.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />

      <Header onToggleUnit={toggleUnit} unit={state.temperatureUnit} />

      <SearchBar value={query} onChangeText={onChangeQuery} />

      {isSearching && (
        <View style={styles.searchWrapper}>
          {searching ? (
            <View style={styles.searchLoading}>
              <ActivityIndicator />
              <Text style={styles.muted}>Searching…</Text>
            </View>
          ) : results.length ? (
            <FlatList
              data={results}
              renderItem={renderSearchItem}
              keyExtractor={keyExtractor}
              keyboardShouldPersistTaps="handled"
              style={styles.searchList}
              contentContainerStyle={{ paddingVertical: 6 }}
            />
          ) : (
            <EmptyState
              icon="🔍"
              title="No results"
              text={`We couldn't find any locations matching “${query}”.`}
              hint="Try a different city or check your spelling."
            />
          )}
        </View>
      )}

      {!isSearching && (
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#007AFF" />}
          keyboardShouldPersistTaps="handled"
        >
          {state.isLoading && !refreshing ? (
            <Center>
              <ActivityIndicator />
              <Text style={styles.muted}>Loading weather…</Text>
            </Center>
          ) : state.error ? (
            <ErrorState
              message={state.error}
              onRetry={() => {
                clearError();
                loadInitial();
              }}
            />
          ) : state.currentWeather ? (
            <WeatherCard
              locationName={state.currentWeather.location.name}
              country={state.currentWeather.location.country}
              icon={weatherCodeToEmoji(state.currentWeather.weatherCode)}
              temperature={currentTemp}
              lastUpdated={state.currentWeather.timestamp}
              onRefresh={onRefresh}
            />
          ) : null}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

/* ——— Small presentational components ——— */

const Header: React.FC<{ unit: 'C' | 'F'; onToggleUnit: () => void }> = ({ unit, onToggleUnit }) => (
  <View style={styles.header}>
    <Text style={styles.title}>Weather</Text>
    <Pressable style={styles.unitBtn} onPress={onToggleUnit} accessibilityRole="button" accessibilityLabel="Toggle units">
      <Text style={styles.unitBtnText}>°{unit}</Text>
    </Pressable>
  </View>
);

const SearchBar: React.FC<{ value: string; onChangeText: (t: string) => void }> = ({ value, onChangeText }) => (
  <View style={styles.searchContainer}>
    <TextInput
      style={styles.searchInput}
      placeholder="Search for a city…"
      value={value}
      onChangeText={onChangeText}
      autoCorrect={false}
      clearButtonMode="while-editing"
      returnKeyType="search"
      onSubmitEditing={Keyboard.dismiss}
    />
  </View>
);

const WeatherCard: React.FC<{
  locationName: string;
  country?: string;
  icon: string;
  temperature: string;
  lastUpdated: Date;
  onRefresh: () => void;
}> = ({ locationName, country, icon, temperature, lastUpdated, onRefresh }) => (
  <View style={styles.card}>
    <Text style={styles.location}>{country ? `${locationName}, ${country}` : locationName}</Text>
    <Text style={styles.icon}>{icon}</Text>
    <Text style={styles.temp}>{temperature}</Text>
    <Text style={styles.updated}>Last updated: {lastUpdated.toLocaleTimeString()} GMT</Text>
    <Pressable style={[styles.btn, styles.btnSuccess]} onPress={onRefresh}>
      <Text style={styles.btnText}>Refresh</Text>
    </Pressable>
  </View>
);

const EmptyState: React.FC<{ icon: string; title: string; text: string; hint?: string }> = ({
  icon,
  title,
  text,
  hint,
}) => (
  <View style={styles.card}>
    <Text style={styles.emptyIcon}>{icon}</Text>
    <Text style={styles.cardTitle}>{title}</Text>
    <Text style={styles.muted}>{text}</Text>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
  </View>
);

const ErrorState: React.FC<{ message: string; onRetry: () => void }> = ({ message, onRetry }) => (
  <View style={styles.card}>
    <Text style={styles.error}>{message}</Text>
    <Pressable style={[styles.btn, styles.btnPrimary]} onPress={onRetry}>
      <Text style={styles.btnText}>Retry</Text>
    </Pressable>
  </View>
);

const Center: React.FC<{ children?: React.ReactNode }> = ({ children }) => (
  <View style={styles.center}>{children}</View>
);

/* ——— Styles ——— */

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F9FA' },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: Platform.select({ ios: 8, android: 12, default: 12 }),
    paddingBottom: 10,
  },
  title: { fontSize: 28, fontWeight: '700', color: '#1C1C1E' },

  unitBtn: { backgroundColor: '#007AFF', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  unitBtnText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  searchContainer: { paddingHorizontal: 20, marginBottom: 8 },
  searchInput: {
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },

  searchWrapper: { marginHorizontal: 20 },
  searchList: {
    maxHeight: 240,
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  searchItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E5EA',
  },
  searchItemText: { fontSize: 16, color: '#1C1C1E' },
  searchLoading: {
    backgroundColor: '#fff',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    padding: 20,
    alignItems: 'center',
  },

  content: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20, paddingBottom: 24 },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 },

  card: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    alignItems: 'center',
    marginTop: 16,
  },
  cardTitle: { fontSize: 20, fontWeight: '600', color: '#1C1C1E', textAlign: 'center', marginBottom: 8 },

  location: { fontSize: 24, fontWeight: '600', color: '#1C1C1E', textAlign: 'center', marginBottom: 16 },
  icon: { fontSize: 96, marginBottom: 12 },
  temp: { fontSize: 72, fontWeight: '300', color: '#1C1C1E', marginBottom: 12 },
  updated: { fontSize: 14, color: '#8E8E93', marginBottom: 18 },

  btn: { borderRadius: 12, paddingHorizontal: 24, paddingVertical: 12 },
  btnPrimary: { backgroundColor: '#007AFF' },
  btnSuccess: { backgroundColor: '#34C759' },
  btnText: { color: '#fff', fontWeight: '600', fontSize: 16 },

  emptyIcon: { fontSize: 48, marginBottom: 8 },
  muted: { fontSize: 16, color: '#8E8E93', textAlign: 'center' },
  hint: { fontSize: 14, color: '#C7C7CC', textAlign: 'center', marginTop: 6, lineHeight: 20 },
  error: { color: '#FF3B30', fontSize: 16, textAlign: 'center', marginBottom: 12 },
});

export default WeatherScreen;
