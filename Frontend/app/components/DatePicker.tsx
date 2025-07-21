import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  mode?: 'date' | 'time' | 'datetime';
}

const DatePicker: React.FC<DatePickerProps> = ({
  value,
  onChange,
  label,
  mode = 'date',
}) => {
  const { colors, spacing } = useTheme();
  const [showPicker, setShowPicker] = useState(false);
  const date = value ? new Date(value) : new Date();

  const handleChange = (event: any, selectedDate?: Date) => {
    setShowPicker(false);
    if (selectedDate) {
      onChange(selectedDate.toISOString());
    }
  };

  const styles = StyleSheet.create({
    container: {
      marginBottom: spacing.medium,
    },
    label: {
      fontSize: 14,
      color: colors.text,
      marginBottom: spacing.small,
    },
    button: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      padding: spacing.medium,
      backgroundColor: colors.background,
    },
    buttonText: {
      color: colors.text,
    },
  });

  return (
    <View style={styles.container}>
      {label && <Text style={styles.label}>{label}</Text>}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setShowPicker(true)}
      >
        <Text style={styles.buttonText}>
          {format(date, 'PPP', { locale: fr })}
        </Text>
      </TouchableOpacity>
      {showPicker && (
        <DateTimePicker
          value={date}
          mode={mode}
          display="default"
          onChange={handleChange}
          locale="fr-FR"
        />
      )}
    </View>
  );
};

export default DatePicker;