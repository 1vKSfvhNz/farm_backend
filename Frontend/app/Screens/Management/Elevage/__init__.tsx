import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Animated,
  RefreshControl,
  useWindowDimensions,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTranslation } from 'react-i18next';
import {
  ChickenCard,
  CowCard,
  SheepCard,
  GoatCard,
  FishCard,
  ButtonCardVariant,
} from '../../../components/Button/AnimalCard';
import { useTheme } from '../../../contexts/ThemeContext';
import { AnimalStats, useAppData } from '../../../hooks/useAppData';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface AnimalManagementProps {
  navigation: any;
}

interface QuickStat {
  icon: string;
  label: string;
  value: string | number;
  trend?: number;
  color: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

const AnimalManagement: React.FC<AnimalManagementProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { colors, shadows } = useTheme();
  const { width, height } = useWindowDimensions();
  const { 
    animalData, 
    globalStats, 
    refreshData 
  } = useAppData();
  
  // State
  const [refreshing, setRefreshing] = useState(false);
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'urgent' | 'healthy'>('all');
  
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const headerScale = useRef(new Animated.Value(0.95)).current;
  
  // Responsive
  const isTablet = width >= 768;
  const isLandscape = width > height;

  // =========================================================================
  // EFFECTS
  // =========================================================================
  
  useEffect(() => {
    // Entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
      Animated.spring(headerScale, {
        toValue: 1,
        friction: 8,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // =========================================================================
  // DATA
  // =========================================================================
  
  const quickStats: QuickStat[] = [
    {
      icon: 'counter',
      label: t('animals.totalAnimals'),
      value: globalStats?.totalAnimals ?? '0',
      trend: 12,
      color: colors.primary,
    },
    {
      icon: 'heart-pulse',
      label: t('animals.averageHealth'),
      value: `${globalStats?.averageHealth ?? 0}%`,
      trend: 3,
      color: colors.success,
    },
    {
      icon: 'trending-up',
      label: t('animals.production'),
      value: `${globalStats?.averageProduction ?? 0}%`,
      trend: 5,
      color: colors.info,
    },
    {
      icon: 'alert-circle',
      label: t('animals.alerts'),
      value: animalData.filter(animal => animal.isUrgent).length,
      trend: -2,
      color: colors.warning,
    },
  ];

  const formatLastUpdate = (date: Date) => {
    const now = new Date();
    const diffMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffMinutes < 60) {
      return t('common.minutesAgo', { minutes: diffMinutes });
    } else {
      const diffHours = Math.floor(diffMinutes / 60);
      return t('common.hoursAgo', { hours: diffHours });
    }
  };

  // =========================================================================
  // HANDLERS
  // =========================================================================
  
  const handleRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const handleAnimalPress = (variant: ButtonCardVariant) => {
    navigation.navigate(variant, { screen: 'Home' });
  };

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'batiment':
        navigation.navigate('BatimentManagement');
        break;
      case 'report':
        navigation.navigate('Reports');
        break;
      case 'health':
        navigation.navigate('HealthMonitoring');
        break;
      case 'feed':
        navigation.navigate('FeedManagement');
        break;
    }
  };

  // =========================================================================
  // RENDER HELPERS
  // =========================================================================
  
  const renderHeader = () => (
    <Animated.View
      style={[
        styles.header,
        {
          opacity: fadeAnim,
          transform: [{ scale: headerScale }],
        },
      ]}
    >
      <LinearGradient
        colors={[colors.primary, colors.primaryDark]}
        style={styles.headerGradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}
              >
                <MaterialCommunityIcons
                  name="arrow-left"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
              
              <Text style={styles.headerTitle}>
                {t('animals.management')}
              </Text>
              
              <TouchableOpacity
                onPress={() => navigation.navigate('Settings')}
                style={styles.settingsButton}
              >
                <MaterialCommunityIcons
                  name="cog"
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.headerSubtitle}>
              {t('animals.dashboardSubtitle')}
            </Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </Animated.View>
  );

