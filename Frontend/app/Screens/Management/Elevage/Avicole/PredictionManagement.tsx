// PredictionManagement.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import FlexibleButton from '../../../../components/Button/Buttons';

interface ButtonItem {
  key: string;
  icon: string;
}

const buttonData: ButtonItem[] = [
  { key: 'production', icon: 'chart-line' },
  { key: 'health', icon: 'medical-bag' },
  { key: 'growth', icon: 'chart-bar' },
];

export const PredictionManagement = React.memo(() => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const renderItem = useCallback(({ item }: { item: ButtonItem }) => (
    <FlexibleButton
      text={t(`prediction.${item.key}`)}
      icon={item.icon}
      onPress={() => console.log(`${item.key} prediction pressed`)}
      style={{...styles.button, ...{ 
        borderColor: colors.primary,
        backgroundColor: colors.card 
      }}}
      textStyle={{ color: colors.text }}
      iconColor={colors.primary}
    />
  ), [t, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('prediction.title')}
      </Text>
      
      <FlatList
        data={buttonData}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  button: {
    marginVertical: 10,
    paddingVertical: 15,
    borderRadius: 10,
    borderWidth: 1,
  },
  listContent: {
    paddingBottom: 20,
  },
});