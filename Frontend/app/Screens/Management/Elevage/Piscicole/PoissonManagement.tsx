import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Modal,
  RefreshControl,
  Dimensions,
  Platform,
  TextInput,
  FlatList,
} from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { 
  BassinResponse, 
  PoissonResponse, 
  PopulationBassinResponse
} from '../../../../interfaces/Elevage/piscicole';
import { 
  EspecePoissonEnum, 
  StadePoisson
} from '../../../../enums/Elevage/piscicole';
import { FetchGET, FetchDELETE } from '../../../../constants/constantsFetch';
import { useAuth } from '../../../../contexts/AuthContext';
import FishCreationModal from '../../../../modal/Elevage/Piscicole/FishCreationModal';
import { useTranslation } from 'react-i18next';

const { width, height } = Dimensions.get('window');
const isTablet = width > 768;

interface GestionPoissonsProps {
  navigation: any;
  route?: any;
}

const PoissonManagement: React.FC<GestionPoissonsProps> = ({ navigation, route }) => {
  const { colors, isDark } = useTheme();
  const { authToken } = useAuth();
  const { t } = useTranslation('piscicole');

  // États
  const [poissons, setPoissons] = useState<PoissonResponse[]>([]);
  const [populations, setPopulations] = useState<PopulationBassinResponse[]>([]);
  const [bassins, setBassins] = useState<BassinResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedItem, setSelectedItem] = useState<PoissonResponse | PopulationBassinResponse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [filterEspece, setFilterEspece] = useState<EspecePoissonEnum | ''>('');
  const [filterStade, setFilterStade] = useState<StadePoisson | ''>('');

  // Chargement des données
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const [poissonsResponse, populationsResponse, bassinsResponse] = await Promise.all([
        FetchGET(authToken, 'api/elevage/piscicole/poissons'),
        FetchGET(authToken, 'api/elevage/piscicole/populations'),
        FetchGET(authToken, 'api/elevage/piscicole/bassins')
      ]);

      if (poissonsResponse.ok) {
        setPoissons(await poissonsResponse.json() || []);
      }
      if (populationsResponse.ok) {
        setPopulations(await populationsResponse.json() || []);
      }
      if (bassinsResponse.ok) {
        setBassins(await bassinsResponse.json() || []);
      }
    } catch (error) {
      console.error('Erreur lors du chargement:', error);
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  }, [authToken]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Actualisation
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Filtrage des données
  const filteredPoissons = poissons.filter(poisson => {
    const matchesSearch = !searchText || 
      poisson.espece.toLowerCase().includes(searchText.toLowerCase()) ||
      poisson.origine.toLowerCase().includes(searchText.toLowerCase()) ||
      poisson.numeroIdentification?.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesEspece = !filterEspece || poisson.espece === filterEspece;
    const matchesStade = !filterStade || poisson.stadeDeveloppement === filterStade;
    
    return matchesSearch && matchesEspece && matchesStade;
  });

  const filteredPopulations = populations.filter(population => {
    const matchesSearch = !searchText || 
      population.espece.toLowerCase().includes(searchText.toLowerCase()) ||
      population.origine.toLowerCase().includes(searchText.toLowerCase());
    
    const matchesEspece = !filterEspece || population.espece === filterEspece;
    const matchesStade = !filterStade || population.stadeDeveloppement === filterStade;
    
    return matchesSearch && matchesEspece && matchesStade;
  });

  // Suppression d'un poisson ou population
  const handleDelete = async (id: number, isPopulationItem: boolean) => {
    Alert.alert(
      'Confirmation',
      `Êtes-vous sûr de vouloir supprimer ${isPopulationItem ? 'cette population' : 'ce poisson'} ?`,
      [
        { text: 'Annuler', style: 'cancel' },
        {
          text: 'Supprimer',
          style: 'destructive',
          onPress: async () => {
            try {
              const endpoint = isPopulationItem ? 
                'api/elevage/piscicole/populations' : 
                'api/elevage/piscicole/poissons';
              
              const response = await FetchDELETE(authToken, endpoint, id);
              
              if (response.ok) {
                Alert.alert('Succès', `${isPopulationItem ? 'Population' : 'Poisson'} supprimé avec succès`);
                loadData();
              } else {
                Alert.alert('Erreur', `Impossible de supprimer ${isPopulationItem ? 'la population' : 'le poisson'}`);
              }
            } catch (error) {
              console.error('Erreur suppression:', error);
              Alert.alert('Erreur', 'Erreur lors de la suppression');
            }
          },
        },
      ]
    );
  };

  // Affichage des détails
  const showDetails = (item: PoissonResponse | PopulationBassinResponse) => {
    setSelectedItem(item);
    setShowDetailModal(true);
  };

  // Rendu d'une carte de poisson
  const renderPoissonCard = ({ item }: { item: PoissonResponse }) => {
    const bassin = bassins.find(b => b.id === item.bassinId);
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => showDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.especeContainer}>
            <Icon name="fish" size={24} color={colors.primary} />
            <Text style={[styles.especeText, { color: colors.text }]}>
              {item.espece.toUpperCase()}
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, false)}
              style={[styles.actionButton, { backgroundColor: colors.error }]}
            >
              <Icon name="delete" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Icon name="weight" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.poidsEnsemencement}g
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="ruler" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.tailleEnsemencement}cm
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="grow" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.stadeDeveloppement}
            </Text>
          </View>
          {bassin && (
            <View style={styles.infoRow}>
              <Icon name="pool" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {bassin.nom}
              </Text>
            </View>
          )}
        </View>

        {item.numeroIdentification && (
          <View style={styles.cardFooter}>
            <Text style={[styles.idText, { color: colors.textSecondary }]}>
              ID: {item.numeroIdentification}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Rendu d'une carte de population
  const renderPopulationCard = ({ item }: { item: PopulationBassinResponse }) => {
    const bassin = bassins.find(b => b.id === item.bassinId);
    
    return (
      <TouchableOpacity
        style={[styles.card, { backgroundColor: colors.surface }]}
        onPress={() => showDetails(item)}
        activeOpacity={0.7}
      >
        <View style={styles.cardHeader}>
          <View style={styles.especeContainer}>
            <Icon name="fish-multiple" size={24} color={colors.primary} />
            <Text style={[styles.especeText, { color: colors.text }]}>
              {item.espece.toUpperCase()} (x{item.nombrePoissons})
            </Text>
          </View>
          <View style={styles.cardActions}>
            <TouchableOpacity
              onPress={() => handleDelete(item.id, true)}
              style={[styles.actionButton, { backgroundColor: colors.error }]}
            >
              <Icon name="delete" size={16} color={colors.white} />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.cardContent}>
          <View style={styles.infoRow}>
            <Icon name="weight" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Poids moyen: {item.poidsMoyenEnsemencement}g
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="ruler" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              Taille moyenne: {item.tailleMoyenneEnsemencement}cm
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Icon name="grow" size={16} color={colors.textSecondary} />
            <Text style={[styles.infoText, { color: colors.textSecondary }]}>
              {item.stadeDeveloppement}
            </Text>
          </View>
          {bassin && (
            <View style={styles.infoRow}>
              <Icon name="pool" size={16} color={colors.textSecondary} />
              <Text style={[styles.infoText, { color: colors.textSecondary }]}>
                {bassin.nom}
              </Text>
            </View>
          )}
        </View>

        <View style={[styles.cardFooter, { justifyContent: 'space-between' }]}>
          <Text style={[styles.idText, { color: colors.textSecondary }]}>
            Biomasse: {item.biomasseTotaleKg.toFixed(2)}kg
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Rendu des détails
  const renderDetails = () => {
    if (!selectedItem) return null;

    const isPopulationItem = 'nombrePoissons' in selectedItem;
    const bassin = bassins.find(b => b.id === selectedItem.bassinId);

    return (
      <>
        <View style={styles.detailHeader}>
          <Text style={[styles.detailTitle, { color: colors.text }]}>
            {selectedItem.espece.toUpperCase()}
            {isPopulationItem && ` (x${(selectedItem as PopulationBassinResponse).nombrePoissons})`}
          </Text>
          <TouchableOpacity onPress={() => setShowDetailModal(false)}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.detailContent}>
          {isPopulationItem ? (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Nombre de poissons:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PopulationBassinResponse).nombrePoissons}
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Poids moyen:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PopulationBassinResponse).poidsMoyenEnsemencement}g
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Taille moyenne:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PopulationBassinResponse).tailleMoyenneEnsemencement}cm
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Biomasse totale:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PopulationBassinResponse).biomasseTotaleKg.toFixed(2)}kg
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Poids:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PoissonResponse).poidsEnsemencement}g
                </Text>
              </View>

              <View style={styles.detailRow}>
                <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                  Taille:
                </Text>
                <Text style={[styles.detailValue, { color: colors.text }]}>
                  {(selectedItem as PoissonResponse).tailleEnsemencement}cm
                </Text>
              </View>

              {(selectedItem as PoissonResponse).sexe && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Sexe:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {(selectedItem as PoissonResponse).sexe === 'M' ? 'Mâle' : 'Femelle'}
                  </Text>
                </View>
              )}

              {(selectedItem as PoissonResponse).numeroIdentification && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                    Numéro d'identification:
                  </Text>
                  <Text style={[styles.detailValue, { color: colors.text }]}>
                    {(selectedItem as PoissonResponse).numeroIdentification}
                  </Text>
                </View>
              )}
            </>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Date d'ensemencement:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {new Date(selectedItem.dateEnsemencement).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Origine:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedItem.origine}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Type d'alimentation:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedItem.alimentationType}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Stade de développement:
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {selectedItem.stadeDeveloppement}
            </Text>
          </View>

          {!isPopulationItem && (selectedItem as PoissonResponse).reproducteur && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Reproducteur:
              </Text>
              <Text style={[styles.detailValue, { color: colors.success }]}>
                Oui
              </Text>
            </View>
          )}

          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
              Âge (jours):
            </Text>
            <Text style={[styles.detailValue, { color: colors.text }]}>
              {(selectedItem as PoissonResponse).ageJours}
            </Text>
          </View>

          {bassin && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Bassin:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {bassin.nom}
              </Text>
            </View>
          )}

          {isPopulationItem && (selectedItem as PopulationBassinResponse).notes && (
            <View style={styles.detailRow}>
              <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
                Notes:
              </Text>
              <Text style={[styles.detailValue, { color: colors.text }]}>
                {(selectedItem as PopulationBassinResponse).notes}
              </Text>
            </View>
          )}
        </ScrollView>
      </>
    );
  };

  return (
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
        onPress={() => navigation.goBack()}
      >
        <Icon name="arrow-left" size={24} color={isDark ? colors.white : colors.text} />
      </TouchableOpacity>

      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.white }]}>
            {t('gestionPoissons')}
          </Text>
          <TouchableOpacity
            onPress={() => setShowCreateModal(true)}
            style={[styles.addButton, { backgroundColor: colors.success }]}
          >
            <Icon name="plus" size={24} color={colors.white} />
          </TouchableOpacity>
        </View>

        {/* Filtres et recherche */}
        <View style={[styles.filtersContainer, { backgroundColor: colors.surface }]}>
          <View style={styles.searchContainer}>
            <Icon name="magnify" size={20} color={colors.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: colors.text }]}
              placeholder={t('rechercher')}
              placeholderTextColor={colors.textSecondary}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterTabs}>
            <TouchableOpacity
              style={[
                styles.filterTab,
                !filterEspece && { backgroundColor: colors.primary }
              ]}
              onPress={() => setFilterEspece('')}
            >
              <Text style={[
                styles.filterTabText,
                { color: !filterEspece ? colors.white : colors.textSecondary }
              ]}>
                {t('toutes')}
              </Text>
            </TouchableOpacity>

            {Object.values(EspecePoissonEnum).map(espece => (
              <TouchableOpacity
                key={espece}
                style={[
                  styles.filterTab,
                  filterEspece === espece && { backgroundColor: colors.primary }
                ]}
                onPress={() => setFilterEspece(filterEspece === espece ? '' : espece)}
              >
                <Text style={[
                  styles.filterTabText,
                  { color: filterEspece === espece ? colors.white : colors.textSecondary }
                ]}>
                  {espece.toUpperCase()}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Liste des poissons et populations */}
        <FlatList
          data={[...filteredPoissons, ...filteredPopulations]}
          renderItem={({ item }) => 
            'nombrePoissons' in item ? 
              renderPopulationCard({ item }) : 
              renderPoissonCard({ item })
          }
          keyExtractor={item => item.id.toString()}
          numColumns={isTablet ? 2 : 1}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Icon name="fish-off" size={64} color={colors.textSecondary} />
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {t('aucunPoissonTrouve')}
              </Text>
            </View>
          }
        />

        {/* Modal de création */}
        <FishCreationModal
          visible={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={loadData}
          bassins={bassins}
          colors={colors}
          authToken={authToken}
        />

        {/* Modal de détails */}
        <Modal
          visible={showDetailModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDetailModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.detailModal, { backgroundColor: colors.surface }]}>
              {renderDetails()}
            </View>
          </View>
        </Modal>
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 20,
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
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
  },
  filtersContainer: {
    padding: 16,
    margin: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 25,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterTabs: {
    flexDirection: 'row',
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  filterTabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  listContainer: {
    padding: 16,
  },
  card: {
    flex: isTablet ? 0.48 : 1,
    margin: 8,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  especeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  especeText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  cardActions: {
    flexDirection: 'row',
  },
  actionButton: {
    padding: 8,
    borderRadius: 6,
    marginLeft: 8,
  },
  cardContent: {
    marginBottom: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  infoText: {
    fontSize: 14,
    marginLeft: 8,
  },
  cardFooter: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.1)',
    flexDirection: 'row',
  },
  idText: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailModal: {
    width: width * 0.9,
    maxHeight: height * 0.8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  detailTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  detailContent: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.05)',
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
});

export default PoissonManagement;