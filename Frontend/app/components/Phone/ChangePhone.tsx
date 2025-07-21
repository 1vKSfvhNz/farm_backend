import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Keyboard,
  TouchableWithoutFeedback,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { NavigationProp } from '../../types/navigations';
import { showErrorToast, showSuccessToast } from '../../constants/shows';
import { FetchCREATE } from '../../constants/constantsFetch';
import { useAuth } from '../../contexts/AuthContext';
import CustomPhoneInput from './CustomPhoneInput';
import { AUTHOR } from '../../constants/sort';

const ChangePhone: React.FC = () => {
  const { authToken } = useAuth();
  const { t } = useTranslation();
  const navigation = useNavigation<NavigationProp>();

  const [phone, setPhone] = useState('');
  const [formattedPhone, setFormattedPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValid, setIsValid] = useState(false);

  // Utiliser un état pour stocker les dimensions et les mettre à jour
  const [dimensions, setDimensions] = useState(() => {
    const { width, height } = Dimensions.get('window');
    return { width, height, isLandscape: width > height };
  });

  // Écouter les changements d'orientation
  useEffect(() => {
    const onChange = ({ window }: any) => {
      const { width, height } = window;
      setDimensions({ width, height, isLandscape: width > height });
    };
    
    const subscription = Dimensions.addEventListener('change', onChange);
    
    return () => {
      // Nettoyer l'écouteur lors du démontage
      subscription.remove();
    };
  }, []);

  // Vérifier si le téléphone est valide
  useEffect(() => {
    // Au moins 8 caractères sans le code pays
    setIsValid(phone.length >= 8);
  }, [phone]);

  // Fonction pour mettre à jour le numéro de téléphone
  const handleUpdatePhone = async () => {
    if (!isValid) {
      showErrorToast(t('phone.invalidNumber'));
      return;
    }

    setIsLoading(true);
    Keyboard.dismiss();

    try {
      const response = await FetchCREATE(authToken, 'update_phone', { phone: formattedPhone});

      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        data = null;
      }
      
      if (response.ok) {
        showSuccessToast(t('phone.updateSuccess'));
        // Retourner à la page précédente après une courte pause
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        const errorMessage = data?.detail || `Erreur ${response.status}: ${response.statusText}`;
        showErrorToast(t(errorMessage));
      }
    } catch (error) {
      showErrorToast(t('phone.updateError'));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <LinearGradient
          colors={['#000000', '#111111']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={styles.gradient}
        >
          <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ScrollView
              contentContainerStyle={[
                styles.scrollContent,
                dimensions.isLandscape && styles.scrollContentLandscape
              ]}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              <View style={styles.header}>
                <TouchableOpacity
                  style={styles.backButton}
                  onPress={navigation.goBack}
                  hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
                >
                  <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t('phone.changePhone')}</Text>
                <View style={styles.placeholderButton} />
              </View>
              
              <View style={styles.container}>
                <View style={styles.infoBox}>
                  <Ionicons name="information-circle-outline" size={24} color="#FFD700" />
                  <Text style={styles.infoText}>{t('phone.updateInfo')}</Text>
                </View>
                
                <Text style={styles.label}>{t('phone.newPhoneNumber')}</Text>
                
                <CustomPhoneInput
                  value={phone}
                  onChangeText={setPhone}
                  onChangeFormattedText={setFormattedPhone}
                  initialCountryCode="BF"
                  placeholder={t('phone.enterPhone')}
                  containerStyle={styles.phoneInputContainer}
                />
                
                {phone !== '' && !isValid && (
                  <Text style={styles.errorText}>{t('phone.invalidNumber')}</Text>
                )}
                
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleUpdatePhone}
                  disabled={isLoading || !isValid}
                >
                  <LinearGradient
                    colors={isValid ? ['#FFD700', '#DAA520'] : ['rgba(255, 215, 0, 0.5)', 'rgba(218, 165, 32, 0.5)']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.buttonGradient}
                  >
                    {isLoading ? (
                      <ActivityIndicator size="small" color="#000000" />
                    ) : (
                      <>
                        <Ionicons name="save-outline" size={20} color="#000000" style={styles.buttonIcon} />
                        <Text style={styles.actionButtonText}>{t('phone.savePhone')}</Text>
                      </>
                    )}
                  </LinearGradient>
                </TouchableOpacity>
                
                <View style={styles.securityInfoContainer}>
                  <Ionicons name="shield-checkmark-outline" size={28} color="#FFD700" style={styles.securityIcon} />
                  <Text style={styles.securityInfoText}>{t('phone.securityInfo')}</Text>
                </View>
              </View>
            </ScrollView>
          </TouchableWithoutFeedback>
        </LinearGradient>
      </KeyboardAvoidingView>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          © {new Date().getFullYear()} · {AUTHOR}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#000000',
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: 20,
  },
  scrollContentLandscape: {
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 215, 0, 0.2)',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  backButton: {
    padding: 5,
  },
  placeholderButton: {
    width: 24,
  },
  container: {
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderRadius: 15,
    margin: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    alignItems: 'center',
  },
  infoText: {
    color: '#E0E0E0',
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  label: {
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 10,
    fontWeight: '500',
  },
  phoneInputContainer: {
    marginBottom: 5,
  },
  errorText: {
    color: '#E74C3C',
    fontSize: 14,
    marginBottom: 15,
  },
  actionButton: {
    marginTop: 15,
    marginBottom: 15,
    borderRadius: 10,
    overflow: 'hidden',
    elevation: 3,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
  },
  buttonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
  },
  buttonIcon: {
    marginRight: 10,
  },
  actionButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  securityInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 20,
    padding: 15,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 10,
  },
  securityIcon: {
    marginRight: 15,
  },
  securityInfoText: {
    color: '#CCCCCC',
    flex: 1,
    lineHeight: 20,
  },
  footer: {
    padding: 15,
    alignItems: 'center',
    backgroundColor: '#000000',
  },
  footerText: {
    color: '#E0E0E0',
    fontSize: 12,
  },
});

export default React.memo(ChangePhone);