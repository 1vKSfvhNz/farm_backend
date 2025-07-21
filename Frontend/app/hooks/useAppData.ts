import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ButtonCardVariant } from '../components/Button/AnimalCard';
import { FetchGET } from '../constants/constantsFetch';
import { useAuth } from '../contexts/AuthContext';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface AnimalStats {
  variant: ButtonCardVariant;
  count: number;
  health: number;
  production: number;
  lastUpdate: Date;
  isNew?: boolean;
  isUrgent?: boolean;
}

export interface GlobalStats {
  totalAnimals: number;
  averageHealth: number;
  averageProduction: number;
  lastSync: Date;
}

export interface FarmData {
  animals: AnimalStats[];
  globalStats: GlobalStats;
}

interface UseAppDataReturn {
  animalData: AnimalStats[];
  globalStats: GlobalStats | null;
  isLoading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  updateAnimalData: (variant: ButtonCardVariant, data: Partial<AnimalStats>) => Promise<void>;
  syncWithServer: () => Promise<void>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

const STORAGE_KEYS = {
  ANIMAL_DATA: '@farm_animal_data',
  GLOBAL_STATS: '@farm_global_stats',
  LAST_SYNC: '@farm_last_sync',
};

// Durée avant que les données soient considérées comme périmées (30 minutes)
const DATA_STALE_TIME_MS = 30 * 60 * 1000;

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useAppData = (): UseAppDataReturn => {
  const [animalData, setAnimalData] = useState<AnimalStats[]>([]);
  const [globalStats, setGlobalStats] = useState<GlobalStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { authToken } = useAuth();

  // =========================================================================
  // HELPER FUNCTIONS
  // =========================================================================

  const isDataStale = (lastSync: Date): boolean => {
    return Date.now() - lastSync.getTime() > DATA_STALE_TIME_MS;
  };

  const calculateGlobalStats = (animals: AnimalStats[]): GlobalStats => {
    const totalAnimals = animals.reduce((sum, animal) => sum + animal.count, 0);
    const averageHealth = animals.reduce((sum, animal) => sum + animal.health, 0) / animals.length;
    const averageProduction = animals.reduce((sum, animal) => sum + animal.production, 0) / animals.length;

    return {
      totalAnimals,
      averageHealth: parseFloat(averageHealth.toFixed(1)),
      averageProduction: parseFloat(averageProduction.toFixed(1)),
      lastSync: new Date(),
    };
  };

  // =========================================================================
  // STORAGE OPERATIONS
  // =========================================================================

  const loadFromStorage = useCallback(async (): Promise<FarmData | null> => {
    try {
      const [animalDataStr, globalStatsStr] = await Promise.all([
        AsyncStorage.getItem(STORAGE_KEYS.ANIMAL_DATA),
        AsyncStorage.getItem(STORAGE_KEYS.GLOBAL_STATS),
      ]);

      if (!animalDataStr || !globalStatsStr) return null;

      return {
        animals: JSON.parse(animalDataStr).map((animal: any) => ({
          ...animal,
          lastUpdate: new Date(animal.lastUpdate),
        })),
        globalStats: {
          ...JSON.parse(globalStatsStr),
          lastSync: new Date(JSON.parse(globalStatsStr).lastSync),
        },
      };
    } catch (err) {
      console.error('Erreur de lecture du stockage local:', err);
      return null;
    }
  }, []);

  const saveToStorage = useCallback(async (data: FarmData): Promise<void> => {
    try {
      await Promise.all([
        AsyncStorage.setItem(STORAGE_KEYS.ANIMAL_DATA, JSON.stringify(data.animals)),
        AsyncStorage.setItem(STORAGE_KEYS.GLOBAL_STATS, JSON.stringify(data.globalStats)),
        AsyncStorage.setItem(STORAGE_KEYS.LAST_SYNC, new Date().toISOString()),
      ]);
    } catch (err) {
      console.error('Erreur de sauvegarde locale:', err);
      throw err;
    }
  }, []);

  // =========================================================================
  // DATA MANAGEMENT
  // =========================================================================

  const fetchFromAPI = useCallback(async (): Promise<FarmData> => {
    try {
      if (!authToken) throw new Error('Token d\'authentification manquant');

      const response = await FetchGET(authToken, 'api/elevage/stats');
      if (!response.ok) throw new Error('Erreur réseau');

      const data: FarmData = await response.json();
      return {
        ...data,
        animals: data.animals.map(animal => ({
          ...animal,
          lastUpdate: new Date(animal.lastUpdate),
        })),
        globalStats: {
          ...data.globalStats,
          lastSync: new Date(),
        },
      };
    } catch (err) {
      console.error('Erreur API:', err);
      throw err;
    }
  }, [authToken]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // 1. Essayer de charger depuis le stockage local
      const localData = await loadFromStorage();

      // 2. Si données inexistantes ou périmées, charger depuis l'API
      const data = !localData || isDataStale(localData.globalStats.lastSync)
        ? await fetchFromAPI()
        : localData;

      // 3. Mettre à jour le state et sauvegarder si nécessaire
      setAnimalData(data.animals);
      setGlobalStats(data.globalStats);

      if (!localData || isDataStale(localData.globalStats.lastSync)) {
        await saveToStorage(data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
      console.error('Erreur de chargement:', err);
    } finally {
      setIsLoading(false);
    }
  }, [fetchFromAPI, loadFromStorage, saveToStorage]);

  const refreshData = useCallback(async () => {
    try {
      const data = await fetchFromAPI();
      await saveToStorage(data);
      setAnimalData(data.animals);
      setGlobalStats(data.globalStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de rafraîchissement');
    }
  }, [fetchFromAPI, saveToStorage]);

  const updateAnimalData = useCallback(
    async (variant: ButtonCardVariant, updates: Partial<AnimalStats>) => {
      const updatedAnimals = animalData.map(animal =>
        animal.variant === variant
          ? { ...animal, ...updates, lastUpdate: new Date() }
          : animal
      );

      const newGlobalStats = calculateGlobalStats(updatedAnimals);

      setAnimalData(updatedAnimals);
      setGlobalStats(newGlobalStats);

      await saveToStorage({
        animals: updatedAnimals,
        globalStats: newGlobalStats,
      });
    },
    [animalData, saveToStorage]
  );

  const syncWithServer = useCallback(async () => {
    try {
      await refreshData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de synchronisation');
    }
  }, [refreshData]);

  // =========================================================================
  // EFFECTS
  // =========================================================================

  // Chargement initial
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Synchronisation automatique toutes les 5 minutes
  useEffect(() => {
    const interval = setInterval(syncWithServer, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [syncWithServer]);

  // =========================================================================
  // RETURN
  // =========================================================================

  return {
    animalData,
    globalStats,
    isLoading,
    error,
    refreshData,
    updateAnimalData,
    syncWithServer,
  };
};