import React from 'react';
import { WeatherProvider } from './src/context/WeatherContext';
import WeatherScreen from './src/components/WeatherScreen';

export default function App() {
  return (
    <WeatherProvider>
      <WeatherScreen />
    </WeatherProvider>
  );
}
