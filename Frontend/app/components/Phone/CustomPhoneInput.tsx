import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  SafeAreaView,
  ViewStyle,
} from 'react-native';
import Ionicons from "react-native-vector-icons/Ionicons";
import { CountryCode, parsePhoneNumberFromString } from 'libphonenumber-js';
import { useTranslation } from 'react-i18next';

// Interface pour les pays
interface Country {
  code: CountryCode;
  name: string;
  flag: string;
  dial_code: string;
}

// Interface pour les props du composant
interface CustomPhoneInputProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onChangeFormattedText?: (text: string) => void;
  initialCountryCode?: string;
  placeholder?: string;
  placeholderTextColor?: string;
  style?: ViewStyle;
  containerStyle?: ViewStyle;
  isInvalid?: boolean;
}

// Définition des pays disponibles
const COUNTRIES: Country[] = [
  {
    code: 'BF',
    name: 'Burkina Faso',
    flag: '🇧🇫',
    dial_code: '+226',
  },
  {
    code: 'GH',
    name: 'Ghana',
    flag: '🇬🇭',
    dial_code: '+233',
  },
];

const CustomPhoneInput: React.FC<CustomPhoneInputProps> = ({ 
  value = '',
  onChangeText,
  onChangeFormattedText,
  initialCountryCode = 'BF',
  placeholder = 'Téléphone',
  placeholderTextColor = "#7F8C8D",
  style,
  containerStyle,
  isInvalid,
}) => {
  const [phoneNumber, setPhoneNumber] = useState<string>(value);
  const [selectedCountry, setSelectedCountry] = useState<Country>(
    COUNTRIES.find(country => country.code === initialCountryCode) || COUNTRIES[0]
  );
  const [modalVisible, setModalVisible] = useState<boolean>(false);
  const [isValid, setIsValid] = useState<boolean>(true);
  const { t } = useTranslation();

  // Validation du numéro de téléphone avec libphonenumber-js
  const validatePhoneNumber = (number: string, countryCode: CountryCode): boolean => {
    if (!number) return true; // Vide est valide (la validation du formulaire s'en occupera)
    try {
      const phoneNumber = parsePhoneNumberFromString(number, countryCode);
      return phoneNumber ? phoneNumber.isValid() : false;
    } catch (error) {
      return false;
    }
  };

  const handlePhoneChange = (text: string): void => {
    // Enlever les espaces et autres caractères non numériques sauf +
    const cleaned = text.replace(/[^0-9+]/g, '');
    setPhoneNumber(cleaned);
    
    // Formater le numéro complet (avec code pays)
    const formattedNumber = selectedCountry.dial_code + cleaned;
    
    // Vérifier si le numéro est valide pour le pays
    const valid = validatePhoneNumber(formattedNumber, selectedCountry.code);
    setIsValid(valid);
    
    // Appeler les callbacks
    if (onChangeText) onChangeText(cleaned);
    if (onChangeFormattedText) onChangeFormattedText(formattedNumber);
  };

  const changeCountry = (country: Country): void => {
    setSelectedCountry(country);
    setModalVisible(false);
    
    // Vérifier à nouveau la validité avec le nouveau code pays
    const formattedNumber = country.dial_code + phoneNumber;
    const valid = validatePhoneNumber(formattedNumber, country.code);
    setIsValid(valid);
    
    // Mettre à jour le numéro formaté
    if (onChangeFormattedText) onChangeFormattedText(formattedNumber);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      <View style={[
        styles.inputContainer,
        style,
        (isInvalid || (!isValid && phoneNumber.length > 0)) && styles.inputError
      ]}>
        <View style={styles.inputIconContainer}>
          <Ionicons name="call-outline" size={20} color="#FFD700" />
        </View>
        
        <TouchableOpacity
          style={styles.countrySelector}
          onPress={() => setModalVisible(true)}
        >
          {/* <Text style={styles.flag}>{selectedCountry.flag}</Text> */}
          <Text style={styles.dialCode}>{selectedCountry.dial_code}</Text>
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder={placeholder}
          placeholderTextColor={placeholderTextColor}
          value={phoneNumber}
          onChangeText={handlePhoneChange}
          keyboardType="phone-pad"
          returnKeyType="done"
        />
      </View>

      {/* Modal pour sélectionner le pays */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{t('common.useCountry')}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Ionicons name="close" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>
          
          <FlatList
            data={COUNTRIES}
            keyExtractor={(item) => item.code}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.countryItem}
                onPress={() => changeCountry(item)}
              >
                <Text style={styles.countryFlag}>{item.flag}</Text>
                <Text style={styles.countryName}>{item.name}</Text>
                <Text style={styles.countryDialCode}>{item.dial_code}</Text>
              </TouchableOpacity>
            )}
          />
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    marginBottom: 16,
    height: 55,
    borderWidth: 1,
    borderColor: '#2C2C2C',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  inputIconContainer: {
    paddingHorizontal: 15,
  },
  countrySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
    height: '100%',
  },
  flag: {
    fontSize: 20,
    marginRight: 5,
  },
  dialCode: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
  input: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 15,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  modalTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  countryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#2C2C2C',
  },
  countryFlag: {
    fontSize: 25,
    marginRight: 15,
  },
  countryName: {
    color: '#FFFFFF',
    fontSize: 16,
    flex: 1,
  },
  countryDialCode: {
    color: '#FFD700',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default CustomPhoneInput;