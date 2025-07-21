// hooks/useLocation.ts
import { useState, useEffect, useCallback } from 'react';
import { Platform, PermissionsAndroid } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { useTranslation } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LocationData } from '../contexts/LocationContext';

// Type pour la fonction de callback
type LocationCallback = (location: LocationData | null, error?: Error) => void;

// Clé pour le stockage de la localisation
const LOCATION_STORAGE_KEY = '@app_location';

// Configuration globale de Geolocation
Geolocation.setRNConfiguration({
  skipPermissionRequests: false,
  authorizationLevel: 'whenInUse',
  enableBackgroundLocationUpdates: false
});

export const useLocation = () => {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [error, setError] = useState<Error | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
  const [backgroundPermissionGranted, setBackgroundPermissionGranted] = useState<boolean>(false);
  const { t } = useTranslation();

  // Vérifier l'état de la permission et charger la dernière position connue au chargement
  useEffect(() => {
    const initialize = async () => {
      // Vérifier les permissions
      try {
        if (Platform.OS === 'android') {
          const granted = await PermissionsAndroid.check(
            PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION
          );
          setPermissionGranted(granted);
        } else {
          // Pour iOS, on ne peut pas vérifier directement - on suppose que non autorisé jusqu'à preuve du contraire
          setPermissionGranted(false);
        }
      } catch (err) {
        console.warn('Erreur lors de la vérification des permissions:', err);
      }

      // Charger la dernière position connue depuis le stockage
      try {
        const jsonValue = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
        if (jsonValue) {
          const savedLocation = JSON.parse(jsonValue) as LocationData;
          setLocation(savedLocation);
        }
      } catch (err) {
        console.warn('Erreur lors du chargement de la position:', err);
      }
    };
    
    initialize();
  }, []);

  // Sauvegarder la localisation dans AsyncStorage
  const saveLocationToStorage = useCallback(async (locationData: LocationData): Promise<void> => {
    try {
      await AsyncStorage.setItem(LOCATION_STORAGE_KEY, JSON.stringify(locationData));
    } catch (error) {
      console.error('Erreur lors de la sauvegarde de la position:', error);
    }
  }, []);

  // Récupérer la dernière position sauvegardée
  const getLastSavedLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      const jsonValue = await AsyncStorage.getItem(LOCATION_STORAGE_KEY);
      return jsonValue ? JSON.parse(jsonValue) as LocationData : null;
    } catch (error) {
      console.error('Erreur lors de la récupération de la position:', error);
      return null;
    }
  }, []);

  const requestLocationPermission = useCallback(async (): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      
      if (Platform.OS === 'ios') {
        // Sur iOS, on ne peut pas vérifier directement le statut des permissions
        // Geolocation.requestAuthorization() n'existe pas dans @react-native-community/geolocation
        // Lorsqu'on utilise getCurrentPosition, cela va demander la permission automatiquement
        setPermissionGranted(true); // On suppose que ça va marcher
        return true;
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: t('locationPermissionTitle'),
            message: t('locationPermissionMessage'),
            buttonNeutral: t('actions.askMeLater'),
            buttonNegative: t('actions.cancel'),
            buttonPositive: t('actions.ok')
          }
        );
        
        const permissionGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setPermissionGranted(permissionGranted);
        
        if (!permissionGranted) {
          console.warn('Permission de localisation refusée sur Android');
          setError(new Error('Permission Android refusée'));
        }
        
        return permissionGranted;
      }
    } catch (err) {
      console.warn('Erreur lors de la demande de permission:', err);
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(new Error(`Erreur de permission: ${errorMessage}`));
      return false;
    } finally {
      setLoading(false);
    }
  }, [t]);

  const getCurrentLocation = useCallback(async (): Promise<LocationData | null> => {
    try {
      setError(null);
      
      if (Platform.OS === 'android' && !permissionGranted) {
        console.log('Demande de permission de localisation...');
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          const errorMsg = 'Permission de localisation non accordée';
          console.warn(errorMsg);
          setError(new Error(errorMsg));
          return null;
        }
      }

      setLoading(true);
      console.log('Tentative de récupération de la position...');
      
      // Utilisation d'un timeout de sécurité
      const locationPromise = new Promise<LocationData>((resolve, reject) => {
        const safetyTimeout = setTimeout(() => {
          reject(new Error('Timeout de sécurité - la récupération de position prend trop de temps'));
        }, 20000);

        Geolocation.getCurrentPosition(
          (position) => {
            clearTimeout(safetyTimeout);
            
            const locationData: LocationData = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy || 0,
              timestamp: position.timestamp
            };
            
            setLocation(locationData);
            saveLocationToStorage(locationData);
            resolve(locationData);
          },
          (error) => {
            clearTimeout(safetyTimeout);
            
            let errorMessage = 'Erreur lors de la récupération de la position';
            
            // Mappage des codes d'erreur
            switch (error.code) {
              case 1:
                errorMessage = 'Permission refusée pour accéder à la localisation';
                break;
              case 2:
                errorMessage = 'Position indisponible - Vérifiez que le GPS est activé';
                break;
              case 3:
                errorMessage = 'Délai d\'attente dépassé pour obtenir la position';
                break;
              default:
                errorMessage = `Erreur de géolocalisation: ${error.message || 'Inconnue'}`;
            }
            
            reject(new Error(errorMessage));
          },
          {
            enableHighAccuracy: false,
            timeout: 15000,
            maximumAge: 10000
          }
        );
      });

      try {
        const result = await locationPromise;
        setLoading(false);
        return result;
      } catch (promiseError) {
        console.warn('Erreur de géolocalisation:', promiseError);
        setError(promiseError instanceof Error ? promiseError : new Error(String(promiseError)));
        setLoading(false);
        return null;
      }
    } catch (globalError) {
      console.error('Erreur globale dans getCurrentLocation:', globalError);
      setError(new Error('Erreur inattendue lors de l\'obtention de la localisation'));
      setLoading(false);
      return null;
    }
  }, [permissionGranted, requestLocationPermission, saveLocationToStorage]);

  // Demander la permission de localisation en arrière-plan (uniquement pour Android)
  const requestBackgroundPermission = useCallback(async () => {
    if (Platform.OS !== 'android') {
      // Sur iOS, la permission "always" est déjà demandée séparément
      return true;
    }
    
    try {
      // Vérifier d'abord si la permission de localisation standard est accordée
      if (!permissionGranted) {
        const hasPermission = await requestLocationPermission();
        if (!hasPermission) {
          return false;
        }
      }
      
      // Maintenant, demander la permission d'arrière-plan
      // Notez que sur Android 10+, il faut d'abord expliquer à l'utilisateur
      // pourquoi vous avez besoin de la localisation en arrière-plan
      if (Platform.Version >= 26) {
        // Afficher un dialogue explicatif avant de demander la permission
        // (ici nous supposons que vous avez une fonction pour cela)
        // await showBackgroundPermissionRationale();
        
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_BACKGROUND_LOCATION,
          {
            title: t('permissions.backgroundLocationTitle'),
            message: t('permissions.backgroundLocationMessage'),
            buttonNeutral: t('permissions.askLater'),
            buttonNegative: t('permissions.cancel'),
            buttonPositive: t('permissions.ok')
          }
        );
        
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        setBackgroundPermissionGranted(isGranted);
        
        return isGranted;
      }
      
      // Sur les versions Android < 10, la permission normale inclut déjà l'arrière-plan
      setBackgroundPermissionGranted(true);
      return true;
    } catch (error) {
      console.error('Error requesting background location permission:', error);
      setBackgroundPermissionGranted(false);
      return false;
    }
  }, [permissionGranted, requestLocationPermission, t]);

  const watchPosition = useCallback((callback?: LocationCallback): number => {
    if (Platform.OS === 'android' && !permissionGranted) {
      requestLocationPermission().then(granted => {
        if (!granted) {
          const permissionError = new Error('Permission de localisation non accordée');
          setError(permissionError);
          callback && callback(null, permissionError);
          return -1;
        }
      }).catch(error => {
        console.error('Erreur lors de la demande de permission:', error);
        callback && callback(null, error instanceof Error ? error : new Error(String(error)));
        return -1;
      });
    }

    return Geolocation.watchPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy || 0,
          timestamp: position.timestamp
        };
        
        setLocation(locationData);
        saveLocationToStorage(locationData);
        callback && callback(locationData);
      },
      (error) => {
        const locationError = new Error(error.message || 'Erreur de suivi de position');
        setError(locationError);
        callback && callback(null, locationError);
      },
      {
        enableHighAccuracy: false,
        distanceFilter: 10,
        interval: 5000,
        fastestInterval: 2000
      }
    );
  }, [permissionGranted, requestLocationPermission, saveLocationToStorage]);

  const clearWatch = useCallback((watchId: number | null): void => {
    if (watchId !== null && watchId >= 0) {
      Geolocation.clearWatch(watchId);
    }
  }, []);

  // Fonction de secours pour les cas où la géolocalisation échoue complètement
  const getMockLocation = useCallback(async (): Promise<LocationData> => {
    console.warn('Utilisation d\'une position factice pour le développement');
    
    // Position par défaut (par exemple, centre de votre ville ou pays)
    const mockLocation: LocationData = {
      latitude: 12.3456, // À remplacer par vos coordonnées par défaut
      longitude: 1.2345,
      accuracy: 100,
      timestamp: Date.now()
    };
    
    setLocation(mockLocation);
    await saveLocationToStorage(mockLocation);
    return mockLocation;
  }, [saveLocationToStorage]);

  return {
    location,
    error,
    loading,
    permissionGranted,
    requestLocationPermission,
    requestBackgroundPermission,
    getCurrentLocation,
    watchPosition,
    clearWatch,
    saveLocationToStorage,
    getLastSavedLocation,
    getMockLocation
  };
};