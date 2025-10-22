import { Coordinates, Location, WeatherData } from '../types/weather';

const GEOCODING_API = 'https://geocoding-api.open-meteo.com/v1/search';
const WEATHER_API = 'https://api.open-meteo.com/v1/forecast';

/**
 * Search for locations by name using Open-Meteo Geocoding API
 */
export const searchLocations = async (query: string): Promise<Location[]> => {
  if (!query.trim()) return [];

  try {
    const response = await fetch(
      `${GEOCODING_API}?name=${encodeURIComponent(query)}&count=10&language=en&format=json`
    );
    
    if (!response.ok) {
      throw new Error(`Geocoding API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.results) return [];

    return data.results.map((result: any): Location => ({
      name: result.name,
      country: result.country,
      region: result.admin1,
      latitude: result.latitude,
      longitude: result.longitude,
    }));
  } catch (error) {
    console.error('Error searching locations:', error);
    throw new Error('Failed to search locations');
  }
};

/**
 * Get current weather for given coordinates
 */
export const getCurrentWeather = async (
  coordinates: Coordinates,
  location?: Location
): Promise<WeatherData> => {
  try {
    const { latitude, longitude } = coordinates;
    
    const response = await fetch(
      `${WEATHER_API}?latitude=${latitude}&longitude=${longitude}&current=temperature_2m,weather_code&timezone=auto`
    );
    
    if (!response.ok) {
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    if (!data.current) {
      throw new Error('No current weather data available');
    }

    // If no location provided, create a basic one from coordinates
    const weatherLocation: Location = location || {
      name: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
      country: '',
      latitude,
      longitude,
    };

    return {
      temperature: data.current.temperature_2m,
      weatherCode: data.current.weather_code,
      location: weatherLocation,
      timestamp: new Date(),
    };
  } catch (error) {
    console.error('Error fetching weather:', error);
    throw new Error('Failed to fetch weather data');
  }
};

/**
 * Get weather for a specific location by name
 */
export const getWeatherByLocation = async (locationName: string): Promise<WeatherData> => {
  const locations = await searchLocations(locationName);
  
  if (locations.length === 0) {
    throw new Error('Location not found');
  }

  const location = locations[0]; // Use first result
  return getCurrentWeather(
    { latitude: location.latitude, longitude: location.longitude },
    location
  );
};