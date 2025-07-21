import React from 'react';
import { View, StyleSheet, ScrollView, Text, useWindowDimensions, Dimensions, Platform, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { NavigationProp, PiscicoleStackParamList } from '../../../../types/navigations';
import { useTheme } from '../../../../contexts/ThemeContext';
import { IconName } from '../../../../constants/icons';
import { IconType } from '../../../../enums/Button/buttons';
import LinearGradient from 'react-native-linear-gradient';
import GestionButton from '../../../../components/Button/GestionButton';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

type MenuItem = {
  title: string;
  icon: IconName;
  iconType: IconType;
  screen: keyof PiscicoleStackParamList;
  gradientColors: string[];
};

const PiscicoleManagement = () => {
  const navigation = useNavigation<StackNavigationProp<PiscicoleStackParamList>>();
  const back = useNavigation<NavigationProp>();
  const { t } = useTranslation('piscicole');
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;

  const menuItems: MenuItem[] = [
    {
      title: t('management.bassin_management'),
      icon: IconName.Pool,
      iconType: IconType.MaterialCommunityIcons,
      screen: 'BassinManagement',
      gradientColors: isDark 
        ? ['#0066CC', '#4DD0E1']  // Bleu marine à bleu clair (nuit)
        : ['#4FC3F7', '#0288D1'], // Bleu ciel à bleu profond (jour)
    },
    {
      title: t('management.poisson_management'),
      icon: IconName.Piscicole,
      iconType: IconType.MaterialCommunityIcons,
      screen: 'PoissonManagement',
      gradientColors: isDark
        ? ['#2E7D32', '#81C784']  // Vert foncé à vert clair (nuit)
        : ['#66BB6A', '#2E7D32'], // Vert vif à vert foncé (jour)
    },
    {
      title: t('management.food'),
      icon: IconName.FishFood,
      iconType: IconType.MaterialCommunityIcons,
      screen: 'ControleFood',
      gradientColors: isDark
        ? ['#FF8F00', '#FFE082']  // Orange foncé à jaune clair (nuit)
        : ['#FFA000', '#FFCA28'], // Orange à jaune (jour)
    },
    {
      title: t('management.water_control'),
      icon: IconName.Water,
      iconType: IconType.Ionicons,
      screen: 'ControleEau',
      gradientColors: isDark
        ? ['#00838F', '#80DEEA']  // Bleu vert profond à bleu clair (nuit)
        : ['#00ACC1', '#4FC3F7'], // Turquoise à bleu ciel (jour)
    },
    {
      title: t('management.export_data'),
      icon: IconName.Download,
      iconType: IconType.MaterialCommunityIcons,
      screen: 'ExportData',
      gradientColors: isDark
        ? ['#3949AB', '#7986CB']  // Indigo foncé à indigo clair (nuit)
        : ['#5C6BC0', '#2196F3'], // Indigo à bleu vif (jour)
    },
  ];

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
      colors={isDark ? ['#2E4A62', '#1A365D'] : ['#B3E5FC', '#4FC3F7', '#0288D1']}
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
        <TouchableOpacity 
          style={[styles.backButton, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }]}
          onPress={() => {back.navigate('ElevageManagement')}}
          activeOpacity={0.7}
        >
          <Icon 
            name="arrow-left" 
            size={24} 
            color={isDark ? colors.white : colors.text} 
          />
        </TouchableOpacity>

        <View style={[styles.header, { marginBottom: spacing.xlarge }]}>
          <Text style={[
            styles.title,
            { 
              color: isDark ? colors.white : '#0D47A1',
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
              color: isDark ? colors.textSecondary : '#1565C0',
              fontSize: isTablet ? typography.body.fontSize * 1.1 : typography.body.fontSize,
              textShadowColor: isDark ? 'rgba(0,0,0,0.3)' : 'rgba(255,255,255,0.6)',
              textShadowOffset: { width: 1, height: 1 },
              textShadowRadius: 1,
            }
          ]}>
            {t('management.subtitle')}
          </Text>
        </View>
        
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
                  onPress={() => navigation.navigate(item.screen as never)}
                  primary
                  style={{
                    ...styles.button,
                    height: isTablet ? 100 : 88,
                    minHeight: isTablet ? 100 : 88,
                  }}
                  textStyle={{
                    ...styles.buttonText,
                    fontSize: isTablet ? 17 : 15,
                    maxWidth: '80%',
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
  buttonWrapper: {},
  shadowContainer: {
    borderRadius: 18,
    backgroundColor: 'transparent',
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

export default PiscicoleManagement;