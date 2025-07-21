import React, { createContext, useEffect, useCallback, useState, useMemo } from 'react';
import { PermissionsAndroid, Platform, AppState, AppStateStatus } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { FetchCREATE, FetchPOST } from "../constants/constantsFetch";
import { useNotification } from '../hooks/useNotification';
import { VERSION } from '../constants/infos';
import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';

const FCM_TOKEN_KEY = '@farm_fcm_token';

interface NotificationContextType {
  fcmToken: string | null;
  checkNotificationPermissions: () => Promise<boolean>;
  refreshFcmToken: () => Promise<void>;
  isPermissionGranted: boolean;
  notificationsEnabled: boolean;
  toggleNotifications: () => Promise<void>;
  enableNotifications: () => Promise<boolean>;
  disableNotifications: () => Promise<void>;
  unblockNotifications: () => void;
}

interface TokenVerificationResponse {
  registered: boolean;
}

const defaultNotificationContext: NotificationContextType = {
  fcmToken: null,
  checkNotificationPermissions: () => Promise.resolve(false),
  refreshFcmToken: () => Promise.resolve(),
  isPermissionGranted: false,
  notificationsEnabled: false,
  toggleNotifications: () => Promise.resolve(),
  enableNotifications: () => Promise.resolve(false),
  disableNotifications: () => Promise.resolve(),
  unblockNotifications: () => {}
};

const NotificationContext = createContext<NotificationContextType>(defaultNotificationContext);

const checkNotificationPermissions = async (): Promise<boolean> => {
  try {
    if (Platform.OS === 'android') {
      if (Platform.Version >= 33) {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      }
      return true;
    } else if (Platform.OS === 'ios') {
      const authStatus = await messaging().requestPermission();
      return (
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL
      );
    }
    return false;
  } catch (error) {
    console.error(`Error checking ${Platform.OS} notification permissions:`, error);
    return false;
  }
};

const getFCMToken = async (): Promise<string | null> => {
  try {
    const hasPermission = await checkNotificationPermissions();
    if (!hasPermission) return null;

    const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (storedToken) return storedToken;

    const token = await messaging().getToken();
    if (!token) return null;

    await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
    return token;
  } catch (error) {
    console.error('Error in getFCMToken:', error);
    return null;
  }
};

const sendTokenToServer = async (
  token: string,
  platform: string,
  authToken: string
): Promise<boolean> => {
  try {
    const deviceName = await DeviceInfo.getDeviceName();
    const response = await FetchCREATE(authToken, 'manager/device/register', {
      device_token: token,
      platform,
      app_version: VERSION,
      device_name: deviceName,
    });

    if (!response.ok) throw new Error(`Server responded with status ${response.status}`);
    return true;
  } catch (error) {
    console.error('Error in sendTokenToServer:', error);
    return false;
  }
};

const verifyTokenRegistration = async (authToken: string): Promise<boolean> => {
  try {
    const token = await AsyncStorage.getItem(FCM_TOKEN_KEY);
    if (!token) return false;

    const response = await FetchPOST(authToken, 'manager/device/verify', {
      device_token: token,
      platform: Platform.OS,
      app_version: VERSION,
      device_name: await DeviceInfo.getDeviceName(),
    });

    if (!response.ok) {
      return await sendTokenToServer(token, Platform.OS, authToken);
    }

    const data: TokenVerificationResponse = await response.json();
    return data.registered;
  } catch (error) {
    console.error('Error in verifyTokenRegistration:', error);
    return false;
  }
};

const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { authToken } = useAuth();
  const [fcmToken, setFcmToken] = useState<string | null>(null);
  const [isPermissionGranted, setIsPermissionGranted] = useState(false);
  
  // Intégration complète du hook useNotification
  const {
    notificationsEnabled,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
    unblockNotifications
  } = useNotification(authToken || '');

  const refreshFcmToken = useCallback(async () => {
    try {
      const hasPermission = await checkNotificationPermissions();
      setIsPermissionGranted(hasPermission);
      
      if (!hasPermission) {
        setFcmToken(null);
        return;
      }

      const token = await getFCMToken();
      setFcmToken(token);
      
      if (token && authToken) {
        await sendTokenToServer(token, Platform.OS, authToken);
      }
    } catch (error) {
      console.error('Error in refreshFcmToken:', error);
    }
  }, [authToken]);

  useEffect(() => {
    if (!isPermissionGranted) return;

    const unsubscribe = messaging().onMessage(async (remoteMessage: FirebaseMessagingTypes.RemoteMessage) => {
      console.log('Foreground message received:', remoteMessage);
      // Ajoutez ici la logique de gestion des notifications
    });

    return unsubscribe;
  }, [isPermissionGranted]);

  useEffect(() => {
    const initialize = async () => {
      await refreshFcmToken();
      if (authToken) {
        await verifyTokenRegistration(authToken);
      }
    };
    initialize();
  }, [authToken, refreshFcmToken]);

  useEffect(() => {
    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        await refreshFcmToken();
        if (authToken) {
          await verifyTokenRegistration(authToken);
        }
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription.remove();
  }, [authToken, refreshFcmToken]);

  const contextValue = useMemo(() => ({
    fcmToken,
    isPermissionGranted,
    notificationsEnabled,
    checkNotificationPermissions,
    refreshFcmToken,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
    unblockNotifications
  }), [
    fcmToken,
    isPermissionGranted,
    notificationsEnabled,
    refreshFcmToken,
    toggleNotifications,
    enableNotifications,
    disableNotifications,
    unblockNotifications
  ]);

  return (
    <NotificationContext.Provider value={contextValue}>
      {children}
    </NotificationContext.Provider>
  );
};

const useNotificationContext = () => {
  const context = React.useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotificationContext must be used within a NotificationProvider');
  }
  return context;
};

export { NotificationProvider, useNotificationContext };