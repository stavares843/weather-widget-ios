import * as Location from 'expo-location';
import { Coordinates } from '../types/weather';

export type LocationErrorType = 'permission_denied' | 'unavailable' | 'timeout' | 'unknown';

export class LocationError extends Error {
  public type: LocationErrorType;
  
  constructor(message: string, type: LocationErrorType) {
    super(message);
    this.name = 'LocationError';
    this.type = type;
  }
}

/**
 * Request location permissions and get current position
 */
export const getCurrentLocation = async (): Promise<Coordinates> => {
  try {
    // Check if location services are enabled
    const enabled = await Location.hasServicesEnabledAsync();
    if (!enabled) {
      throw new LocationError('Location services are disabled', 'unavailable');
    }

    // Request foreground permissions
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      throw new LocationError('Location permission denied', 'permission_denied');
    }

    // Get current position with timeout
    const position = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
      timeInterval: 10000, // 10 seconds timeout
    });

    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
    };
  } catch (error) {
    console.error('Error getting location:', error);
    
    if (error instanceof LocationError) {
      throw error;
    }
    
    // Handle different types of location errors
    if (error && typeof error === 'object' && 'code' in error) {
      if ((error as any).code === 'E_LOCATION_SERVICES_DISABLED') {
        throw new LocationError('Location services are disabled', 'unavailable');
      }
      
      if ((error as any).code === 'E_LOCATION_UNAVAILABLE') {
        throw new LocationError('Location unavailable', 'unavailable');
      }
    }
    
    throw new LocationError('Failed to get location', 'unknown');
  }
};

/**
 * Check current permission status without requesting
 */
export const getLocationPermissionStatus = async (): Promise<Location.LocationPermissionResponse> => {
  return await Location.getForegroundPermissionsAsync();
};

/**
 * Check if location services are available
 */
export const isLocationAvailable = async (): Promise<boolean> => {
  try {
    const hasServices = await Location.hasServicesEnabledAsync();
    const { canAskAgain, granted } = await Location.getForegroundPermissionsAsync();
    
    return hasServices && (granted || canAskAgain);
  } catch (error) {
    console.error('Error checking location availability:', error);
    return false;
  }
};