  const renderQuickStats = () => (
    <Animated.View
      style={[
        styles.quickStatsContainer,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.quickStatsScroll}
      >
        {quickStats.map((stat, index) => (
          <TouchableOpacity
            key={index}
            style={[
              styles.quickStatCard,
              {
                backgroundColor: colors.card,
                borderColor: colors.border,
                ...shadows.small,
              },
            ]}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.quickStatIcon,
                { backgroundColor: `${stat.color}20` },
              ]}
            >
              <MaterialCommunityIcons
                name={stat.icon}
                size={24}
                color={stat.color}
              />
            </View>
            
            <View style={styles.quickStatContent}>
              <Text style={[styles.quickStatValue, { color: colors.text }]}>
                {stat.value}
              </Text>
              <Text style={[styles.quickStatLabel, { color: colors.textSecondary }]}>
                {stat.label}
              </Text>
              
              {stat.trend !== undefined && (
                <View style={styles.trendContainer}>
                  <MaterialCommunityIcons
                    name={stat.trend > 0 ? 'trending-up' : 'trending-down'}
                    size={16}
                    color={stat.trend > 0 ? colors.success : colors.error}
                  />
                  <Text
                    style={[
                      styles.trendText,
                      { color: stat.trend > 0 ? colors.success : colors.error },
                    ]}
                  >
                    {Math.abs(stat.trend)}%
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </Animated.View>
  );

  const renderQuickActions = () => (
    <View style={styles.quickActionsContainer}>
      <Text style={[styles.sectionTitle, { color: colors.text }]}>
        {t('animals.quickActions')}
      </Text>
      
      <View style={styles.quickActionsGrid}>         
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.warning }]}
          onPress={() => handleQuickAction('batiment')}
        >
          <MaterialCommunityIcons name="barn" size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>{t('animals.batiment')}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.info }]} // #2196F3 - pour les rapports/informations
          onPress={() => handleQuickAction('report')}
        >
          <MaterialCommunityIcons name="file-chart" size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>{t('animals.reports')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.success }]} // #4CAF50 - pour la santé (couleur positive)
          onPress={() => handleQuickAction('health')}
        >
          <MaterialCommunityIcons name="medical-bag" size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>{t('animals.health')}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.quickActionButton, { backgroundColor: colors.secondary }]} // #5D4037 - pour l'alimentation (couleur terre/brun)
          onPress={() => handleQuickAction('feed')}
        >
          <MaterialCommunityIcons name="grain" size={24} color="#FFFFFF" />
          <Text style={styles.quickActionText}>{t('animals.feed')}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderFilters = () => (
    <View style={styles.filtersContainer}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filtersScroll}
      >
        {['all', 'urgent', 'healthy'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterButton,
              {
                backgroundColor:
                  selectedFilter === filter ? colors.primary : colors.card,
                borderColor:
                  selectedFilter === filter ? colors.primary : colors.border,
              },
            ]}
            onPress={() => setSelectedFilter(filter as any)}
          >
            <Text
              style={[
                styles.filterText,
                {
                  color:
                    selectedFilter === filter ? '#FFFFFF' : colors.textSecondary,
                },
              ]}
            >
              {t(`animals.filter.${filter}`)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderAnimalCard = (animal: AnimalStats) => {
    // Vérifiez que les composants sont bien définis
    const CardComponents = {
      Avicole: ChickenCard,
      Bovin: CowCard,
      Ovin: SheepCard,
      Caprin: GoatCard,
      Piscicole: FishCard,
    };

    const CardComponent = CardComponents[animal.variant];
    
    if (!CardComponent) {
      console.error(`No card component found for variant: ${animal.variant}`);
      return null;
    }

    return (
      <CardComponent
        key={animal.variant}
        count={animal.count}
        health={animal.health}
        production={animal.production}
        lastUpdate={formatLastUpdate(animal.lastUpdate)}
        isNew={animal.isNew}
        isUrgent={animal.isUrgent}
        onPress={() => handleAnimalPress(animal.variant)}
        style={styles.animalCard}
      />
    );
  };

  // =========================================================================
  // MAIN RENDER
  // =========================================================================
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.primary}
        translucent={Platform.OS === 'android'}
      />
      
      {renderHeader()}
      
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      >
        {renderQuickStats()}
        {renderQuickActions()}
        {renderFilters()}
        
        <View style={styles.animalsSection}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('animals.yourAnimals')}
          </Text>
          
          <View
            style={[
              styles.animalsGrid,
              isTablet && isLandscape && styles.animalsGridTablet,
            ]}
          >
            {animalData
              .filter((animal) => {
                if (selectedFilter === 'urgent') return animal.isUrgent;
                if (selectedFilter === 'healthy') return animal.health >= 80;
                return true;
              })
              .map(renderAnimalCard)}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerGradient: {
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  safeArea: {
    width: '100%',
  },
  headerContent: {
    padding: 20,
    paddingTop: 10,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
  },
  settingsButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  content: {
    flex: 1,
  },
  quickStatsContainer: {
    marginTop: 20,
  },
  quickStatsScroll: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  quickStatCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginRight: 12,
    minWidth: 160,
  },
  quickStatIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  quickStatContent: {
    flex: 1,
  },
  quickStatValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quickStatLabel: {
    fontSize: 12,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 2,
  },
  quickActionsContainer: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  quickActionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickActionButton: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  quickActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
  filtersContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  filtersScroll: {
    paddingHorizontal: 20,
  },
  filterButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 12,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  animalsSection: {
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  animalsGrid: {
    marginTop: 8,
  },
  animalsGridTablet: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  animalCard: {
    marginBottom: 12,
  },
});

export default AnimalManagement;