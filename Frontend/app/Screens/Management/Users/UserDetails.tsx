import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  ScrollView, 
  TouchableOpacity, 
  Alert, 
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../../types/navigations';
import { ActionButton } from '../../../components/Button/Buttons';

type UserDetailsNavigationProp = StackNavigationProp<RootStackParamList, 'UserDetails'>;
type UserDetailsRouteProp = RouteProp<RootStackParamList, 'UserDetails'>;

interface UserDetailsProps {
  navigation: UserDetailsNavigationProp;
  route: UserDetailsRouteProp;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'manager_agro' | 'manager_elevage' | 'user';
  status: 'active' | 'inactive';
  createdAt: string;
  lastLogin?: string;
}

const UserDetails = ({ navigation, route }: UserDetailsProps) => {
  const { t } = useTranslation();
  const { userId } = route.params;
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement des détails de l'utilisateur
    const fetchUserDetails = async () => {
      try {
        // Ici vous feriez normalement un appel API
        await new Promise(resolve => setTimeout(resolve, 800));
        
        const mockUser: User = {
          id: userId,
          username: userId === '1' ? 'admin1' : userId === '2' ? 'manager1' : 'user1',
          email: userId === '1' ? 'admin1@example.com' : userId === '2' ? 'manager1@example.com' : 'user1@example.com',
          role: userId === '1' ? 'admin' : userId === '2' ? 'manager' : 'user',
          status: 'active',
          createdAt: '2023-01-15T10:30:00Z',
          lastLogin: '2023-06-01T14:45:00Z'
        };
        
        setUser(mockUser);
      } catch (error) {
        Alert.alert(t('common.error'), t('user.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [userId]);

  const handleToggleStatus = () => {
    if (!user) return;
    
    const newStatus = user.status === 'active' ? 'inactive' : 'active';
    setUser({ ...user, status: newStatus });
    Alert.alert(t('common.success'), t('user.statusChanged', { status: t(`user.${newStatus}`) }));
  };

  const handleEditUser = () => {
    navigation.navigate('AddUser', { userId: user?.id, isEdit: true });
  };

  const handleDeleteUser = () => {
    Alert.alert(
      t('user.deleteTitle'),
      t('user.deleteConfirm'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        { 
          text: t('actions.delete'), 
          style: 'destructive',
          onPress: () => {
            // Ici vous feriez normalement un appel API pour supprimer
            navigation.goBack();
            Alert.alert(t('common.success'), t('user.deleteSuccess'));
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  if (!user) {
    return (
      <View style={styles.container}>
        <Text>{t('user.notFound')}</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#2E7D32" />
        </TouchableOpacity>
        <Text style={styles.title}>{t('user.userDetails')}</Text>
        <View style={styles.headerRight} />
      </View>

      <View style={styles.card}>
        <View style={styles.field}>
          <Text style={styles.label}>{t('user.username')}</Text>
          <Text style={styles.value}>{user.username}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('user.email')}</Text>
          <Text style={styles.value}>{user.email}</Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('user.role')}</Text>
          <Text style={[
            styles.value,
            styles.roleText,
            user.role === 'admin' && styles.adminRole,
            user.role === 'manager_agro' && styles.agroRole,
            user.role === 'manager_elevage' && styles.elevageRole,
          ]}>
            {t(`user.roles.${user.role}`)}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('user.status')}</Text>
          <Text style={[
            styles.value,
            user.status === 'active' ? styles.activeStatus : styles.inactiveStatus
          ]}>
            {t(`user.${user.status}`)}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('user.createdAt')}</Text>
          <Text style={styles.value}>
            {new Date(user.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {user.lastLogin && (
          <View style={styles.field}>
            <Text style={styles.label}>{t('user.lastLogin')}</Text>
            <Text style={styles.value}>
              {new Date(user.lastLogin).toLocaleString()}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.actions}>
        <ActionButton
          primary={true}
          onPress={handleToggleStatus}
          icon={user.status === 'active' ? 'eye-off-outline' : 'eye-outline'}
          text={user.status === 'active' ? t('user.deactivate') : t('user.activate')}
          style={styles.actionButton}
        />
        <ActionButton
          primary={true}
          onPress={handleEditUser}
          icon="create-outline"
          text={t('user.edit')}
          style={styles.actionButton}
        />
        <ActionButton
          primary={false}
          onPress={handleDeleteUser}
          icon="trash-outline"
          text={t('user.delete')}
          style={styles.actionButton}
        />
      </View>
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
  card: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 20,
    marginBottom: 20,
    elevation: 3,
  },
  field: {
    marginBottom: 15,
  },
  label: {
    fontSize: 14,
    color: '#777',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  roleText: {
    fontWeight: '500',
  },
  adminRole: {
    color: '#F44336',
  },
  agroRole: {
    color: '#4CAF50',
  },
  elevageRole: {
    color: '#FF9800',
  },
  activeStatus: {
    color: '#4CAF50',
    fontWeight: '500',
  },
  inactiveStatus: {
    color: '#F44336',
    fontWeight: '500',
  },
  actions: {
    width: '100%',
  },
  actionButton: {
    marginBottom: 10,
  },
});

export default UserDetails;