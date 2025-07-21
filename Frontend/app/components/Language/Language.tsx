import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  FlatList,
  NativeModules
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import Ionicons from 'react-native-vector-icons/Ionicons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LanguageProps } from '../../interfaces/language';
import { languages } from '../../constants/language';
import { sendLangToServer } from '../../translations/i18n';
import { colors } from '../../constants/colors';

const { SharedPrefModule } = NativeModules;

const Language: React.FC = () => {
  const navigation = useNavigation();
  const { t, i18n } = useTranslation();
  const [selectedLanguage, setSelectedLanguage] = useState<string>(i18n.language);

  // Load selected language on component mount
  useEffect(() => {
    const loadLanguage = async () => {
      try {
        const storedLanguage = await AsyncStorage.getItem('@language');
        if (storedLanguage) {
          setSelectedLanguage(storedLanguage);
        }
      } catch (error) {
        console.error('Error loading language:', error);
      }
    };

    loadLanguage();
  }, []);

  // Handle language selection
  const handleLanguageSelect = async (langCode: string) => {
    try {
      // Highlight effect
      setSelectedLanguage(langCode);
      
      // Change i18n language
      await i18n.changeLanguage(langCode);
      
      // Store selected language
      await AsyncStorage.setItem('@language', langCode);
      SharedPrefModule.setItem('@language', langCode);
      sendLangToServer(langCode);
      
      // Navigate back after a short delay to give feedback
      setTimeout(() => {
        navigation.goBack();
      }, 500);
    } catch (error) {
      console.error('Error changing language:', error);
    }
  };

  // Get colors based on theme
  const screenColors = {
    background: colors.background,
    card: colors.card,
    text: colors.text,
    subtext: colors.subtext,
    border: colors.border,
    accent: colors.primary,
  };

  // Get country code for display
  const getCountryCode = (langCode: string): string => {
    switch(langCode) {
      case 'en': return 'US';
      case 'fr': return 'FR';
      case 'es': return 'ES';
      case 'de': return 'DE';
      case 'it': return 'IT';
      case 'pt': return 'PT';
      default: return langCode.toUpperCase();
    }
  };

  // Render language item in grid
  const renderLanguageItem = ({ item }: { item: LanguageProps }) => {
    const isSelected = selectedLanguage === item.code;
    const countryCode = getCountryCode(item.code);
    
    return (
      <TouchableOpacity
        style={[
          styles.languageCard,
          { 
            backgroundColor: screenColors.card,
            borderColor: isSelected ? screenColors.accent : screenColors.border,
            borderWidth: isSelected ? 2 : 1,
          }
        ]}
        onPress={() => handleLanguageSelect(item.code)}
      >
        <View style={[
          styles.iconContainer, 
          { backgroundColor: isSelected ? `${screenColors.accent}20` : '#F0F0F0' }
        ]}>
          <Text style={styles.countryCode}>{countryCode}</Text>
        </View>
        <Text style={[styles.languageName, { color: screenColors.text }]}>
          {item.nativeName}
        </Text>
        {isSelected && (
          <View style={[styles.checkmark, { backgroundColor: screenColors.accent }]}>
            <Ionicons name="checkmark" size={16} color="#FFFFFF" />
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenColors.background }]}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: screenColors.card, borderBottomColor: screenColors.border }]}>
        <TouchableOpacity onPress={navigation.goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={screenColors.accent} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: screenColors.text }]}>
          {t('settings.language')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      {/* LanguageProps selection grid */}
      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: screenColors.subtext }]}>
          {t('settings.selectLanguage')}
        </Text>
        <FlatList
          data={languages}
          renderItem={renderLanguageItem}
          keyExtractor={(item) => item.code}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.columnWrapper}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
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
    width: 32, // Balance the header
  },
  content: {
    flex: 1,
    paddingTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 20,
    marginBottom: 16,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  gridContainer: {
    paddingHorizontal: 12,
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  languageCard: {
    width: '48%',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    position: 'relative',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  countryCode: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  languageName: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default React.memo(Language);