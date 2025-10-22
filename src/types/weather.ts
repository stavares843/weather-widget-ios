// Types for weather data
export interface Coordinates {
  latitude: number;
  longitude: number;
}

export interface Location {
  name: string;
  country: string;
  region?: string;
  latitude: number;
  longitude: number;
}

export interface WeatherData {
  temperature: number;
  weatherCode: number;
  location: Location;
  timestamp: Date;
}

export interface WeatherSnapshot {
  city: string;
  temp: number;
  emoji: string;
  updatedAt: Date;
}

// Weather codes to emoji mapping based on WMO codes
export const weatherCodeToEmoji = (code: number): string => {
  if (code === 0) return '☀️'; // Clear sky
  if (code >= 1 && code <= 3) return '⛅️'; // Partly cloudy
  if (code >= 45 && code <= 48) return '🌫️'; // Fog
  if (code >= 51 && code <= 67) return '🌧️'; // Rain
  if (code >= 71 && code <= 77) return '❄️'; // Snow
  if (code >= 80 && code <= 99) return '⛈️'; // Thunderstorms
  return '☀️'; // Default to sunny
};

export const formatTemperature = (temp: number, unit: 'C' | 'F' = 'C'): string => {
  const rounded = Math.round(temp);
  return `${rounded}°${unit}`;
};

export const celsiusToFahrenheit = (celsius: number): number => {
  return (celsius * 9/5) + 32;
};