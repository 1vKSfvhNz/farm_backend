import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  Text, 
  SafeAreaView, 
  TouchableOpacity, 
  useWindowDimensions,
  Platform,
  TextInput,
  Alert,
  KeyboardAvoidingView
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { AvicoleStackParamList } from '../../../../../types/navigations';
import { useTheme } from '../../../../../contexts/ThemeContext';
import GestionButton from '../../../../../components/Button/GestionButton';
import { IconType } from '../../../../../enums/Button/buttons';
import { LotAvicoleCreate } from '../../../../../interfaces/Elevage/avicole';

enum TypeLogementAvicoleEnum {
  CAGE = 'cage',
  SOL = 'sol',
  PLEIN_AIR = 'plein_air',
  MIXTE = 'mixte'
}

type CreateLotNavigationProp = StackNavigationProp<AvicoleStackParamList, 'CreateLot'>;

const CreateLot = React.memo(() => {
  const navigation = useNavigation<CreateLotNavigationProp>();
  const { t } = useTranslation();
  const { colors, spacing, typography, isDark } = useTheme();
  const { width, height } = useWindowDimensions();
  
  // Détection responsive
  const isLandscape = width > height;
  const isTablet = width >= 768;

  // État du formulaire
  const [formData, setFormData] = useState<LotAvicoleCreate>({
    nom: '',
    description: '',
    typeLot: '',
    batimentId: undefined,
    capaciteMax: undefined,
    responsable: '',
    typeLogement: undefined,
    dateMiseEnPlace: '',
    souche: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Options pour les sélecteurs
  const typeLogementOptions = useMemo(() => [
    { label: t('avicole.type_logement.cage'), value: TypeLogementAvicoleEnum.CAGE },
    { label: t('avicole.type_logement.sol'), value: TypeLogementAvicoleEnum.SOL },
    { label: t('avicole.type_logement.plein_air'), value: TypeLogementAvicoleEnum.PLEIN_AIR },
    { label: t('avicole.type_logement.mixte'), value: TypeLogementAvicoleEnum.MIXTE }
  ], [t]);

  const typeLotOptions = useMemo(() => [
    { label: t('avicole.type_lot.ponte'), value: 'ponte' },
    { label: t('avicole.type_lot.chair'), value: 'chair' },
    { label: t('avicole.type_lot.reproduction'), value: 'reproduction' },
    { label: t('avicole.type_lot.elevage'), value: 'elevage' }
  ], [t]);

  // Gestion des changements dans le formulaire
  const handleInputChange = useCallback((field: keyof LotAvicoleCreate, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  // Validation du formulaire
  const validateForm = useCallback(() => {
    if (!formData.nom.trim()) {
      Alert.alert(t('common.error'), t('avicole.create_lot.errors.nom_required'));
      return false;
    }
    if (formData.capaciteMax && formData.capaciteMax <= 0) {
      Alert.alert(t('common.error'), t('avicole.create_lot.errors.capacite_invalid'));
      return false;
    }
    return true;
  }, [formData, t]);

  // Soumission du formulaire
  const handleSubmit = useCallback(async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Ici vous ajouterez l'appel API pour créer le lot
      console.log('Données à envoyer:', formData);
      
      // Simulation d'un appel API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      Alert.alert(
        t('common.success'),
        t('avicole.create_lot.success'),
        [
          {
            text: t('common.ok'),
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      Alert.alert(t('common.error'), t('avicole.create_lot.error'));
    } finally {
      setIsSubmitting(false);
    }
  }, [formData, validateForm, t, navigation]);

  const handleGoBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const renderInput = useCallback((
    field: keyof LotAvicoleCreate,
    label: string,
    placeholder: string,
    keyboardType: 'default' | 'numeric' = 'default',
    multiline = false
  ) => (
    <View style={[styles.inputContainer, { marginBottom: spacing.medium }]}>
      <Text style={[
        styles.label,
        { 
          color: isDark ? colors.white : '#8B4513',
          fontSize: typography.body.fontSize,
          marginBottom: spacing.small
        }
      ]}>
        {label}
      </Text>
      <TextInput
        style={[
          styles.input,
          multiline && styles.multilineInput,
          {
            backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
            borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
            color: isDark ? colors.white : '#333',
            fontSize: typography.body.fontSize,
            minHeight: multiline ? 80 : 48,
            textAlignVertical: multiline ? 'top' : 'center'
          }
        ]}
        value={formData[field]?.toString() || ''}
        onChangeText={(value) => handleInputChange(field, keyboardType === 'numeric' ? Number(value) : value)}
        placeholder={placeholder}
        placeholderTextColor={isDark ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.4)'}
        keyboardType={keyboardType}
        multiline={multiline}
      />
    </View>
  ), [formData, handleInputChange, spacing, typography, colors, isDark]);

  const renderSelector = useCallback((
    field: keyof LotAvicoleCreate,
    label: string,
    options: Array<{ label: string; value: string }>,
    placeholder: string
  ) => (
    <View style={[styles.inputContainer, { marginBottom: spacing.medium }]}>
      <Text style={[
        styles.label,
        { 
          color: isDark ? colors.white : '#8B4513',
          fontSize: typography.body.fontSize,
          marginBottom: spacing.small
        }
      ]}>
        {label}
      </Text>
      <View style={[
        styles.selectorContainer,
        {
          backgroundColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.9)',
          borderColor: isDark ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.1)',
        }
      ]}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.selectorOption,
              {
                backgroundColor: formData[field] === option.value 
                  ? (isDark ? colors.primary + '40' : colors.primary + '20')
                  : 'transparent',
                borderColor: formData[field] === option.value 
                  ? colors.primary 
                  : 'transparent',
              }
            ]}
            onPress={() => handleInputChange(field, option.value)}
          >
            <Text style={[
              styles.selectorOptionText,
              {
                color: formData[field] === option.value 
                  ? colors.primary 
                  : (isDark ? colors.white : '#333'),
                fontSize: typography.body.fontSize,
              }
            ]}>
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  ), [formData, handleInputChange, spacing, typography, colors, isDark]);

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: isDark ? '#4DD0E1' : '#4FC3F7' }]}>
      <LinearGradient
        colors={isDark ? ['#4A5568', '#2D3748'] : ['#FED7AA', '#FBBF24', '#F59E0B']}
        style={styles.gradientBackground}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <KeyboardAvoidingView
          style={styles.keyboardAvoidingView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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

            {/* Header */}
            <View style={[styles.header, { marginBottom: spacing.xlarge }]}>
              <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
                <Icon 
                  name="plus-circle" 
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
                {t('avicole.create_lot.title')}
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
                {t('avicole.create_lot.subtitle')}
              </Text>
            </View>

            {/* Formulaire */}
            <View style={[
              styles.formContainer,
              {
                backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.3)',
                borderColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                maxWidth: isTablet ? 600 : '100%',
                alignSelf: 'center',
                width: '100%'
              }
            ]}>
              {renderInput('nom', t('avicole.create_lot.nom'), t('avicole.create_lot.nom_placeholder'))}
              
              {renderInput('description', t('avicole.create_lot.description'), t('avicole.create_lot.description_placeholder'), 'default', true)}
              
              {renderSelector('typeLot', t('avicole.create_lot.type_lot'), typeLotOptions, t('avicole.create_lot.type_lot_placeholder'))}
              
              {renderInput('batimentId', t('avicole.create_lot.batiment_id'), t('avicole.create_lot.batiment_id_placeholder'), 'numeric')}
              
              {renderInput('capaciteMax', t('avicole.create_lot.capacite_max'), t('avicole.create_lot.capacite_max_placeholder'), 'numeric')}
              
              {renderInput('responsable', t('avicole.create_lot.responsable'), t('avicole.create_lot.responsable_placeholder'))}
              
              {renderSelector('typeLogement', t('avicole.create_lot.type_logement'), typeLogementOptions, t('avicole.create_lot.type_logement_placeholder'))}
              
              {renderInput('dateMiseEnPlace', t('avicole.create_lot.date_mise_en_place'), t('avicole.create_lot.date_mise_en_place_placeholder'))}
              
              {renderInput('souche', t('avicole.create_lot.souche'), t('avicole.create_lot.souche_placeholder'))}
            </View>

            {/* Boutons d'action */}
            <View style={[
              styles.actionButtonsContainer,
              {
                maxWidth: isTablet ? 600 : '100%',
                alignSelf: 'center',
                width: '100%',
                marginTop: spacing.large
              }
            ]}>
              <GestionButton
                text={t('common.cancel')}
                icon="close"
                iconType={IconType.MaterialCommunityIcons}
                onPress={handleGoBack}
                style={{
                    ...styles.actionButton,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)',
                    marginRight: spacing.medium
                }}
                textStyle={{
                  color: isDark ? colors.white : '#8B4513',
                  fontSize: typography.body.fontSize,
                }}
              />
              
              <GestionButton
                text={isSubmitting ? t('common.creating') : t('common.create')}
                icon="check"
                iconType={IconType.MaterialCommunityIcons}
                onPress={handleSubmit}
                primary
                disabled={isSubmitting}
                style={{
                  ...styles.actionButton,
                  opacity: isSubmitting ? 0.6 : 1,
                  flex: 1
                }}
                textStyle={{
                  fontSize: typography.body.fontSize,
                }}
                gradientColors={[colors.primary, colors.primary + 'CC']}
              />
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardAvoidingView: {
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
  formContainer: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
  inputContainer: {
    // Conteneur pour chaque champ
  },
  label: {
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  multilineInput: {
    paddingTop: 12,
    paddingBottom: 12,
  },
  selectorContainer: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  selectorOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 4,
  },
  selectorOptionText: {
    fontWeight: '500',
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    borderRadius: 12,
    minHeight: 48,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
});

CreateLot.displayName = 'CreateLot';

export default CreateLot;