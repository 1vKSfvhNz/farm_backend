import React, { useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  useWindowDimensions,
  Platform 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { AvicoleStackParamList } from '../../../../types/navigations';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../../../contexts/ThemeContext';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import GestionButton from '../../../../components/Button/GestionButton';
import { IconType } from '../../../../enums/Button/buttons';

type LotManagementNavigationProp = StackNavigationProp<AvicoleStackParamList, 'LotManagement'>;

interface MenuItem {
  title: string;
  icon: string;
  screen: keyof AvicoleStackParamList;
  gradientColors: string[];
  iconType?: IconType;
}

const LotManagement = React.memo(() => {
  const navigation = useNavigation<LotManagementNavigationProp>();
  const { t } = useTranslation();
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Détection responsive
  const isLandscape = width > height;
  const isTablet = width >= 768;

  const menuItems = useMemo<MenuItem[]>(() => [
    {
      title: t('avicole.lot_management.lot_list'),
      icon: 'format-list-bulleted',
      screen: 'LotList',
      gradientColors: [colors.plant, isDark ? '#A5D6A7' : '#66BB6A'],
    },
    {
      title: t('avicole.lot_management.create_lot'),
      icon: 'plus-circle',
      screen: 'CreateLot',
      gradientColors: [colors.water, isDark ? '#4DD0E1' : '#4FC3F7'],
    },
    {
      title: t('avicole.lot_management.lot_stats'),
      icon: 'chart-bar',
      screen: 'LotStats',
      gradientColors: [colors.animal, isDark ? '#F48FB1' : '#F06292'],
    }
  ], [t, colors, isDark]);

  // Calcul dynamique des colonnes
  const getColumnsCount = useCallback(() => {
    if (isTablet && isLandscape) return 2;
    if (isTablet || (isLandscape && width > 600)) return 2;
    return 1;
  }, [isTablet, isLandscape, width]);

  const columnsCount = getColumnsCount();
  const buttonWidth = columnsCount === 1 ? '100%' : '48%';

  const handlePress = useCallback((screen: keyof AvicoleStackParamList) => {
    navigation.navigate(screen);
  }, [navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#A5D6A7' : '#66BB6A' }]}>
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
              paddingTop: Platform.OS === 'ios' ? 40 : 40,
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
            onPress={handleGoBack}
            activeOpacity={0.7}
          >
            <Icon 
              name="arrow-left" 
              size={24} 
              color={isDark ? colors.white : '#8B4513'} 
            />
          </TouchableOpacity>

          {/* Header amélioré */}
          <View style={[styles.header, { marginBottom: spacing.xlarge }]}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
              <Icon 
                name="barn" 
                size={isTablet ? 56 : 48} 
                color={colors.primary} 
              />
            </View>
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
              {t('avicole.lot_management.title')}
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
              {t('avicole.lot_management.subtitle')}
            </Text>
          </View>

          {/* Grille de boutons adaptative */}
          <View style={[
            styles.buttonGrid,
            { 
              maxWidth: isTablet ? 800 : 600,
              alignSelf: 'center',
              width: '100%'
            }
          ]}>
            {menuItems.map((item, index) => (
              <View
                key={`${item.screen}-${index}`}
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
                    iconType={item.iconType || IconType.MaterialCommunityIcons}
                    onPress={() => handlePress(item.screen)}
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
    </SafeAreaView>
  );
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
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
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    // Assure un espacement correct entre les boutons
  },
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
  quickStatsContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    marginHorizontal: 8,
  },
  quickStatsTitle: {
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
});

LotManagement.displayName = 'LotManagement';

export default LotManagement;