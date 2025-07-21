import React from 'react';
import { View, StyleSheet, ScrollView, Text, useWindowDimensions, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { AvicoleStackParamList } from '../../../../types/navigations';
import { useTheme } from '../../../../contexts/ThemeContext';
import { IconName } from '../../../../constants/icons';
import { IconType } from '../../../../enums/Button/buttons';
import LinearGradient from 'react-native-linear-gradient';
import GestionButton from '../../../../components/Button/GestionButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type AvicoleHomeScreenNavigationProp = StackNavigationProp<AvicoleStackParamList, 'Home'>;

const AvicoleManagement = () => {
  const navigation = useNavigation<AvicoleHomeScreenNavigationProp>();
  const { t } = useTranslation('avicole');
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;

  const menuItems = [
    {
      title: t('management.lot_management'),
      icon: IconName.Barn,
      screen: 'LotManagement',
      gradientColors: [colors.plant, isDark ? '#A5D6A7' : '#66BB6A'],
    },
    {
      title: t('management.egg_controls'),
      icon: IconName.Egg,
      screen: 'PonteManagement',
      gradientColors: [colors.animal, isDark ? '#F48FB1' : '#F06292'],
    },
    {
      title: t('management.performance'),
      icon: IconName.Growth,
      iconType: IconType.Feather,
      screen: 'PerformanceManagement',
      gradientColors: [colors.water, isDark ? '#4DD0E1' : '#4FC3F7'],
    },
    {
      title: t('management.weighing'),
      icon: IconName.Scale,
      screen: 'PeseeManagement',
      gradientColors: [colors.secondary, isDark ? '#A1887F' : '#8D6E63'],
    },
    {
      title: t('management.analysis_alerts'),
      icon: IconName.Analytics,
      iconType: IconType.Feather,
      screen: 'AnalyseManagement',
      gradientColors: [colors.info, isDark ? '#82B1FF' : '#2196F3'],
    },
    {
      title: t('management.predictions'),
      icon: IconName.Timeline,
      screen: 'PredictionManagement',
      gradientColors: [colors.primaryLight, isDark ? '#C8E6C9' : '#81C784'],
    },
  ];

  // Calcul dynamique des colonnes selon la taille d'écran
  const getColumnsCount = () => {
    if (isTablet && isLandscape) return 3;
    if (isTablet || (isLandscape && width > 600)) return 2;
    return 1;
  };

  const columnsCount = getColumnsCount();
  const buttonWidth = columnsCount === 1 ? '100%' : 
                     columnsCount === 2 ? '48%' : '31%';

  return (
    <LinearGradient
      colors={isDark ? ['#4A5568', '#2D3748'] : ['#FED7AA', '#FBBF24', '#F59E0B']}
      style={styles.gradientBackground}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <ScrollView 
        contentContainerStyle={[
          styles.container, 
          { 
            paddingHorizontal: spacing.large,
            paddingTop: Platform.OS === 'ios' ? 60 : 40,
            paddingBottom: spacing.xlarge
          }
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Bouton de retour */}
        <TouchableOpacity 
          style={[styles.backButton, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <Icon 
            name="arrow-left" 
            size={24} 
            color={isDark ? colors.white : '#8B4513'} 
          />
        </TouchableOpacity>

        {/* Header avec style poussin */}
        <View style={[styles.header, { marginBottom: spacing.xlarge }]}>
          <Text style={[
            styles.title,
            { 
              color: isDark ? colors.white : '#8B4513',
              fontSize: isTablet ? typography.header.fontSize * 1.3 : typography.header.fontSize * 1.1,
              marginBottom: spacing.small,
              textShadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.8)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 2,
            }
          ]}>
            {t('management.title')}
          </Text>
          <Text style={[
            styles.subtitle, 
            { 
              color: isDark ? colors.textSecondary : '#A0522D',
              fontSize: isTablet ? typography.body.fontSize * 1.1 : typography.body.fontSize,
              textShadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            }
          ]}>
            {t('management.subtitle')}
          </Text>
        </View>
        
        {/* Grille de boutons adaptative */}
        <View style={[
          styles.buttonGrid,
          { 
            maxWidth: isTablet ? 1000 : 600,
            alignSelf: 'center',
            width: '100%'
          }
        ]}>
          {menuItems.map((item, index) => (
            <View
              key={index}
              style={[
                styles.buttonWrapper,
                { 
                  width: buttonWidth,
                  marginBottom: spacing.medium,
                }
              ]}
            >
              <View style={[
                styles.shadowContainer,
                { 
                  shadowColor: isDark ? 'rgba(0,0,0,0.8)' : 'rgba(0,0,0,0.15)',
                  shadowOffset: { width: 0, height: 6 },
                  shadowOpacity: 0.2,
                  shadowRadius: 12,
                  elevation: 12,
                }
              ]}>
                <GestionButton
                  text={item.title}
                  icon={item.icon}
                  iconType={item.iconType}
                  onPress={() => navigation.navigate(item.screen as keyof AvicoleStackParamList)}
                  primary
                  style={{
                    ...styles.button,
                    height: isTablet ? 100 : 88,
                    minHeight: isTablet ? 100 : 88,
                  }}
                  textStyle={{
                    ...styles.buttonText,
                    fontSize: isTablet ? 17 : 15,
                    maxWidth: '80%', // Évite le débordement du texte
                  }}
                  gradientColors={item.gradientColors}
                  isTablet={isTablet}
                />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
    minHeight: '100%',
  },
  backButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    left: 20,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    zIndex: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    alignItems: 'center',
    paddingHorizontal: 16,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    textAlign: 'center',
    lineHeight: 22,
    letterSpacing: 0.3,
  },
  buttonGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  buttonWrapper: {
    // Assure un espacement correct
  },
  shadowContainer: {
    borderRadius: 18,
    backgroundColor: 'transparent',
    // Ombre optimisée pour tous les écrans
  },
  button: {
    borderRadius: 18,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  buttonText: {
    fontWeight: '600',
    letterSpacing: 0.4,
    lineHeight: 20,
    textAlign: 'center',
  },
});

export default AvicoleManagement;