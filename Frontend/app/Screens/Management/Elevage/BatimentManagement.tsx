import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  StyleSheet, 
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
  Platform,
  useWindowDimensions
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import FAIcon from 'react-native-vector-icons/FontAwesome';
import { useTheme } from '../../../contexts/ThemeContext';
import { t } from 'i18next';
import { BatimentBase, BatimentResponse } from '../../../interfaces/Elevage/__init__';
import { FetchGET, FetchUPDATE, FetchCREATE, FetchDELETE } from '../../../constants/constantsFetch';
import { useAuth } from '../../../contexts/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../../../types/navigations';
import { TypeElevage, TypeBatimentAvicole, TypeBatimentBovin, TypeBatimentCaprin, TypeBatimentOvin, TypeBatimentPiscicole } from '../../../enums/Elevage/__init__';
import LinearGradient from 'react-native-linear-gradient';

type BatimentManagementNavigationProp = StackNavigationProp<RootStackParamList, 'BatimentManagement'>;

const BatimentManagement: React.FC = () => {
  const navigation = useNavigation<BatimentManagementNavigationProp>();
  const { authToken } = useAuth();
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;

  const [batiments, setBatiments] = useState<BatimentResponse[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBatiment, setEditingBatiment] = useState<BatimentResponse | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [formData, setFormData] = useState<BatimentBase>({
    nom: '',
    typeElevage: undefined,
    typeBatiment: undefined,
    capacite: undefined,
    superficie: undefined,
    ventilation: undefined,
    notes: undefined
  });

  const [showTypeBatimentOptions, setShowTypeBatimentOptions] = useState(false);

  const fetchBatiments = async () => {
    try {
      setRefreshing(true);
      const response = await FetchGET(authToken, 'api/elevage/batiments');
      const data = await response.json();
      setBatiments(data);
    } catch (error) {
      console.error('Erreur lors de la récupération des bâtiments:', error);
      Alert.alert('Erreur', t('batiments.fetchError'));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchBatiments();
  }, []);

  const resetForm = () => {
    setFormData({
      nom: '',
      typeElevage: undefined,
      typeBatiment: undefined,
      capacite: undefined,
      superficie: undefined,
      ventilation: undefined,
      notes: undefined
    });
    setShowTypeBatimentOptions(false);
  };

  const handleAddBatiment = () => {
    setEditingBatiment(null);
    resetForm();
    setIsModalOpen(true);
  };

  const handleEditBatiment = (batiment: BatimentResponse) => {
    setEditingBatiment(batiment);
    setFormData({
      nom: batiment.nom,
      typeElevage: batiment.typeElevage,
      typeBatiment: batiment.typeBatiment,
      capacite: batiment.capacite,
      superficie: batiment.superficie,
      ventilation: batiment.ventilation,
      notes: batiment.notes
    });
    setIsModalOpen(true);
  };

  const handleDeleteBatiment = async (id: number) => {
    Alert.alert(
      t('common.confirmation'),
      t('batiments.deleteConfirm'),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          onPress: async () => {
            try {
              await FetchDELETE(authToken, 'api/elevage/batiments', id);
              setBatiments(batiments.filter(b => b.id !== id));
            } catch (error) {
              console.error('Erreur lors de la suppression:', error);
              Alert.alert('Erreur', t('batiments.deleteError'));
            }
          },
          style: 'destructive',
        },
      ],
      { cancelable: false }
    );
  };

  const handleSubmit = async () => {
    if (!formData.nom.trim()) {
      Alert.alert(t('common.error'), t('batiments.nameRequired'));
      return;
    }

    try {
      let response;
      if (editingBatiment) {
        response = await FetchUPDATE(authToken, 'api/elevage/batiments', editingBatiment.id, formData);
      } else {
        response = await FetchCREATE(authToken, 'api/elevage/batiments', formData);
      }

      if (response.ok) {
        await fetchBatiments();
        setIsModalOpen(false);
        resetForm();
      } else {
        throw new Error('Request failed');
      }
    } catch (error) {
      console.error('Erreur lors de la soumission:', error);
      Alert.alert('Erreur', t('batiments.submitError'));
    }
  };

  const filteredBatiments = batiments.filter(batiment => {
    const matchesSearch = batiment.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batiment.typeBatiment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         batiment.notes?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesFilter = !filterType || batiment.typeElevage === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getTypeElevageColor = (type?: TypeElevage) => {
    switch (type) {
      case TypeElevage.BOVIN: return { backgroundColor: '#DBEAFE' };
      case TypeElevage.AVICOLE: return { backgroundColor: '#FEF3C7' };
      case TypeElevage.CAPRIN: return { backgroundColor: '#D1FAE5' };
      case TypeElevage.OVIN: return { backgroundColor: '#EDE9FE' };
      case TypeElevage.PISCICOLE: return { backgroundColor: '#E0F2FE' };
      default: return { backgroundColor: '#F3F4F6' };
    }
  };

  const getTypeBatimentOptions = () => {
    if (!formData.typeElevage) return [];

    switch (formData.typeElevage) {
      case TypeElevage.BOVIN:
        return Object.values(TypeBatimentBovin);
      case TypeElevage.AVICOLE:
        return Object.values(TypeBatimentAvicole);
      case TypeElevage.CAPRIN:
        return Object.values(TypeBatimentCaprin);
      case TypeElevage.OVIN:
        return Object.values(TypeBatimentOvin);
      case TypeElevage.PISCICOLE:
        return Object.values(TypeBatimentPiscicole);
      default:
        return [];
    }
  };

  const renderItem = ({ item }: { item: BatimentResponse }) => (
    <View style={[styles.batimentItem, { backgroundColor: colors.card }]}>
      <View style={styles.batimentHeader}>
        <Text style={[styles.batimentName, { color: colors.text }]}>{item.nom}</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity onPress={() => handleEditBatiment(item)}>
            <Icon name="edit" size={20} color={colors.primary} style={styles.actionIcon} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteBatiment(item.id)}>
            <Icon name="delete" size={20} color={colors.error} style={styles.actionIcon} />
          </TouchableOpacity>
        </View>
      </View>
      
      <View style={styles.batimentDetails}>
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t('batiments.typeElevage')}:
          </Text>
          {item.typeElevage && (
            <View style={[styles.typeBadge, getTypeElevageColor(item.typeElevage)]}>
              <Text style={styles.typeBadgeText}>{item.typeElevage}</Text>
            </View>
          )}
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t('batiments.typeBatiment')}:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.typeBatiment || '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t('batiments.capacity')}:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.capacite ? `${item.capacite} ${t('batiments.heads')}` : '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t('batiments.area')}:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.superficie ? `${item.superficie} m²` : '-'}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Text style={[styles.detailLabel, { color: colors.textSecondary }]}>
            {t('batiments.ventilation')}:
          </Text>
          <Text style={[styles.detailValue, { color: colors.text }]}>
            {item.ventilation || '-'}
          </Text>
        </View>
        
        {item.notes && (
          <View style={styles.notesContainer}>
            <Text style={[styles.notesText, { color: colors.textSecondary }]}>{item.notes}</Text>
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

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
          onPress={navigation.goBack}
          activeOpacity={0.7}
        >
          <Icon 
            name="arrow-left" 
            size={24} 
            color={isDark ? colors.white : '#8B4513'} 
          />
        </TouchableOpacity>

        {/* Header */}
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
            {t('batiments.title')}
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
            {t('batiments.subtitle')}
          </Text>
        </View>

        <View style={styles.filterContainer}>
          <View style={[styles.searchContainer, { backgroundColor: colors.card }]}>
            <Icon name="search" size={20} color={colors.textSecondary} style={styles.searchIcon} />
            <TextInput
              placeholder={t('batiments.searchPlaceholder')}
              value={searchTerm}
              onChangeText={setSearchTerm}
              style={[styles.searchInput, { color: colors.text }]}
              placeholderTextColor={colors.textSecondary}
            />
          </View>
          
          <View style={styles.filterRow}>
            <View style={[styles.filterSelectContainer, { backgroundColor: colors.card }]}>
              <TextInput
                value={filterType}
                onChangeText={setFilterType}
                style={[styles.filterSelect, { color: colors.text }]}
                placeholder={t('batiments.allTypes')}
                placeholderTextColor={colors.textSecondary}
              />
            </View>

            <TouchableOpacity 
              onPress={handleAddBatiment} 
              style={[styles.addButton, { backgroundColor: colors.primary }]}
            >
              <Icon name="add" size={20} color="white" />
              <Text style={styles.addButtonText}>{t('batiments.addButton')}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false} 
          style={styles.statsContainer}
          contentContainerStyle={styles.statsContent}
        >
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Icon name="home" size={32} color={colors.primary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('batiments.totalBuildings')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>{batiments.length}</Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <FAIcon name="users" size={28} color={colors.success} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('batiments.totalCapacity')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {batiments.reduce((sum, b) => sum + (b.capacite || 0), 0)}
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Icon name="thermostat" size={32} color={colors.warning} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('batiments.totalArea')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {batiments.reduce((sum, b) => sum + (b.superficie || 0), 0)} m²
            </Text>
          </View>
          
          <View style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Icon name="home" size={32} color={colors.secondary} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {t('batiments.breedingTypes')}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {new Set(batiments.map(b => b.typeElevage)).size}
            </Text>
          </View>
        </ScrollView>

        {filteredBatiments.length > 0 ? (
          <FlatList
            data={filteredBatiments}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.listContainer}
            refreshing={refreshing}
            onRefresh={fetchBatiments}
          />
        ) : (
          <View style={styles.emptyContainer}>
            <Icon name="home" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {t('batiments.noBuildings')}
            </Text>
          </View>
        )}

        <Modal
          visible={isModalOpen}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setIsModalOpen(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingBatiment ? t('batiments.editTitle') : t('batiments.addTitle')}
              </Text>
              
              <ScrollView style={styles.modalContent}>
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.name')} *
                  </Text>
                  <TextInput
                    value={formData.nom}
                    onChangeText={(text) => setFormData({...formData, nom: text})}
                    style={[styles.formInput, { 
                      backgroundColor: colors.inputBackground,
                      color: colors.text
                    }]}
                    placeholder={t('batiments.namePlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.typeElevage')}
                  </Text>
                  <View style={[styles.typeOptionsContainer, { 
                    backgroundColor: colors.inputBackground 
                  }]}>
                    {Object.values(TypeElevage).map(type => (
                      <TouchableOpacity
                        key={type}
                        onPress={() => {
                          setFormData({
                            ...formData, 
                            typeElevage: type,
                            typeBatiment: undefined
                          });
                          setShowTypeBatimentOptions(true);
                        }}
                        style={[
                          styles.typeOption,
                          formData.typeElevage === type && styles.typeOptionSelected,
                          formData.typeElevage === type && { borderColor: colors.primary }
                        ]}
                      >
                        <Text style={{ color: colors.text }}>{type}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                {showTypeBatimentOptions && formData.typeElevage && (
                  <View style={styles.formRow}>
                    <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                      {t('batiments.typeBatiment')}
                    </Text>
                    <View style={[styles.typeOptionsContainer, { 
                      backgroundColor: colors.inputBackground 
                    }]}>
                      {getTypeBatimentOptions().map(type => (
                        <TouchableOpacity
                          key={type}
                          onPress={() => setFormData({...formData, typeBatiment: type})}
                          style={[
                            styles.typeOption,
                            formData.typeBatiment === type && styles.typeOptionSelected,
                            formData.typeBatiment === type && { borderColor: colors.primary }
                          ]}
                        >
                          <Text style={{ color: colors.text }}>{type}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </View>
                )}
                
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.capacity')}
                  </Text>
                  <TextInput
                    value={formData.capacite?.toString() || ''}
                    onChangeText={(text) => setFormData({...formData, capacite: text ? parseInt(text) : undefined})}
                    style={[styles.formInput, { 
                      backgroundColor: colors.inputBackground,
                      color: colors.text
                    }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.area')}
                  </Text>
                  <TextInput
                    value={formData.superficie?.toString() || ''}
                    onChangeText={(text) => setFormData({...formData, superficie: text ? parseInt(text) : undefined})}
                    style={[styles.formInput, { 
                      backgroundColor: colors.inputBackground,
                      color: colors.text
                    }]}
                    keyboardType="numeric"
                    placeholder="0"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
                
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.ventilation')}
                  </Text>
                  <View style={[styles.typeOptionsContainer, { 
                    backgroundColor: colors.inputBackground 
                  }]}>
                    {['Naturelle', 'Forcée', 'Mixte'].map(vent => (
                      <TouchableOpacity
                        key={vent}
                        onPress={() => setFormData({...formData, ventilation: vent})}
                        style={[
                          styles.typeOption,
                          formData.ventilation === vent && styles.typeOptionSelected,
                          formData.ventilation === vent && { borderColor: colors.primary }
                        ]}
                      >
                        <Text style={{ color: colors.text }}>{vent}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
                
                <View style={styles.formRow}>
                  <Text style={[styles.formLabel, { color: colors.textSecondary }]}>
                    {t('batiments.notes')}
                  </Text>
                  <TextInput
                    value={formData.notes || ''}
                    onChangeText={(text) => setFormData({...formData, notes: text})}
                    style={[styles.formInput, { 
                      backgroundColor: colors.inputBackground,
                      color: colors.text,
                      height: 80,
                      textAlignVertical: 'top'
                    }]}
                    multiline
                    placeholder={t('batiments.notesPlaceholder')}
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </ScrollView>
              
              <View style={[styles.modalButtons, { borderTopColor: colors.border }]}>
                <TouchableOpacity
                  onPress={() => setIsModalOpen(false)}
                  style={[styles.modalButton, styles.cancelButton, { 
                    borderRightColor: colors.border 
                  }]}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.text }]}>
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleSubmit}
                  style={[styles.modalButton, { 
                    backgroundColor: colors.primary 
                  }]}
                >
                  <Text style={styles.submitButtonText}>
                    {editingBatiment ? t('common.edit') : t('common.add')}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  filterContainer: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filterSelectContainer: {
    flex: 1,
    marginRight: 12,
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  filterSelect: {
    height: 40,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  addButtonText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '500',
  },
  statsContainer: {
    marginBottom: 24,
  },
  statsContent: {
    paddingHorizontal: 8,
  },
  statCard: {
    width: 180,
    borderRadius: 8,
    padding: 16,
    marginRight: 16,
  },
  statLabel: {
    fontSize: 14,
    marginTop: 8,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  listContainer: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
  },
  batimentItem: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 16,
  },
  batimentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  batimentName: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
  },
  actionIcon: {
    marginLeft: 12,
  },
  batimentDetails: {
    marginTop: 8,
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 8,
    alignItems: 'center',
  },
  detailLabel: {
    width: 120,
    fontSize: 14,
  },
  detailValue: {
    flex: 1,
    fontSize: 14,
  },
  notesContainer: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  notesText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  typeBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  typeBadgeText: {
    fontSize: 12,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    borderRadius: 8,
    width: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    padding: 16,
    borderBottomWidth: 1,
  },
  modalContent: {
    padding: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  modalButton: {
    flex: 1,
    padding: 16,
    alignItems: 'center',
  },
  cancelButton: {
    borderRightWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '500',
  },
  submitButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  formRow: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  formInput: {
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  typeOptionsContainer: {
    borderRadius: 8,
    padding: 8,
  },
  typeOption: {
    padding: 8,
    marginBottom: 8,
    borderRadius: 8,
  },
  typeOptionSelected: {
    borderWidth: 1,
  },
});

export default BatimentManagement;