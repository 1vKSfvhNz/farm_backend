import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  StatusBar,
  Alert
} from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useLocationContext } from '../../../contexts/LocationContext';
import { useAuth } from '../../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';
import { useNavigation } from '@react-navigation/native';
import { NavigationProp } from '../../../types/navigations';
import { colors } from '../../../constants/colors';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SettingItemProps, SettingsSectionProps } from '../../../types/types';

// Keys for saving preferences
const LOCATION_ENABLED_KEY = '@app_location_enabled';

const SettingsScreen: React.FC = () => {
  // States for settings
  const { permissionGranted, requestLocationPermission, location, getCurrentLocation } = useLocationContext();
  const [locationServices, setLocationServices] = useState(permissionGranted);
  
  // Using hooks
  const { logout } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();
  
  // Custom color palette
  const settingColors = {
    background: colors.background,
    card: colors.card,
    text: colors.text,
    subtext: '#8E8E93',
    border: colors.border,
    primary: colors.primary,
    accent: colors.primary,
    danger: '#FF3B30',
    success: '#34C759',
    warning: '#FFCC00',
  };

  // Update locationServices when permissionGranted changes
  useEffect(() => {
    const updateLocationServices = async () => {
      try {
        const savedPreference = await AsyncStorage.getItem(LOCATION_ENABLED_KEY);
        const isEnabled = savedPreference === 'true';
        
        setLocationServices(isEnabled && permissionGranted);
        
        if (isEnabled && !permissionGranted) {
          Alert.alert(
            t('location.permissionChangedTitle'),
            t('location.permissionChangedMessage'),
            [
              { text: t('actions.cancel'), style: 'cancel' },
              { 
                text: t('actions.grant'), 
                onPress: () => requestLocationPermission() 
              }
            ]
          );
        }
      } catch (error) {
        console.error('Error updating location preferences:', error);
      }
    };
    
    updateLocationServices();
  }, [permissionGranted]);
  
  // Handle actions
  const handlePasswordChange = () => {
    navigation.navigate('Recovery');
  };

  const handlePhoneChange = () => {
    navigation.navigate('ChangePhone');
  };

  const handleLanguagePress = () => {
    navigation.navigate('Language');
  };

  // Handle location toggle
  const handleLocationToggle = async () => {
    if (!locationServices) {
      // Enable location services
      const granted = await requestLocationPermission();
      
      if (granted) {
        setLocationServices(true);
        await AsyncStorage.setItem(LOCATION_ENABLED_KEY, 'true');
        // Get location if permission granted
        try {
          await getCurrentLocation();
        } catch (error) {
          console.warn('Error getting location:', error);
        }
      } else {
        // Permission denied
        Alert.alert(
          t('location.PermissionDeniedTitle'),
          t('location.PermissionDeniedMessage')
        );
      }
    } else {
      // Disable location services
      setLocationServices(false);
      await AsyncStorage.setItem(LOCATION_ENABLED_KEY, 'false');
    }
  };
  
  const handleLogout = async () => {
    Alert.alert(
      t('menu.logout'),
      t('confirmLogout'),
      [
        { text: t('actions.cancel'), style: "cancel" },
        { 
          text: t('menu.logout'), 
          style: "destructive",
          onPress: async () => {
            // Disconnect WebSocket before logout
            await logout();
            navigation.navigate('Login');
          }
        }
      ]
    );
  };

  // Component for a settings item
  const SettingItem: React.FC<SettingItemProps> = ({ 
    icon,
    iconType = 'ionicon',
    title, 
    description, 
    value, 
    onValueChange, 
    type, 
    onPress,
    tintColor
  }) => {
    return (
      <TouchableOpacity 
        style={[styles.settingItem, { borderBottomColor: settingColors.border }]}
        disabled={type === 'switch' || !onPress}
        onPress={onPress}
      >
        <View style={[styles.settingIconContainer, { backgroundColor: tintColor ? `${tintColor}20` : 'transparent' }]}>
          {iconType === 'ionicon' ? (
            <Ionicons name={icon} size={22} color={tintColor || settingColors.accent} />
          ) : (
            <MaterialIcons name={icon} size={22} color={tintColor || settingColors.accent} />
          )}
        </View>
        <View style={styles.settingContent}>
          <Text style={[styles.settingTitle, { color: settingColors.text }]}>{title}</Text>
          {description && (
            <Text style={[styles.settingDescription, { color: settingColors.subtext }]}>
              {description}
            </Text>
          )}
        </View>
        {type === 'switch' && (
          <View style={styles.navigationContainer}>
            <Ionicons name="chevron-forward" size={20} color={settingColors.subtext} />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Component for a settings section
  const SettingsSection: React.FC<SettingsSectionProps> = ({ title, children }) => (
    <View style={styles.settingsSection}>
      <Text style={[styles.sectionTitle, { color: settingColors.subtext }]}>{title}</Text>
      <View style={[styles.sectionContent, { backgroundColor: settingColors.card, borderColor: settingColors.border }]}>
        {children}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: settingColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: settingColors.card, borderBottomColor: settingColors.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: settingColors.text }]}>{t('settings.title')}</Text>
        <View style={styles.headerRight} />
      </View>
      
      {/* Main content */}
      <ScrollView contentContainerStyle={styles.scrollViewContent}>
        {/* Account Section */}
        <SettingsSection title={t('settings.account')}>
          <SettingItem
            icon="key-outline"
            title={t('settings.password')}
            description={t('settings.passwordDetails')}
            type="navigation"
            onPress={handlePasswordChange}
          />
          <SettingItem
            icon="phone-portrait-outline"
            title={t('settings.phone')}
            description={t('settings.phoneDetails')}
            type="navigation"
            onPress={handlePhoneChange}
          />
        </SettingsSection>

        {/* Preferences Section */}
        <SettingsSection title={t('settings.prefer')}>
          <SettingItem
            icon="language-outline"
            title={t('settings.language')}
            description={t('settings.languageDetail')}
            type="navigation"
            onPress={handleLanguagePress}
          />
        </SettingsSection>

        {/* Privacy Section */}
        <SettingsSection title="Confidentialité">
          <SettingItem
            icon="location-outline"
            title={t('settings.localisation')}
            description={location 
              ? `${t('settings.localisationAuth')} (${location.latitude.toFixed(2)}, ${location.longitude.toFixed(2)})`
              : t('settings.localisationAuth')
            }
            value={locationServices}
            onValueChange={handleLocationToggle}
            type="switch"
            tintColor={settingColors.primary}
          />
        </SettingsSection>

        {/* Logout button */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={[styles.logoutButton, { backgroundColor: settingColors.danger }]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutText}>{t('menu.logout')}</Text>
          </TouchableOpacity>          
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  scrollViewContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    width: 32, // To balance the header
  },
  settingsSection: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionContent: {
    borderRadius: 12,
    marginHorizontal: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 0.5,
  },
  settingIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  settingContent: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDescription: {
    fontSize: 14,
    marginTop: 4,
  },
  navigationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingValue: {
    fontSize: 14,
    marginRight: 8,
  },
  footer: {
    marginTop: 40,
    marginBottom: 20,
    alignItems: 'center',
  },
  logoutButton: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.5,
  },
  logoutText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  versionText: {
    marginTop: 20,
    fontSize: 14,
  },
});

export default React.memo(SettingsScreen);