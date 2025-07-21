import React, { useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  TextInput,
  Alert,
  ActivityIndicator
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RootStackParamList } from '../../../types/navigations';
import { useAuth } from '../../../contexts/AuthContext';
import { ActionButton } from '../../../components/Button/Buttons';

type UserManagementNavigationProp = StackNavigationProp<RootStackParamList, 'UserManagement'>;

interface UserManagementProps {
  navigation: UserManagementNavigationProp;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: 'admin' | 'manager' | 'manager_agro' | 'manager_elevage' | 'user';
  status: 'active' | 'inactive';
}

const UserManagement = ({ navigation }: UserManagementProps) => {
  const { t } = useTranslation();
  const { userData } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simuler un chargement d'utilisateurs depuis une API
    const fetchUsers = async () => {
      try {
        // Ici vous feriez normalement un appel API
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        const mockUsers: User[] = [
          { id: '1', username: 'admin1', email: 'admin1@example.com', role: 'admin', status: 'active' },
          { id: '2', username: 'manager1', email: 'manager1@example.com', role: 'manager', status: 'active' },
          { id: '3', username: 'agro_manager', email: 'agro@example.com', role: 'manager_agro', status: 'active' },
          { id: '4', username: 'elevage_manager', email: 'elevage@example.com', role: 'manager_elevage', status: 'active' },
          { id: '5', username: 'user1', email: 'user1@example.com', role: 'user', status: 'inactive' },
        ];
        
        setUsers(mockUsers);
      } catch (error) {
        Alert.alert(t('common.error'), t('user.fetchError'));
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleDeleteUser = (userId: string) => {
    Alert.alert(
      t('user.deleteTitle'),
      t('user.deleteConfirm'),
      [
        { text: t('actions.cancel'), style: 'cancel' },
        { 
          text: t('actions.delete'), 
          style: 'destructive',
          onPress: () => {
            setUsers(users.filter(user => user.id !== userId));
            Alert.alert(t('common.success'), t('user.deleteSuccess'));
          }
        }
      ]
    );
  };

  const renderUserItem = ({ item }: { item: User }) => (
    <TouchableOpacity 
      style={[styles.userItem, item.status === 'inactive' && styles.inactiveUser]}
      onPress={() => navigation.navigate('UserDetails', { userId: item.id })}
    >
      <View style={styles.userHeader}>
        <Text style={styles.userName}>{item.username}</Text>
        {userData?.role === 'admin' && (
          <TouchableOpacity 
            onPress={() => handleDeleteUser(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#ff4444" />
          </TouchableOpacity>
        )}
      </View>
      <Text style={styles.userEmail}>{item.email}</Text>
      <View style={styles.userMeta}>
        <Text style={[
          styles.userRole, 
          item.role === 'admin' && styles.adminRole,
          item.role === 'manager_agro' && styles.agroRole,
          item.role === 'manager_elevage' && styles.elevageRole,
        ]}>
          {t(`user.roles.${item.role}`)}
        </Text>
        <Text style={[
          styles.userStatus,
          item.status === 'active' ? styles.activeStatus : styles.inactiveStatus
        ]}>
          {item.status === 'active' ? t('user.active') : t('user.inactive')}
        </Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2E7D32" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{t('user.managementTitle')}</Text>
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder={t('user.searchPlaceholder')}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        <Ionicons name="search-outline" size={20} color="#777" style={styles.searchIcon} />
      </View>
      
      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          <Text style={styles.emptyText}>{t('user.noUsersFound')}</Text>
        }
      />
      
      {userData?.role === 'admin' && (
        <View style={styles.buttonContainer}>
          <ActionButton
            primary={true}
            onPress={() => navigation.navigate('AddUser')}
            icon="person-add"
            text={t('user.addUser')}
            accessibilityLabel={t('user.addUser')}
          />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2E7D32',
    textAlign: 'center',
    marginBottom: 20,
  },
  searchContainer: {
    position: 'relative',
    marginBottom: 15,
  },
  searchInput: {
    backgroundColor: 'white',
    padding: 12,
    paddingLeft: 40,
    borderRadius: 8,
    fontSize: 16,
    elevation: 2,
  },
  searchIcon: {
    position: 'absolute',
    left: 12,
    top: 14,
  },
  listContainer: {
    paddingBottom: 20,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 20,
    color: '#777',
  },
  userItem: {
    backgroundColor: 'white',
    padding: 15,
    borderRadius: 8,
    marginBottom: 10,
    elevation: 2,
  },
  inactiveUser: {
    opacity: 0.7,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2E7D32',
    flex: 1,
  },
  deleteButton: {
    padding: 5,
  },
  userEmail: {
    fontSize: 14,
    color: '#455A64',
    marginTop: 5,
  },
  userMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  userRole: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2196F3',
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
  userStatus: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeStatus: {
    color: '#4CAF50',
  },
  inactiveStatus: {
    color: '#F44336',
    fontStyle: 'italic',
  },
  buttonContainer: {
    width: '100%',
    paddingTop: 10,
  },
});

export default UserManagement;