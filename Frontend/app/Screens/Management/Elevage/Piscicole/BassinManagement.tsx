import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  useWindowDimensions, 
  Platform, 
  TouchableOpacity, 
  Alert, 
  FlatList, 
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BassinResponse } from '../../../../interfaces/Elevage/piscicole';
import { FetchGET, FetchDELETE } from '../../../../constants/constantsFetch';
import { useAuth } from '../../../../contexts/AuthContext';
import CreateBassinModal from '../../../../modal/Elevage/Piscicole/BassinCreationModal';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { PiscicoleStackParamList } from '../../../../types/navigations';

const BassinManagement = () => {
  const { t } = useTranslation('piscicole');
  const navigation = useNavigation<StackNavigationProp<PiscicoleStackParamList>>();
  const { authToken } = useAuth();
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  const isTablet = width >= 768;

  const [bassins, setBassins] = useState<BassinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedBassin, setSelectedBassin] = useState<BassinResponse | null>(null);

  useEffect(() => {
    loadBassins();
  }, []);

  const loadBassins = async () => {
    try {
      setLoading(true);
      const response = await FetchGET(authToken, 'api/elevage/piscicole/bassins');
      const data: BassinResponse[] = await response.json();
      setBassins(data);
    } catch (error) {
      console.error('Error loading bassins:', error);
      Alert.alert(t('common.error'), t('bassin.errors.load_failed'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadBassins();
  };

  const deleteBassin = async (id: number) => {
    try {
      setLoading(true);
      const response = await FetchDELETE(authToken, `api/elevage/piscicole/bassins`, id);
      if (response.ok) {
        Alert.alert(t('common.success'), t('bassin.messages.delete_success'));
        loadBassins();
      } else {
        throw new Error(t('bassin.errors.delete_failed'));
      }
    } catch (error) {
      console.error('Error deleting bassin:', error);
      Alert.alert(
        t('common.error'), 
        error instanceof Error ? error.message : t('bassin.errors.delete_failed')
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (bassin: BassinResponse) => {
    setSelectedBassin(bassin);
    setShowCreateModal(true);
  };

  const handleCreate = () => {
    setSelectedBassin(null);
    setShowCreateModal(true);
  };

  const handleSuccess = () => {
    loadBassins();
    setShowCreateModal(false);
  };

  const renderBassinItem = ({ item }: { item: BassinResponse }) => {
    // Calcul de la densité en kg/m²
    const densiteKgM2 = item.superficie > 0 ? item.biomasseTotaleKg / item.superficie : 0;

    return (
      <View style={[
        styles.bassinCard, 
        { 
          backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
        }
      ]}>
        <View style={styles.bassinHeader}>
          <Icon 
            name={item.bassinReproduction ? "egg-easter" : "fish"} 
            size={24} 
            color={isDark ? colors.primaryLight : colors.primary} 
            style={styles.bassinIcon}
          />
          <View style={styles.bassinTitleContainer}>
            <Text style={[styles.bassinTitle, { color: isDark ? colors.white : colors.text }]}>
              {item.nom}
            </Text>
            {item.bassinReproduction && (
              <View style={[styles.reproductionBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.reproductionBadgeText}>{t('bassin.reproduction')}</Text>
              </View>
            )}
          </View>
        </View>
        
        <View style={styles.bassinInfoContainer}>
          <View style={styles.bassinDetails}>
            <View style={styles.detailRow}>
              <Icon name="water" size={16} color={isDark ? colors.textSecondary : colors.primary} />
              <Text style={[styles.detailText, { color: isDark ? colors.textSecondary : colors.text }]}>
                {t(`bassin.types.${item.typeMilieu}`)} • {t(`bassin.habitats.${item.typeHabitat}`)}
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Icon name="ruler" size={16} color={isDark ? colors.textSecondary : colors.primary} />
              <Text style={[styles.detailText, { color: isDark ? colors.textSecondary : colors.text }]}>
                {item.superficie} m² • {item.profondeurMoyenne} m
              </Text>
            </View>
            
            <View style={styles.detailRow}>
              <Icon name="cube-outline" size={16} color={isDark ? colors.textSecondary : colors.primary} />
              <Text style={[styles.detailText, { color: isDark ? colors.textSecondary : colors.text }]}>
                {item.volumeM3} m³ • {densiteKgM2.toFixed(1)} kg/m²
              </Text>
            </View>
          </View>
          
          <View style={styles.bassinStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {item.nombreTotalPoissons}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.text }]}>
                {t('bassin.poissons')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: colors.primary }]}>
                {item.biomasseTotaleKg.toFixed(1)} kg
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.text }]}>
                {t('bassin.biomasse')}
              </Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { 
                color: item.tauxOccupation && item.tauxOccupation > 85 ? colors.error : colors.primary 
              }]}>
                {item.tauxOccupation ? `${Math.round(item.tauxOccupation)}%` : 'N/A'}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.text }]}>
                {t('bassin.occupation')}
              </Text>
            </View>
          </View>
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Icon name="note-text-outline" size={14} color={colors.textSecondary} />
            <Text style={[styles.notesText, { color: isDark ? colors.textSecondary : colors.text }]} numberOfLines={2}>
              {item.notes}
            </Text>
          </View>
        )}
        
        <View style={styles.actionsContainer}>
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.primary }]}
            onPress={() => handleEdit(item)}
          >
            <Icon name="pencil" size={18} color="white" />
            <Text style={styles.actionButtonText}>
              {t('common.edit')}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, { backgroundColor: colors.error }]}
            onPress={() => {
              Alert.alert(
                t('common.confirm'),
                t('bassin.confirm_delete'),
                [
                  { 
                    text: t('common.cancel'), 
                    style: 'cancel' 
                  },
                  { 
                    text: t('common.delete'), 
                    onPress: () => deleteBassin(item.id),
                    style: 'destructive'
                  }
                ]
              );
            }}
          >
            <Icon name="trash-can-outline" size={18} color="white" />
            <Text style={styles.actionButtonText}>
              {t('common.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <>
      <LinearGradient
        colors={isDark ? ['#2E4A62', '#1A365D'] : ['#B3E5FC', '#4FC3F7', '#0288D1']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={[styles.backButton, {
            backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }]}
          onPress={() => navigation.navigate('Home')}
        >
          <Icon name="arrow-left" size={24} color={isDark ? colors.white : colors.text} />
        </TouchableOpacity>

        <ScrollView 
          contentContainerStyle={[
            styles.container, 
            { 
              paddingHorizontal: spacing.large,
              paddingTop: Platform.OS === 'ios' ? 60 : 40,
              paddingBottom: spacing.xlarge
            }
          ]}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={[
              styles.title,
              { 
                color: isDark ? colors.white : colors.text,
                fontSize: isTablet ? typography.header.fontSize * 1.3 : typography.header.fontSize,
              }
            ]}>
              {t('bassin.management_title')}
            </Text>
          </View>

          <TouchableOpacity
            style={[
              styles.createButton,
              {
                backgroundColor: colors.primary,
                marginBottom: spacing.xlarge,
              }
            ]}
            onPress={handleCreate}
            activeOpacity={0.8}
          >
            <Icon name="plus" size={20} color="white" />
            <Text style={styles.createButtonText}>
              {t('bassin.create_bassin')}
            </Text>
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <View style={[
              styles.statCard,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }
            ]}>
              <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.text }]}>
                {bassins.length}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                {t('bassin.total_bassins')}
              </Text>
            </View>
            
            <View style={[
              styles.statCard,
              { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }
            ]}>
              <Text style={[styles.statNumber, { color: isDark ? colors.white : colors.text }]}>
                {bassins.reduce((acc, bassin) => acc + (bassin.nombreTotalPoissons || 0), 0)}
              </Text>
              <Text style={[styles.statLabel, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                {t('bassin.total_poissons')}
              </Text>
            </View>
          </View>

          {loading && bassins.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          ) : bassins.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="fish-off" size={48} color={isDark ? colors.textSecondary : colors.textSecondary} />
              <Text style={[styles.emptyText, { color: isDark ? colors.textSecondary : colors.textSecondary }]}>
                {t('bassin.no_bassins')}
              </Text>
            </View>
          ) : (
            <FlatList
              data={bassins}
              renderItem={renderBassinItem}
              keyExtractor={(item) => item.id.toString()}
              scrollEnabled={false}
              numColumns={isTablet || isLandscape ? 2 : 1}
              contentContainerStyle={styles.listContainer}
              columnWrapperStyle={isTablet || isLandscape ? styles.columnWrapper : null}
            />
          )}
        </ScrollView>
      </LinearGradient>

      <CreateBassinModal
        visible={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={handleSuccess}
        bassin={selectedBassin}
      />
    </>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flexGrow: 1,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 12,
    marginHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  createButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  listContainer: {
    paddingHorizontal: 10,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  bassinCard: {
    flex: 1,
    borderRadius: 12,
    padding: 16,
    margin: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  bassinHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  bassinIcon: {
    marginRight: 10,
  },
  bassinTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  bassinDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  detailText: {
    fontSize: 14,
    marginLeft: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  actionButtonText: {
    color: 'white',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  bassinTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  reproductionBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 10,
  },
  reproductionBadgeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  bassinInfoContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  bassinStats: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginLeft: 10,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  notesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 6,
  },
  notesText: {
    flex: 1,
    fontSize: 12,
    marginLeft: 6,
    fontStyle: 'italic',
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
});

export default BassinManagement;