import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface DataTableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'percentage';
  width?: number;
}

interface DataTableProps {
  data: Array<Record<string, any>>;
  columns: DataTableColumn[];
  onRowPress?: (item: any) => void;
}

const DataTable: React.FC<DataTableProps> = ({ data, columns, onRowPress }) => {
  const { colors, spacing } = useTheme();

  const formatValue = (value: any, type?: string) => {
    if (value === null || value === undefined) return '-';
    
    switch (type) {
      case 'date':
        return new Date(value).toLocaleDateString('fr-FR');
      case 'percentage':
        return `${Math.round(value * 100)}%`;
      case 'number':
        return Number(value).toLocaleString('fr-FR');
      default:
        return String(value);
    }
  };

  const styles = StyleSheet.create({
    container: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: 8,
      overflow: 'hidden',
    },
    headerRow: {
      flexDirection: 'row',
      backgroundColor: colors.primary,
      paddingVertical: spacing.small,
    },
    headerCell: {
      flex: 1,
      paddingHorizontal: spacing.small,
      fontWeight: 'bold',
      color: colors.white,
    },
    dataRow: {
      flexDirection: 'row',
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      paddingVertical: spacing.small,
    },
    dataCell: {
      flex: 1,
      paddingHorizontal: spacing.small,
      color: colors.text,
    },
    rowPressable: {
      backgroundColor: colors.background,
    },
    rowPressablePressed: {
      backgroundColor: colors.primaryLight,
    },
  });

  return (
    <ScrollView horizontal>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.headerRow}>
          {columns.map((column, index) => (
            <Text
              key={`header-${index}`}
              style={[styles.headerCell, { width: column.width || 'auto' }]}
            >
              {column.label}
            </Text>
          ))}
        </View>

        {/* Rows */}
        {data.map((item, rowIndex) => (
          <TouchableOpacity
            key={`row-${rowIndex}`}
            onPress={() => onRowPress?.(item)}
            activeOpacity={0.7}
          >
            <View style={styles.dataRow}>
              {columns.map((column, colIndex) => (
                <Text
                  key={`cell-${rowIndex}-${colIndex}`}
                  style={[styles.dataCell, { width: column.width || 'auto' }]}
                >
                  {formatValue(item[column.key], column.type)}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );
};

export default DataTable;