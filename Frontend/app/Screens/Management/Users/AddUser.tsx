import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TextInput,
  Alert,
  ActivityIndicator,
  TouchableOpacity
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Picker } from '@react-native-picker/picker';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../../types/navigations';
import { ActionButton } from '../../../components/Button/Buttons';

type AddUserNavigationProp = StackNavigationProp<RootStackParamList, 'AddUser'>;
type AddUserRouteProp = RouteProp<RootStackParamList, 'AddUser'>;

interface AddUserProps {
  navigation: AddUserNavigationProp;
  route: AddUserRouteProp;
}

const AddUser = ({ navigation, route }: AddUserProps) => {
  const { t } = useTranslation();
  const { userId, isEdit } = route.params || {};
  const [loading, setLoading] = useState(!!userId);
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'user' as 'admin' | 'manager' | 'manager_agro' | 'manager_elevage' | 'user',
    status: 'active' as 'active' | 'inactive'
  });

  useEffect(() => {
    if (userId) {
      // Simuler un chargement des données utilisateur pour l'édition
      const fetchUserData = async () => {
        try {
          await new Promise(resolve => setTimeout(resolve, 800));
          
          const mockUser = {
            username: userId === '1' ? 'admin1' : userId === '2' ? 'manager1' : 'user1',
            email: userId === '1' ? 'admin1@example.com' : userId === '2' ? 'manager1@example.com' : 'user1@example.com',
            role: userId === '1' ? 'admin' : userId === '2' ? 'manager' : 'user',
            status: 'active'
          };
          
          setForm({
            ...mockUser,
            password: '',
            confirmPassword: ''
          });
        } catch (error) {
          Alert.alert(t('common.error'), t('user.fetchError'));
        } finally {
          setLoading(false);
        }
      };

      fetchUserData();
    }
  }, [userId]);

  const handleSubmit = () => {
    // Validation simple
    if (!form.username || !form.email) {
      Alert.alert(t('common.error'), t('user.fillRequiredFields'));
      return;
    }

    if (!isEdit && (!form.password || !form.confirmPassword)) {
      Alert.alert(t('common.error'), t('user.passwordRequired'));
      return;
    }

    if (form.password !== form.confirmPassword) {
      Alert.alert(t('common.error'), t('user.passwordsDontMatch'));
      return;
    }

    // Ici vous feriez normalement un appel API pour créer/mettre à jour l'utilisateur
    Alert.alert(
      t('common.success'), 
      isEdit ? t('user.updateSuccess') : t('user.createSuccess')
    );
    navigation.goBack();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.title}>
          {isEdit ? t('user.editUser') : t('user.addUser')}
        </Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.form}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('user.username')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('user.usernamePlaceholder')}
            value={form.username}
            onChangeText={(text) => setForm({ ...form, username: text })}
          />
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('user.email')} *</Text>
          <TextInput
            style={styles.input}
            placeholder={t('user.emailPlaceholder')}
            value={form.email}
            onChangeText={(text) => setForm({ ...form, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        {!isEdit && (
          <>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('user.password')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('user.passwordPlaceholder')}
                value={form.password}
                onChangeText={(text) => setForm({ ...form, password: text })}
                secureTextEntry
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>{t('user.confirmPassword')} *</Text>
              <TextInput
                style={styles.input}
                placeholder={t('user.confirmPasswordPlaceholder')}
                value={form.confirmPassword}
                onChangeText={(text) => setForm({ ...form, confirmPassword: text })}
                secureTextEntry
              />
            </View>
          </>
        )}

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('user.role')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.role}
              onValueChange={(value) => setForm({ ...form, role: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('user.roles.admin')} value="admin" />
              <Picker.Item label={t('user.roles.manager')} value="manager" />
              <Picker.Item label={t('user.roles.manager_agro')} value="manager_agro" />
              <Picker.Item label={t('user.roles.manager_elevage')} value="manager_elevage" />
              <Picker.Item label={t('user.roles.user')} value="user" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>{t('user.status')}</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={form.status}
              onValueChange={(value) => setForm({ ...form, status: value })}
              style={styles.picker}
            >
              <Picker.Item label={t('user.active')} value="active" />
              <Picker.Item label={t('user.inactive')} value="inactive" />
            </Picker>
          </View>
        </View>
      </View>

      <ActionButton
        primary={true}
        onPress={handleSubmit}
        icon={isEdit ? "save-outline" : "person-add-outline"}
        text={isEdit ? t('user.saveChanges') : t('user.createUser')}
        style={styles.submitButton}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  backButton: {
    padding: 5,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 30,
  },
  form: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  inputGroup: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  submitButton: {
    marginTop: 10,
  },
});

export default AddUser;