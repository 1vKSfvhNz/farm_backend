// contexts/LocationContext.tsx
import React, { createContext, useContext, useEffect, ReactNode } from 'react';
import { useLocation } from '../hooks/useLocation';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Interface pour les données de localisation
export interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: number;
}

// Interface pour le contexte de localisation
interface LocationContextType {
  location: LocationData | null;
  error: Error | null;
  loading: boolean;
  permissionGranted: boolean;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentLocation: () => Promise<LocationData | null>;
  watchPosition: (callback?: (location: LocationData | null, error?: Error) => void) => number;
  clearWatch: (watchId: number | null) => void;
  saveLocationToStorage: (location: LocationData) => Promise<void>;
  getLastSavedLocation: () => Promise<LocationData | null>;
}

// Création du contexte avec des valeurs par défaut
const LocationContext = createContext<LocationContextType | undefined>(undefined);

// Clé pour le stockage de la localisation dans AsyncStorage
const LOCATION_STORAGE_KEY = '@app_location';

// Props pour le provider
interface LocationProviderProps {
  children: ReactNode;
}

// Provider component
export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  // Utilisation du hook de localisation existant
  const locationHook = useLocation();
  
  // Méthode pour sauvegarder la localisation dans AsyncStorage
  const saveLocationToStorage = async (location: LocationData): Promise<void> => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(location));
    } catch (error) {
      console.error('Error saving location to storage:', error);
      throw error;
    }
  };

  // Méthode pour récupérer la dernière localisation sauvegardée
  const getLastSavedLocation = async (): Promise<LocationData | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      if (jsonValue) {
        const parsedLocation = JSON.parse(jsonValue) as LocationData;
        return parsedLocation;
      }
      return null;
    } catch (error) {
      console.error('Error retrieving location from storage:', error);
      return null;
    }
  };

  // Sauvegarder automatiquement la localisation lorsqu'elle change
  useEffect(() => {
    if (locationHook.location) {
      saveLocationToStorage(locationHook.location);
    }
  }, [locationHook.location]);

  // Valeur du contexte
  const value: LocationContextType = {
    ...locationHook,
    saveLocationToStorage,
    getLastSavedLocation
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};

// Hook personnalisé pour utiliser le contexte
export const useLocationContext = (): LocationContextType => {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error('useLocationContext must be used within a LocationProvider');
  }
  return context;
};