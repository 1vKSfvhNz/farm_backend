import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { useTheme } from '../../../../contexts/ThemeContext';
import { ControlePonteCreate, ControlePonteResponse, LotAvicoleResponse } from '../../../../interfaces/Elevage/avicole';
import FlexibleButton from '../../../../components/Button/Buttons';
import { TypeProductionAvicoleEnum, TypeVolailleEnum } from '../../../../enums/Elevage/avicole';
import DropdownSelect from '../../../../components/DropdownSelect';
import DatePicker from '../../../../components/DatePicker';
import { DataTable } from 'react-native-paper';
import Modal from '../../../../components/Modal';
import ControlePonteForm from './Ponte/ControlePonteForm';
import { createControlePonte, getControlesPonte, getLotsAvicoles } from '../../../../Service/avicoleService';
import { useAuth } from '../../../../contexts/AuthContext';

const GestionPonte: React.FC = () => {
  const { colors, spacing, typography } = useTheme();
  const { authToken } = useAuth();
  const [loading, setLoading] = useState(true);
  const [lots, setLots] = useState<LotAvicoleResponse[]>([]);
  const [controles, setControles] = useState<ControlePonteResponse[]>([]);
  const [selectedLot, setSelectedLot] = useState<number | null>(null);
  const [dateDebut, setDateDebut] = useState<string>(new Date().toISOString());
  const [dateFin, setDateFin] = useState<string>(new Date().toISOString());
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  if (authToken ==  null) return;
  
  const fetchData = async () => {
    try {
      setLoading(true);
      const lotsData = await getLotsAvicoles(authToken, TypeProductionAvicoleEnum.PONTE);
      setLots(lotsData);
      
      if (lotsData.length > 0) {
        const controlesData = await getControlesPonte(authToken, lotsData[0].id);
        setControles(controlesData);
        setSelectedLot(lotsData[0].id);
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les données');
    } finally {
      setLoading(false);
    }
  };

  const handleLotChange = async (lotId: number) => {
    try {
      setLoading(true);
      setSelectedLot(lotId);
      const data = await getControlesPonte(authToken, lotId);
      setControles(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de charger les contrôles');
    } finally {
      setLoading(false);
    }
  };

  const handleDateFilter = async () => {
    if (!selectedLot) return;
    try {
      setLoading(true);
      const data = await getControlesPonte(authToken, selectedLot, dateDebut, dateFin);
      setControles(data);
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de filtrer les données');
    } finally {
      setLoading(false);
    }
  };

  const handleAddControle = async (data: ControlePonteCreate) => {
    try {
      setLoading(true);
      const newControle = await createControlePonte(authToken, data);
      setControles([newControle, ...controles]);
      setShowAddModal(false);
      Alert.alert('Succès', 'Contrôle ajouté avec succès');
    } catch (error) {
      Alert.alert('Erreur', 'Échec de l\'ajout du contrôle');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      padding: spacing.medium,
      backgroundColor: colors.background,
    },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.medium,
    },
    title: {
      fontSize: typography.h4.fontSize,
      fontWeight: 'bold',
      color: colors.text,
    },
    filterContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      marginBottom: spacing.medium,
      gap: spacing.small,
    },
    filterItem: {
      flex: 1,
      minWidth: 150,
    },
    dataContainer: {
      flex: 1,
    },
  });

  if (loading && !controles.length) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Gestion des Pontes</Text>
        <FlexibleButton
          text="Ajouter"
          icon="plus"
          variant="success"
          onPress={() => setShowAddModal(true)}
          size="small"
        />
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.filterItem}>
          <DropdownSelect
            items={lots.map(lot => ({
              label: `${lot.nom} (${TypeVolailleEnum[lot.type_volaille]})`,
              value: lot.id,
            }))}
            selectedValue={selectedLot}
            onValueChange={handleLotChange}
            placeholder="Sélectionner un lot"
          />
        </View>

        <View style={styles.filterItem}>
          <DatePicker
            value={dateDebut}
            onChange={setDateDebut}
            label="Date début"
          />
        </View>

        <View style={styles.filterItem}>
          <DatePicker
            value={dateFin}
            onChange={setDateFin}
            label="Date fin"
          />
        </View>

        <FlexibleButton
          text="Filtrer"
          icon="filter"
          onPress={handleDateFilter}
          size="small"
          variant="outline"
        />
      </View>

      <View style={styles.dataContainer}>
        {controles.length > 0 ? (
          <DataTable
            data={controles}
            columns={[
              { key: 'date_controle', label: 'Date', type: 'date' },
              { key: 'nombre_oeufs', label: 'Nb œufs', type: 'number' },
              { key: 'taux_ponte', label: 'Taux ponte', type: 'percentage' },
              { key: 'taux_casses', label: 'Casses', type: 'percentage' },
              { key: 'taux_sales', label: 'Sales', type: 'percentage' },
            ]}
            onRowPress={(item) => console.log('Item pressed:', item)}
          />
        ) : (
          <Text style={{ color: colors.text, textAlign: 'center' }}>
            Aucun contrôle de ponte trouvé
          </Text>
        )}
      </View>

      <Modal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        title="Nouveau contrôle de ponte"
      >
        <ControlePonteForm
          lots={lots.filter(l => l.type_production === TypeProductionAvicoleEnum.PONTE)}
          onSubmit={handleAddControle}
          onCancel={() => setShowAddModal(false)}
        />
      </Modal>
    </View>
  );
};

export default GestionPonte;