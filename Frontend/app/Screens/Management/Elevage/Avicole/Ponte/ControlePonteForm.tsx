import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { ControlePonteCreate } from '../../../../../interfaces/Elevage/avicole';
import { useTheme } from '../../../../../contexts/ThemeContext';
import DropdownSelect from '../../../../../components/DropdownSelect';
import DatePicker from '../../../../../components/DatePicker';
import FlexibleButton from '../../../../../components/Button/Buttons';
import InputField from '../../../../../components/InputField';

interface ControlePonteFormProps {
  lots: Array<{ id: number; nom: string }>;
  onSubmit: (data: ControlePonteCreate) => void;
  onCancel: () => void;
}

const ControlePonteForm: React.FC<ControlePonteFormProps> = ({ lots, onSubmit, onCancel }) => {
  const { colors, spacing } = useTheme();
  const [formData, setFormData] = useState<ControlePonteCreate>({
    lot_id: lots[0]?.id || 0,
    date_controle: new Date().toISOString(),
    nombre_oeufs: 0,
    poids_moyen_oeuf: 0,
    taux_ponte: 0,
    taux_casses: 0,
    taux_sales: 0,
    notes: '',
  });

  const handleSubmit = () => {
    onSubmit(formData);
  };

  const handleChange = (key: keyof ControlePonteCreate, value: any) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const styles = StyleSheet.create({
    container: {
      padding: spacing.medium,
    },
    inputRow: {
      marginBottom: spacing.medium,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      marginTop: spacing.large,
      gap: spacing.small,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputRow}>
        <DropdownSelect
          items={lots.map(lot => ({ label: lot.nom, value: lot.id }))}
          selectedValue={formData.lot_id}
          onValueChange={(value) => handleChange('lot_id', value)}
          label="Lot"
        />
      </View>

      <View style={styles.inputRow}>
        <DatePicker
          value={formData.date_controle}
          onChange={(value) => handleChange('date_controle', value)}
          label="Date du contrôle"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Nombre d'œufs"
          value={formData.nombre_oeufs ? formData.nombre_oeufs.toString() : ''}
          onChangeText={(text) => handleChange('nombre_oeufs', parseInt(text) || 0)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Poids moyen (g)"
          value={formData.poids_moyen_oeuf ? formData.poids_moyen_oeuf.toString() : ''}
          onChangeText={(text) => handleChange('poids_moyen_oeuf', parseFloat(text) || 0)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Taux de ponte (%)"
          value={formData.taux_ponte ? formData.taux_ponte.toString() : ''}
          onChangeText={(text) => handleChange('taux_ponte', parseFloat(text) || 0)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Taux de casses (%)"
          value={formData.taux_casses ? formData.taux_casses.toString() : ''}
          onChangeText={(text) => handleChange('taux_casses', parseFloat(text) || 0)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Taux de sales (%)"
          value={formData.taux_sales ? formData.taux_sales.toString() : ''}
          onChangeText={(text) => handleChange('taux_sales', parseFloat(text) || 0)}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputRow}>
        <InputField
          label="Notes"
          value={formData.notes ? formData.notes : ''}
          onChangeText={(text) => handleChange('notes', text)}
          multiline
        />
      </View>

      <View style={styles.buttonContainer}>
        <FlexibleButton
          text="Annuler"
          onPress={onCancel}
          variant="outline"
          size="small"
        />
        <FlexibleButton
          text="Enregistrer"
          onPress={handleSubmit}
          variant="success"
          size="small"
        />
      </View>
    </View>
  );
};

export default ControlePonteForm;