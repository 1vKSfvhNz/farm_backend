import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useTheme } from '../contexts/ThemeContext';

interface DropdownSelectProps {
  items: Array<{ label: string; value: any }>;
  selectedValue: any;
  onValueChange: (value: any) => void;
  placeholder?: string;
  label?: string;
}

const DropdownSelect: React.FC<DropdownSelectProps> = ({
  items,
  selectedValue,
  onValueChange,
  placeholder = 'Sélectionner',
  label,
}) => {
  const { colors, spacing } = useTheme();

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.medium,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: spacing.small,
    },
    pickerContainer: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    picker: {
      height: 50,
      backgroundColor: colors.background,
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.pickerContainer}>
        <Picker
          selectedValue={selectedValue}
          onValueChange={onValueChange}
          style={styles.picker}
          dropdownIconColor={colors.text}
        >
          <Picker.Item label={placeholder} value={null} />
          {items.map((item, index) => (
            <Picker.Item key={index} label={item.label} value={item.value} />
          ))}
        </Picker>
      </View>
    </View>
  );
};

export default DropdownSelect;