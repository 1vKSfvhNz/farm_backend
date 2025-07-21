import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Switch,
  Modal,
  Dimensions,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { BassinResponse, PoissonCreate, PopulationBassinCreate } from '../../../interfaces/Elevage/piscicole';
import { EspecePoissonEnum, StadePoisson, TypeAlimentPoissonEnum } from '../../../enums/Elevage/piscicole';
import { FetchPOST } from '../../../constants/constantsFetch';
import { useTranslation } from 'react-i18next';

interface FishCreationModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bassins: BassinResponse[];
  colors: any;
  authToken: string | null;
  initialData?: PoissonCreate | PopulationBassinCreate | null;
  isEdit?: boolean;
  idToEdit?: number; // Ajouté pour l'édition
}

const FishCreationModal: React.FC<FishCreationModalProps> = ({
  visible,
  onClose,
  onSuccess,
  bassins,
  colors,
  authToken,
  initialData = null,
  isEdit = false,
  idToEdit,
}) => {
  const { t } = useTranslation('piscicole');
  const [isPopulation, setIsPopulation] = useState<boolean>(
    initialData ? 'nombrePoissons' in initialData : false
  );
  
  // États pour les formulaires
  const [poissonForm, setPoissonForm] = useState<PoissonCreate>({
    espece: EspecePoissonEnum.TILAPIA,
    bassinId: bassins.length > 0 ? bassins[0].id : 0,
    dateEnsemencement: new Date().toISOString().split('T')[0],
    poidsEnsemencement: 0,
    tailleEnsemencement: 0,
    origine: '',
    alimentationType: TypeAlimentPoissonEnum.GRANULES,
    stadeDeveloppement: StadePoisson.JUVENILE,
    reproducteur: false,
    ...(initialData && !('nombrePoissons' in initialData) ? initialData : {}),
  });

  const [populationForm, setPopulationForm] = useState<PopulationBassinCreate>({
    espece: EspecePoissonEnum.TILAPIA,
    bassinId: bassins.length > 0 ? bassins[0].id : 0,
    nombrePoissons: 0,
    dateEnsemencement: new Date().toISOString().split('T')[0],
    origine: '',
    poidsMoyenEnsemencement: 0,
    tailleMoyenneEnsemencement: 0,
    alimentationType: TypeAlimentPoissonEnum.GRANULES,
    stadeDeveloppement: StadePoisson.JUVENILE,
    ...(initialData && 'nombrePoissons' in initialData ? initialData : {}),
  });

  // Création ou modification
  const handleSubmit = async () => {
    try {
      const endpoint = isPopulation ? 
        'api/elevage/piscicole/populations' : 
        'api/elevage/piscicole/poissons';
      
      const data = isPopulation ? populationForm : poissonForm;
      const url = isEdit ? `${endpoint}/${idToEdit}` : endpoint;
      
      const response = await FetchPOST(authToken, url, data);

      if (response.ok) {
        Alert.alert('Succès', `${isPopulation ? 'Population' : 'Poisson'} ${isEdit ? 'modifié' : 'ajouté'} avec succès`);
        onClose();
        onSuccess();
      } else {
        const errorData = await response.json();
        Alert.alert('Erreur', errorData.message || `Impossible de ${isEdit ? 'modifier' : 'ajouter'} ${isPopulation ? 'la population' : 'le poisson'}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      Alert.alert('Erreur', `Erreur lors de ${isEdit ? 'la modification' : 'la création'}`);
    }
  };

  // Rendu du formulaire
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={onClose}>
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            {isEdit ? 'Modifier' : 'Ajouter'} {isPopulation ? 'une Population' : 'un Poisson'}
          </Text>
          <TouchableOpacity onPress={handleSubmit}>
            <Icon name="check" size={24} color={colors.success} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.formContainer}>
          {!isEdit && (
            <View style={styles.switchContainer}>
              <Text style={[styles.switchLabel, { color: colors.text }]}>
                {isPopulation ? 'Population' : 'Poisson individuel'}
              </Text>
              <Switch
                value={isPopulation}
                onValueChange={setIsPopulation}
                trackColor={{ false: colors.primary, true: colors.primary }}
                thumbColor={colors.white}
                disabled={isEdit} // Désactivé en mode édition
              />
            </View>
          )}

          {/* Champs communs */}
          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Espèce</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {Object.values(EspecePoissonEnum).map(espece => (
                <TouchableOpacity
                  key={espece}
                  style={[
                    styles.pickerItem,
                    (isPopulation ? populationForm.espece : poissonForm.espece) === espece && 
                      { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    if (isPopulation) {
                      setPopulationForm({ ...populationForm, espece });
                    } else {
                      setPoissonForm({ ...poissonForm, espece });
                    }
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    { 
                      color: (isPopulation ? populationForm.espece : poissonForm.espece) === espece ? 
                        colors.white : colors.text 
                    }
                  ]}>
                    {espece}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Bassin</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {bassins.map(bassin => (
                <TouchableOpacity
                  key={bassin.id}
                  style={[
                    styles.pickerItem,
                    (isPopulation ? populationForm.bassinId : poissonForm.bassinId) === bassin.id && 
                      { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    if (isPopulation) {
                      setPopulationForm({ ...populationForm, bassinId: bassin.id });
                    } else {
                      setPoissonForm({ ...poissonForm, bassinId: bassin.id });
                    }
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    { 
                      color: (isPopulation ? populationForm.bassinId : poissonForm.bassinId) === bassin.id ? 
                        colors.white : colors.text 
                    }
                  ]}>
                    {bassin.nom}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {isPopulation ? (
            <>
              <View style={styles.formGroup}>
                <Text style={[styles.label, { color: colors.text }]}>Nombre de poissons</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={populationForm.nombrePoissons.toString()}
                  onChangeText={(text) => setPopulationForm({ 
                    ...populationForm, 
                    nombrePoissons: parseInt(text) || 0 
                  })}
                  keyboardType="numeric"
                  placeholder="Nombre de poissons"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={styles.formRow}>
                <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Poids moyen (g)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={populationForm.poidsMoyenEnsemencement.toString()}
                    onChangeText={(text) => setPopulationForm({ 
                      ...populationForm, 
                      poidsMoyenEnsemencement: parseFloat(text) || 0 
                    })}
                    keyboardType="numeric"
                    placeholder="Poids moyen"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>

                <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                  <Text style={[styles.label, { color: colors.text }]}>Taille moyenne (cm)</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                    value={populationForm.tailleMoyenneEnsemencement.toString()}
                    onChangeText={(text) => setPopulationForm({ 
                      ...populationForm, 
                      tailleMoyenneEnsemencement: parseFloat(text) || 0 
                    })}
                    keyboardType="numeric"
                    placeholder="Taille moyenne"
                    placeholderTextColor={colors.textSecondary}
                  />
                </View>
              </View>
            </>
          ) : (
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Poids (g)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={poissonForm.poidsEnsemencement.toString()}
                  onChangeText={(text) => setPoissonForm({ 
                    ...poissonForm, 
                    poidsEnsemencement: parseFloat(text) || 0 
                  })}
                  keyboardType="numeric"
                  placeholder="Poids en grammes"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Taille (cm)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={poissonForm.tailleEnsemencement.toString()}
                  onChangeText={(text) => setPoissonForm({ 
                    ...poissonForm, 
                    tailleEnsemencement: parseFloat(text) || 0 
                  })}
                  keyboardType="numeric"
                  placeholder="Taille en cm"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Date d'ensemencement</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={isPopulation ? populationForm.dateEnsemencement : poissonForm.dateEnsemencement}
              onChangeText={(text) => {
                if (isPopulation) {
                  setPopulationForm({ ...populationForm, dateEnsemencement: text });
                } else {
                  setPoissonForm({ ...poissonForm, dateEnsemencement: text });
                }
              }}
              placeholder="AAAA-MM-JJ"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Origine</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
              value={isPopulation ? populationForm.origine : poissonForm.origine}
              onChangeText={(text) => {
                if (isPopulation) {
                  setPopulationForm({ ...populationForm, origine: text });
                } else {
                  setPoissonForm({ ...poissonForm, origine: text });
                }
              }}
              placeholder="Origine"
              placeholderTextColor={colors.textSecondary}
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Type d'alimentation</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {Object.values(TypeAlimentPoissonEnum).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.pickerItem,
                    (isPopulation ? populationForm.alimentationType : poissonForm.alimentationType) === type && 
                      { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    if (isPopulation) {
                      setPopulationForm({ ...populationForm, alimentationType: type });
                    } else {
                      setPoissonForm({ ...poissonForm, alimentationType: type });
                    }
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    { 
                      color: (isPopulation ? populationForm.alimentationType : poissonForm.alimentationType) === type ? 
                        colors.white : colors.text 
                    }
                  ]}>
                    {type}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.formGroup}>
            <Text style={[styles.label, { color: colors.text }]}>Stade de développement</Text>
            <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              {Object.values(StadePoisson).map(stade => (
                <TouchableOpacity
                  key={stade}
                  style={[
                    styles.pickerItem,
                    (isPopulation ? populationForm.stadeDeveloppement : poissonForm.stadeDeveloppement) === stade && 
                      { backgroundColor: colors.primary }
                  ]}
                  onPress={() => {
                    if (isPopulation) {
                      setPopulationForm({ ...populationForm, stadeDeveloppement: stade });
                    } else {
                      setPoissonForm({ ...poissonForm, stadeDeveloppement: stade });
                    }
                  }}
                >
                  <Text style={[
                    styles.pickerText,
                    { 
                      color: (isPopulation ? populationForm.stadeDeveloppement : poissonForm.stadeDeveloppement) === stade ? 
                        colors.white : colors.text 
                    }
                  ]}>
                    {stade}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {!isPopulation && (
            <View style={styles.formRow}>
              <View style={[styles.formGroup, { flex: 1, marginRight: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Sexe</Text>
                <View style={[styles.picker, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  {['M', 'F'].map(sexe => (
                    <TouchableOpacity
                      key={sexe}
                      style={[
                        styles.pickerItem,
                        poissonForm.sexe === sexe && { backgroundColor: colors.primary }
                      ]}
                      onPress={() => setPoissonForm({ ...poissonForm, sexe: sexe as 'M' | 'F' })}
                    >
                      <Text style={[
                        styles.pickerText,
                        { color: poissonForm.sexe === sexe ? colors.white : colors.text }
                      ]}>
                        {sexe === 'M' ? 'Mâle' : 'Femelle'}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={[styles.formGroup, { flex: 1, marginLeft: 8 }]}>
                <Text style={[styles.label, { color: colors.text }]}>Numéro d'identification</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, borderColor: colors.border, color: colors.text }]}
                  value={poissonForm.numeroIdentification || ''}
                  onChangeText={(text) => setPoissonForm({ ...poissonForm, numeroIdentification: text })}
                  placeholder="ID unique"
                  placeholderTextColor={colors.textSecondary}
                />
              </View>
            </View>
          )}

          {!isPopulation && (
            <View style={styles.formGroup}>
              <View style={styles.switchContainer}>
                <Text style={[styles.switchLabel, { color: colors.text }]}>Reproducteur</Text>
                <Switch
                  value={poissonForm.reproducteur || false}
                  onValueChange={(value) => setPoissonForm({ ...poissonForm, reproducteur: value })}
                  trackColor={{ false: colors.primary, true: colors.primary }}
                  thumbColor={colors.white}
                />
              </View>
            </View>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  formContainer: {
    flex: 1,
    padding: 20,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  formGroup: {
    marginBottom: 20,
  },
  formRow: {
    flexDirection: 'row',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  picker: {
    borderWidth: 1,
    borderRadius: 8,
    overflow: 'hidden',
  },
  pickerItem: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0, 0, 0, 0.1)',
  },
  pickerText: {
    fontSize: 16,
  },
});

export default FishCreationModal;