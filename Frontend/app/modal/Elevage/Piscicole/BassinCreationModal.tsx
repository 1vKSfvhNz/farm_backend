import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  Alert, 
  useWindowDimensions,
  Platform,
  KeyboardAvoidingView,
  ActivityIndicator,
  Switch,
  Modal,
  Pressable
} from 'react-native';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BassinCreate, BassinResponse } from '../../../interfaces/Elevage/piscicole';
import { useAuth } from '../../../contexts/AuthContext';
import { useTheme } from '../../../contexts/ThemeContext';
import { TypeHabitatPiscicoleEnum, TypeMilieuPiscicoleEnum } from '../../../enums/Elevage/piscicole';
import { FetchCREATE, FetchUPDATE } from '../../../constants/constantsFetch';

type CreateBassinModalProps = {
  visible: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bassin?: BassinResponse | null;
};

const CreateBassinModal = ({ visible, onClose, onSuccess, bassin }: CreateBassinModalProps) => {
  const { t } = useTranslation('piscicole');
  const { colors, spacing, typography, isDark } = useTheme();
  const { authToken } = useAuth();
  const { width } = useWindowDimensions();
  const isTablet = width >= 768;

  const [formData, setFormData] = useState<BassinCreate>({
    nom: '',
    typeMilieu: TypeMilieuPiscicoleEnum.EAU_DOUCE,
    typeHabitat: TypeHabitatPiscicoleEnum.BASSIN,
    superficie: 0,
    profondeurMoyenne: 0,
    capaciteMax: 0,
    dateMiseEnService: '',
    systemeFiltration: '',
    systemeAeration: '',
    notes: '',
    bassinReproduction: false,
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof BassinCreate, string>>>({});
  const [showTypeMilieuPicker, setShowTypeMilieuPicker] = useState(false);
  const [showTypeElevagePicker, setShowTypeElevagePicker] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  useEffect(() => {
    if (bassin) {
      setFormData({
        nom: bassin.nom,
        typeMilieu: bassin.typeMilieu,
        typeHabitat: bassin.typeHabitat,
        superficie: bassin.superficie,
        profondeurMoyenne: bassin.profondeurMoyenne,
        capaciteMax: bassin.capaciteMax || 0,
        dateMiseEnService: bassin.dateMiseEnService || '',
        systemeFiltration: bassin.systemeFiltration || '',
        systemeAeration: bassin.systemeAeration || '',
        notes: bassin.notes || '',
        bassinReproduction: bassin.bassinReproduction || false
      });
      
      if (bassin.dateMiseEnService) {
        setSelectedDate(new Date(bassin.dateMiseEnService));
      }
      
      setIsEditMode(true);
    } else {
      // Reset form when creating new bassin
      setFormData({
        nom: '',
        typeMilieu: TypeMilieuPiscicoleEnum.EAU_DOUCE,
        typeHabitat: TypeHabitatPiscicoleEnum.BASSIN,
        superficie: 0,
        profondeurMoyenne: 0,
        capaciteMax: 0,
        dateMiseEnService: '',
        systemeFiltration: '',
        systemeAeration: '',
        notes: '',
        bassinReproduction: false
      });
      setSelectedDate(null);
      setIsEditMode(false);
      setErrors({});
    }
  }, [bassin]);

  const typeMilieuOptions = [
    { value: TypeMilieuPiscicoleEnum.EAU_DOUCE, label: t('bassin.milieu.eau_douce') },
    { value: TypeMilieuPiscicoleEnum.EAU_SAUMATRE, label: t('bassin.milieu.eau_saumatre') },
  ];

  const typeElevageOptions = [
    { value: TypeHabitatPiscicoleEnum.BASSIN, label: t('bassin.elevage.bassin') },
    { value: TypeHabitatPiscicoleEnum.CAGE, label: t('bassin.elevage.cage') },
    { value: TypeHabitatPiscicoleEnum.ETANG, label: t('bassin.elevage.etang') },
    { value: TypeHabitatPiscicoleEnum.RECIRCULATION, label: t('bassin.elevage.recirculation') },
  ];

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof BassinCreate, string>> = {};

    if (!formData.nom?.trim()) {
      newErrors.nom = t('bassin.errors.nom_required');
    }

    if (!formData.superficie || formData.superficie <= 0) {
      newErrors.superficie = t('bassin.errors.superficie_invalid');
    }

    if (!formData.profondeurMoyenne || formData.profondeurMoyenne <= 0) {
      newErrors.profondeurMoyenne = t('bassin.errors.profondeur_invalid');
    }

    if (formData.capaciteMax !== undefined && formData.capaciteMax <= 0) {
      newErrors.capaciteMax = t('bassin.errors.capacite_invalid');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleDateChange = (event: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
      const formattedDate = date.toISOString().split('T')[0];
      updateFormData('dateMiseEnService', formattedDate);
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert(t('common.error'), t('bassin.errors.form_invalid'));
      return;
    }

    try {
      setLoading(true);
      
      const dataToSend: BassinCreate = {
        ...formData,
        superficie: Number(formData.superficie),
        profondeurMoyenne: Number(formData.profondeurMoyenne),
        capaciteMax: Number(formData.capaciteMax)
      };

      let response;
      if (isEditMode && bassin?.id) {
        response = await FetchUPDATE(authToken, 'api/elevage/piscicole/bassins', bassin.id, dataToSend);
      } else {
        response = await FetchCREATE(authToken, 'api/elevage/piscicole/bassins', dataToSend);
      }
      
      if (response.ok) {
        Alert.alert(
          t('common.success'),
          isEditMode ? t('bassin.messages.update_success') : t('bassin.messages.create_success'),
          [
            {
              text: t('common.ok'),
              onPress: () => {
                onSuccess();
                onClose();
              },
            },
          ]
        );
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 
          (isEditMode ? t('bassin.errors.update_failed') : t('bassin.errors.create_failed')));
      }
    } catch (error) {
      console.error('Error:', error);
      Alert.alert(
        t('common.error'),
        error instanceof Error ? error.message : 
          (isEditMode ? t('bassin.errors.update_failed') : t('bassin.errors.create_failed'))
      );
    } finally {
      setLoading(false);
    }
  };

  const updateFormData = (field: keyof BassinCreate, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const renderInput = (
    label: string,
    field: keyof BassinCreate,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline = false
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: isDark ? colors.white : colors.text }]}>
        {label} {['nom', 'superficie', 'profondeurMoyenne'].includes(field) && '*'}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.textArea,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
            borderColor: errors[field] ? colors.error : isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
            color: isDark ? colors.white : colors.text,
          }
        ]}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)'}
        value={String(formData[field] || '')}
        onChangeText={(value) => updateFormData(field, keyboardType === 'numeric' ? parseFloat(value) || 0 : value)}
        keyboardType={keyboardType}
        multiline={multiline}
        numberOfLines={multiline ? 4 : 1}
      />
      {errors[field] && (
        <Text style={[styles.errorText, { color: colors.error }]}>
          {errors[field]}
        </Text>
      )}
    </View>
  );

  const renderDateInput = () => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: isDark ? colors.white : colors.text }]}>
        {t('bassin.fields.date_mise_en_service')}
      </Text>
      <TouchableOpacity
        style={[
          styles.input,
          styles.dateInput,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }
        ]}
        onPress={() => setShowDatePicker(true)}
        activeOpacity={0.7}
      >
        <Text style={{ color: selectedDate ? (isDark ? colors.white : colors.text) : isDark ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.6)' }}>
          {selectedDate ? selectedDate.toLocaleDateString() : t('bassin.placeholders.date_mise_en_service')}
        </Text>
        <Icon 
          name="calendar" 
          size={20} 
          color={isDark ? colors.white : colors.text} 
        />
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={selectedDate || new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
        />
      )}
    </View>
  );

  const renderSelect = (
    label: string,
    field: keyof BassinCreate,
    options: { value: string; label: string }[],
    showPicker: boolean,
    setShowPicker: (show: boolean) => void
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: isDark ? colors.white : colors.text }]}>
        {label} *
      </Text>
      <TouchableOpacity
        style={[
          styles.selectButton,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }
        ]}
        onPress={() => setShowPicker(!showPicker)}
        activeOpacity={0.7}
      >
        <Text style={[styles.selectText, { color: isDark ? colors.white : colors.text }]}>
          {options.find(opt => opt.value === formData[field])?.label || t('common.select')}
        </Text>
        <Icon 
          name={showPicker ? "chevron-up" : "chevron-down"} 
          size={24} 
          color={isDark ? colors.white : colors.text} 
        />
      </TouchableOpacity>
      
      {showPicker && (
        <View style={[
          styles.optionsContainer,
          {
            backgroundColor: isDark ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255,255,255,0.95)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
          }
        ]}>
          <ScrollView 
            style={styles.optionsScroll}
            nestedScrollEnabled
            keyboardShouldPersistTaps="handled"
          >
            {options.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.option,
                  formData[field] === option.value && styles.selectedOption,
                  formData[field] === option.value && { backgroundColor: colors.primary }
                ]}
                onPress={() => {
                  updateFormData(field, option.value);
                  setShowPicker(false);
                }}
                activeOpacity={0.6}
              >
                <Text style={[
                  styles.optionText,
                  formData[field] === option.value && { color: colors.white }
                ]}>
                  {option.label}
                </Text>
                {formData[field] === option.value && (
                  <Icon name="check" size={20} color={colors.white} style={styles.optionIcon} />
                )}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );

  const renderSwitch = (
    label: string,
    field: keyof BassinCreate,
    value: boolean
  ) => (
    <View style={styles.inputGroup}>
      <Text style={[styles.label, { color: isDark ? colors.white : colors.text }]}>
        {label}
      </Text>
      <View style={styles.switchContainer}>
        <Switch
          value={value}
          onValueChange={(val) => updateFormData(field, val)}
          trackColor={{ false: '#767577', true: colors.primary }}
          thumbColor={value ? colors.white : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <Pressable 
        style={styles.modalOverlay}
        onPress={onClose}
      >
        <Pressable style={styles.modalContainer}>
          <LinearGradient
            colors={isDark ? ['#1A365D', '#2E4A62'] : ['#B3E5FC', '#4FC3F7', '#0288D1']}
            style={styles.gradientBackground}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <KeyboardAvoidingView
              style={styles.container}
              behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
              keyboardVerticalOffset={Platform.OS === 'ios' ? 60 : 0}
            >
              <View style={styles.header}>
                <TouchableOpacity 
                  style={[styles.backButton, {
                    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.2)',
                  }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Icon 
                    name="arrow-left" 
                    size={24} 
                    color={isDark ? colors.white : colors.text} 
                  />
                </TouchableOpacity>

                <Text style={[
                  styles.title,
                  { 
                    color: isDark ? colors.white : colors.text,
                    fontSize: isTablet ? typography.header.fontSize * 1.2 : typography.header.fontSize,
                  }
                ]}>
                  {isEditMode ? t('bassin.edit_title') : t('bassin.create_title')}
                </Text>
              </View>

              <ScrollView 
                style={styles.scrollView}
                contentContainerStyle={[styles.scrollContent, { paddingHorizontal: spacing.large }]}
                showsVerticalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
              >
                <View style={[styles.form, { 
                  maxWidth: isTablet ? 600 : '100%', 
                  alignSelf: 'center',
                  width: '100%',
                }]}>
                  {/* Basic Information */}
                  <View style={[styles.section, styles.sectionCard]}>
                    <View style={styles.sectionHeader}>
                      <Icon name="information-outline" size={20} color={isDark ? colors.white : colors.text} />
                      <Text style={[styles.sectionTitle, { color: isDark ? colors.white : colors.text, marginLeft: 8 }]}>
                        {t('bassin.basic_info')}
                      </Text>
                    </View>
                    
                    {renderInput(
                      t('bassin.fields.nom'),
                      'nom',
                      t('bassin.placeholders.nom')
                    )}

                    {renderSelect(
                      t('bassin.fields.type_milieu'),
                      'typeMilieu',
                      typeMilieuOptions,
                      showTypeMilieuPicker,
                      setShowTypeMilieuPicker
                    )}

                    {renderSelect(
                      t('bassin.fields.type_elevage'),
                      'typeHabitat',
                      typeElevageOptions,
                      showTypeElevagePicker,
                      setShowTypeElevagePicker
                    )}

                    {renderSwitch(
                      t('bassin.fields.bassin_reproduction'),
                      'bassinReproduction',
                      formData.bassinReproduction || false
                    )}
                  </View>

                  {/* Dimensions */}
                  <View style={[styles.section, styles.sectionCard]}>
                    <View style={styles.sectionHeader}>
                      <Icon name="ruler-square" size={20} color={isDark ? colors.white : colors.text} />
                      <Text style={[styles.sectionTitle, { color: isDark ? colors.white : colors.text, marginLeft: 8 }]}>
                        {t('bassin.dimensions')}
                      </Text>
                    </View>

                    <View style={styles.dimensionsRow}>
                      <View style={[styles.dimensionInput, { flex: 1 }]}>
                        {renderInput(
                          t('bassin.fields.superficie'),
                          'superficie',
                          t('bassin.placeholders.superficie'),
                          'numeric'
                        )}
                      </View>
                    </View>

                    <View style={styles.dimensionsRow}>
                      <View style={[styles.dimensionInput, { flex: 1, marginRight: 8 }]}>
                        {renderInput(
                          t('bassin.fields.profondeur_moyenne'),
                          'profondeurMoyenne',
                          t('bassin.placeholders.profondeur_moyenne'),
                          'numeric'
                        )}
                      </View>
                      <View style={[styles.dimensionInput, { flex: 1 }]}>
                        {renderInput(
                          t('bassin.fields.capacite_max'),
                          'capaciteMax',
                          t('bassin.placeholders.capacite_max'),
                          'numeric'
                        )}
                      </View>
                    </View>
                  </View>

                  {/* Additional Information */}
                  <View style={[styles.section, styles.sectionCard]}>
                    <View style={styles.sectionHeader}>
                      <Icon name="note-text-outline" size={20} color={isDark ? colors.white : colors.text} />
                      <Text style={[styles.sectionTitle, { color: isDark ? colors.white : colors.text, marginLeft: 8 }]}>
                        {t('bassin.additional_info')}
                      </Text>
                    </View>

                    {renderDateInput()}

                    {renderInput(
                      t('bassin.fields.systeme_filtration'),
                      'systemeFiltration',
                      t('bassin.placeholders.systeme_filtration')
                    )}

                    {renderInput(
                      t('bassin.fields.systeme_aeration'),
                      'systemeAeration',
                      t('bassin.placeholders.systeme_aeration')
                    )}

                    {renderInput(
                      t('bassin.fields.notes'),
                      'notes',
                      t('bassin.placeholders.notes'),
                      'default',
                      true
                    )}
                  </View>

                  {/* Submit Button */}
                  <TouchableOpacity
                    style={[
                      styles.submitButton,
                      {
                        backgroundColor: loading ? colors.disabled : colors.primary,
                        opacity: loading ? 0.7 : 1,
                      }
                    ]}
                    onPress={handleSubmit}
                    disabled={loading}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={loading ? [colors.background, colors.background] : [colors.primary, colors.primaryLight]}
                      style={styles.submitGradient}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                    >
                      {loading ? (
                        <View style={styles.loadingContainer}>
                          <ActivityIndicator size="small" color={colors.white} />
                          <Text style={[styles.submitText, { color: colors.white, marginLeft: 8 }]}>
                            {t('common.loading')}
                          </Text>
                        </View>
                      ) : (
                        <>
                          <Icon 
                            name={isEditMode ? "pencil-outline" : "plus-circle-outline"} 
                            size={20} 
                            color={colors.white} 
                            style={styles.submitIcon} 
                          />
                          <Text style={[styles.submitText, { color: colors.white }]}>
                            {isEditMode ? t('bassin.update_button') : t('bassin.create_button')}
                          </Text>
                        </>
                      )}
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </KeyboardAvoidingView>
          </LinearGradient>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 600,
    maxHeight: '90%',
    borderRadius: 16,
    overflow: 'hidden',
  },
  gradientBackground: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: Platform.OS === 'ios' ? 30 : 20,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    marginRight: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  title: {
    fontWeight: 'bold',
    letterSpacing: 0.5,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  form: {
    width: '100%',
  },
  section: {
    marginBottom: 24,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    minHeight: 48,
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  textArea: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  selectButton: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 48,
  },
  selectText: {
    fontSize: 16,
  },
  optionsContainer: {
    borderWidth: 1,
    borderRadius: 12,
    marginTop: 4,
    maxHeight: 200,
    overflow: 'hidden',
    position: 'relative',
    zIndex: 100,
  },
  optionsScroll: {
    maxHeight: 200,
  },
  option: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  selectedOption: {
    backgroundColor: '#0D47A1',
  },
  optionText: {
    fontSize: 16,
  },
  optionIcon: {
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginLeft: 4,
  },
  submitButton: {
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  submitGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 56,
    flexDirection: 'row',
  },
  submitText: {
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  submitIcon: {
    marginRight: 10,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dimensionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  dimensionInput: {
    flex: 1,
  },
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 8,
  }
});

export default CreateBassinModal;