import React, { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherData, WeatherSnapshot, Coordinates, Location } from '../types/weather';

// State interface
interface WeatherState {
  currentWeather: WeatherData | null;
  isLoading: boolean;
  error: string | null;
  savedLocation: Location | null;
  temperatureUnit: 'C' | 'F';
  locationPermissionGranted: boolean | null;
}

// Action types
type WeatherAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_WEATHER'; payload: WeatherData }
  | { type: 'SET_ERROR'; payload: string }
  | { type: 'CLEAR_ERROR' }
  | { type: 'SET_SAVED_LOCATION'; payload: Location | null }
  | { type: 'SET_TEMPERATURE_UNIT'; payload: 'C' | 'F' }
  | { type: 'SET_LOCATION_PERMISSION'; payload: boolean };

// Initial state
const initialState: WeatherState = {
  currentWeather: null,
  isLoading: false,
  error: null,
  savedLocation: null,
  temperatureUnit: 'C',
  locationPermissionGranted: null,
};

// Reducer
const weatherReducer = (state: WeatherState, action: WeatherAction): WeatherState => {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload, error: null };
    case 'SET_WEATHER':
      return { ...state, currentWeather: action.payload, isLoading: false, error: null };
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    case 'CLEAR_ERROR':
      return { ...state, error: null };
    case 'SET_SAVED_LOCATION':
      return { ...state, savedLocation: action.payload };
    case 'SET_TEMPERATURE_UNIT':
      return { ...state, temperatureUnit: action.payload };
    case 'SET_LOCATION_PERMISSION':
      return { ...state, locationPermissionGranted: action.payload };
    default:
      return state;
  }
};

// Context type
interface WeatherContextType {
  state: WeatherState;
  setLoading: (loading: boolean) => void;
  setWeather: (weather: WeatherData) => void;
  setError: (error: string) => void;
  clearError: () => void;
  setSavedLocation: (location: Location | null) => void;
  setTemperatureUnit: (unit: 'C' | 'F') => void;
  setLocationPermission: (granted: boolean) => void;
  getWidgetSnapshot: () => WeatherSnapshot | null;
}

// Storage keys
const STORAGE_KEYS = {
  SAVED_LOCATION: 'weather_saved_location',
  TEMPERATURE_UNIT: 'weather_temperature_unit',
  LAST_WEATHER: 'weather_last_data',
};

// Create context
const WeatherContext = createContext<WeatherContextType | undefined>(undefined);

// Provider component
export const WeatherProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(weatherReducer, initialState);

  // Load persisted data on app start
  useEffect(() => {
    loadPersistedData();
  }, []);

  // Save location and temperature unit when they change
  useEffect(() => {
    if (state.savedLocation) {
      AsyncStorage.setItem(STORAGE_KEYS.SAVED_LOCATION, JSON.stringify(state.savedLocation));
    }
  }, [state.savedLocation]);

  useEffect(() => {
    AsyncStorage.setItem(STORAGE_KEYS.TEMPERATURE_UNIT, state.temperatureUnit);
  }, [state.temperatureUnit]);

  // Save weather data for widget
  useEffect(() => {
    console.log('🟢 WeatherContext: currentWeather changed:', state.currentWeather?.location.name);
    
    if (state.currentWeather) {
      AsyncStorage.setItem(STORAGE_KEYS.LAST_WEATHER, JSON.stringify(state.currentWeather));
      
      // Save snapshot for widget
      const snapshot = getWidgetSnapshot();
      console.log('🟢 WeatherContext: Generated snapshot:', snapshot);
      
      if (snapshot) {
        // Import widgetBridge dynamically to avoid circular dependency
        import('../services/widgetBridge').then(({ saveWidgetSnapshot }) => {
          console.log('🟢 WeatherContext: Calling saveWidgetSnapshot...');
          saveWidgetSnapshot(snapshot);
        });
      } else {
        console.log('⚠️ WeatherContext: Snapshot is null, not saving');
      }
    } else {
      console.log('⚠️ WeatherContext: No current weather, not saving to widget');
    }
  }, [state.currentWeather, state.temperatureUnit]);

  const loadPersistedData = async () => {
    try {
      const [savedLocation, temperatureUnit, lastWeather] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.SAVED_LOCATION),
        AsyncStorage.getItem(STORAGE_KEYS.TEMPERATURE_UNIT),
        AsyncStorage.getItem(STORAGE_KEYS.LAST_WEATHER),
      ]);

      if (savedLocation) {
        dispatch({ type: 'SET_SAVED_LOCATION', payload: JSON.parse(savedLocation) });
      }

      if (temperatureUnit) {
        dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: temperatureUnit as 'C' | 'F' });
      }

      if (lastWeather) {
        const weather = JSON.parse(lastWeather);
        // Convert timestamp back to Date object
        weather.timestamp = new Date(weather.timestamp);
        dispatch({ type: 'SET_WEATHER', payload: weather });
      }
    } catch (error) {
      console.error('Error loading persisted data:', error);
    }
  };

  const setLoading = (loading: boolean) => {
    dispatch({ type: 'SET_LOADING', payload: loading });
  };

  const setWeather = (weather: WeatherData) => {
    dispatch({ type: 'SET_WEATHER', payload: weather });
  };

  const setError = (error: string) => {
    dispatch({ type: 'SET_ERROR', payload: error });
  };

  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  const setSavedLocation = (location: Location | null) => {
    dispatch({ type: 'SET_SAVED_LOCATION', payload: location });
  };

  const setTemperatureUnit = (unit: 'C' | 'F') => {
    dispatch({ type: 'SET_TEMPERATURE_UNIT', payload: unit });
  };

  const setLocationPermission = (granted: boolean) => {
    dispatch({ type: 'SET_LOCATION_PERMISSION', payload: granted });
  };

  const getWidgetSnapshot = (): WeatherSnapshot | null => {
    if (!state.currentWeather) return null;

    const { currentWeather, temperatureUnit } = state;
    const temp = temperatureUnit === 'F' ? 
      (currentWeather.temperature * 9/5) + 32 : 
      currentWeather.temperature;

    return {
      city: `${currentWeather.location.name}${currentWeather.location.country ? `, ${currentWeather.location.country}` : ''}`,
      temp: Math.round(temp),
      emoji: getWeatherEmoji(currentWeather.weatherCode),
      updatedAt: currentWeather.timestamp,
    };
  };

  const value: WeatherContextType = {
    state,
    setLoading,
    setWeather,
    setError,
    clearError,
    setSavedLocation,
    setTemperatureUnit,
    setLocationPermission,
    getWidgetSnapshot,
  };

  return (
    <WeatherContext.Provider value={value}>
      {children}
    </WeatherContext.Provider>
  );
};

// Hook to use weather context
export const useWeather = (): WeatherContextType => {
  const context = useContext(WeatherContext);
  if (!context) {
    throw new Error('useWeather must be used within a WeatherProvider');
  }
  return context;
};

// Helper function to get weather emoji
const getWeatherEmoji = (code: number): string => {
  if (code === 0) return '☀️'; // Clear sky
  if (code >= 1 && code <= 3) return '⛅️'; // Partly cloudy
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 67) return '🌧️'; // Rain
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 99) return '⛈️'; // Thunderstorms
  return '☀️'; // Default to sunny
};