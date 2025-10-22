import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'WeatherApp',
  slug: 'weather-app',
  version: '1.0.0',
  orientation: 'portrait',
  icon: './assets/icon.png',
  userInterfaceStyle: 'light',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#ffffff'
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.weatherapp.main',
    infoPlist: {
      NSLocationWhenInUseUsageDescription: 'This app uses your location to provide local weather information.',
    },
    entitlements: {
      'com.apple.security.application-groups': ['group.com.weatherapp.shared'],
    },
  },
  android: {
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#ffffff'
    },
    edgeToEdgeEnabled: true,
    predictiveBackGestureEnabled: false
  },
  web: {
    favicon: './assets/favicon.png'
  },
  plugins: [
    './plugins/withWidgetModule.js',
    'expo-location',
    [
      'expo-build-properties',
      {
        ios: {
          deploymentTarget: '15.1'
        }
      }
    ]
  ]
});