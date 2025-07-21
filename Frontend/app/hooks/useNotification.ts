// hooks/useNotification.ts
import { useCallback, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert, Linking } from 'react-native';
import { FetchPOST } from '../constants/constantsFetch';  // Assure-toi que ce chemin est correct
import { useTranslation } from 'react-i18next';

const NOTIFICATION_ENABLED_KEY = '@notifications_enabled';

export const useNotification = (authToken: string | null) => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const { t } = useTranslation();

  // Vérifier les permissions de notification
  const checkPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return result;
      } else {
        return true; // Pas nécessaire en dessous de l'API 33
      }
    } else {
      // iOS : pas de PermissionsAndroid → invite à activer manuellement si besoin
      // Ici, on retourne true par défaut pour ne pas bloquer, ou tu peux ajouter une vérif native
      return true;
    }
  };

  // Demander les permissions de notification
  const requestPermission = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
        return result === PermissionsAndroid.RESULTS.GRANTED;
      } else {
        return true;
      }
    } else {
      // iOS : Affiche une alerte pour informer l'utilisateur
      Alert.alert(
        t('notifications.permissionTitle'),
        t('notifications.permissionDeniedMessage'),
        [
          { text: t('common.cancel'), style: 'cancel' }, // Assure-toi que "common.cancel" existe, sinon remplace par une chaîne brute
          {
            text: t('notifications.settings'),
            onPress: () => Linking.openURL('app-settings:')
          }
        ]
      );
      return false; // on retourne false car la permission n'est pas réellement acquise
    }
  };

  // Fonction qui gère le déblocage des notifications spécifiquement
  const unblockNotifications = useCallback(() => {
    if (Platform.OS !== 'android') return;
    Alert.alert(
      t('notifications.blockedTitle') || 'Notifications bloquées',
      t('notifications.blockedDescription') || 'Les notifications sont bloquées dans les paramètres système. Voulez-vous ouvrir les paramètres pour les activer?',
      [
          { text: t('actions.cancel'), style: 'cancel' },
          { 
          text: t('notifications.openSettings') || 'Ouvrir les paramètres', 
          onPress: Linking.openSettings 
          }
      ]
    );
  }, [t]);
  
  // Activer les notifications
  const enableNotifications = async (): Promise<boolean> => {
    const granted = await checkPermission();
    if (!granted) {
      const permission = await requestPermission();
      if (!permission) return false;
    }

    setNotificationsEnabled(true);
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'true');
    return true;
  };

  // Désactiver les notifications
  const disableNotifications = async () => {
    setNotificationsEnabled(false);
    await AsyncStorage.setItem(NOTIFICATION_ENABLED_KEY, 'false');
  };

  // Basculer l'état des notifications
  const toggleNotifications = async () => {
    await FetchPOST(authToken, 'notifications/preference', { enabled: !notificationsEnabled});
    if (notificationsEnabled) {
      await disableNotifications();
    } else {
      await enableNotifications();
    }
  };

  return {
    notificationsEnabled,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
    unblockNotifications,
    checkPermission,
    requestPermission,
    loading,
  };
};
