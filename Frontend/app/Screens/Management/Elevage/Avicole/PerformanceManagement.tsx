import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Pagination } from '../../../../components/Pagination/Pagination';
import FlexibleButton from '../../../../components/Button/Buttons';

export const PerformanceManagement = () => {
  const { t } = useTranslation();
  const [currentPage, setCurrentPage] = React.useState(1);

  return (
    <ScrollView 
      style={styles.container}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>
        {t('performance.title')}
      </Text>
      
      <View style={styles.card}>
        <Text style={styles.cardTitle}>
          {t('performance.indicators')}
        </Text>
        {/* Ici vous ajouteriez vos indicateurs de performance */}
      </View>
      
      <Pagination 
        currentPage={currentPage} 
        totalPages={10} 
        onPageChange={setCurrentPage} 
      />
      
      <FlexibleButton
        text={t('performance.export')}
        icon="download"
        onPress={() => console.log('Export pressed')}
      />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
    color: '#333',
  },
});