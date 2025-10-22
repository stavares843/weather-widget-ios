import { NativeModules } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { WeatherSnapshot } from '../types/weather';

// Native module interface
interface WidgetDataModule {
  saveToAppGroup(data: string): Promise<boolean>;
  loadFromAppGroup(): Promise<string | null>;
  reloadWidgets(): Promise<boolean>;
}

// App Group identifier for iOS (shared between app and widget)
const APP_GROUP_ID = 'group.com.weatherapp.shared';
const WIDGET_DATA_KEY = 'widget_weather_data';

// Try to get the native module (will be null if not available)
const WidgetData: WidgetDataModule | null = NativeModules.WidgetDataModule || null;

/**
 * Save weather snapshot for widget consumption
 */
export const saveWidgetSnapshot = async (snapshot: WeatherSnapshot): Promise<void> => {
  try {
    console.log('🔵 saveWidgetSnapshot called with:', snapshot);
    
    const data = JSON.stringify({
      ...snapshot,
      updatedAt: snapshot.updatedAt.toISOString(),
    });
    
    console.log('🔵 JSON data:', data);
    
    // Save to AsyncStorage (fallback)
    await AsyncStorage.setItem(WIDGET_DATA_KEY, data);
    console.log('✅ Saved to AsyncStorage');
    
    // Try to save to App Group on iOS
    if (WidgetData) {
      console.log('🔵 WidgetDataModule found, calling saveToAppGroup...');
      try {
        await WidgetData.saveToAppGroup(data);
        console.log('✅ Widget snapshot saved to App Group');
      } catch (error) {
        console.error('❌ Failed to save to App Group:', error);
      }
    } else {
      console.log('❌ WidgetDataModule NOT FOUND - native module not available');
      console.log('Available modules:', Object.keys(NativeModules));
    }
    
    console.log('✅ Widget snapshot save complete');
  } catch (error) {
    console.error('❌ Failed to save widget snapshot:', error);
  }
};

/**
 * Load weather snapshot from storage
 */
export const loadWidgetSnapshot = async (): Promise<WeatherSnapshot | null> => {
  try {
    let data: string | null = null;
    
    // Try to load from App Group first
    if (WidgetData) {
      try {
        data = await WidgetData.loadFromAppGroup();
      } catch (error) {
        console.warn('Failed to load from App Group, trying AsyncStorage');
      }
    }
    
    // Fallback to AsyncStorage
    if (!data) {
      data = await AsyncStorage.getItem(WIDGET_DATA_KEY);
    }
    
    if (!data) return null;
    
    const parsed = JSON.parse(data);
    return {
      ...parsed,
      updatedAt: new Date(parsed.updatedAt),
    };
  } catch (error) {
    console.error('Failed to load widget snapshot:', error);
    return null;
  }
};

/**
 * Manually reload all widgets
 */
export const reloadWidgets = async (): Promise<void> => {
  try {
    if (WidgetData) {
      await WidgetData.reloadWidgets();
      console.log('✅ Widgets reloaded manually');
    } else {
      console.log('⚠️  Native module not available, cannot reload widgets');
    }
  } catch (error) {
    console.error('Failed to reload widgets:', error);
  }
};

/**
 * Get the App Group identifier for iOS
 */
export const getAppGroupId = (): string => {
  return APP_GROUP_ID;
};