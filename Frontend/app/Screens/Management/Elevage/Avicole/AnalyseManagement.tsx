// AnalyseManagement.tsx
import React, { useCallback } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../../../contexts/ThemeContext';
import { IconType } from '../../../../enums/Button/buttons';
import FlexibleButton from '../../../../components/Button/Buttons';
import { IconName } from '../../../../constants/icons';

interface ButtonItem {
  key: string;
  icon: IconName;
  iconType: IconType;
  label: string;
}

const buttonData: ButtonItem[] = [
  { key: 'water_quality', icon: IconName.Water, iconType: IconType.MaterialCommunityIcons, label: 'analyse.water_quality' },
  { key: 'feed_analysis', icon: IconName.Food, iconType: IconType.MaterialCommunityIcons, label: 'analyse.feed_analysis' },
  { key: 'health_analysis', icon: IconName.MedicalBag, iconType: IconType.MaterialCommunityIcons, label: 'analyse.health_analysis' },
  { key: 'production_analysis', icon: IconName.ChartBar, iconType: IconType.MaterialCommunityIcons, label: 'analyse.production_analysis' },
  { key: 'environment_analysis', icon: IconName.Analytics, iconType: IconType.MaterialCommunityIcons, label: 'analyse.environment_analysis' },
];

export const AnalyseManagement = React.memo(() => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const renderItem = useCallback(({ item }: { item: ButtonItem }) => (
    <FlexibleButton
      text={t(item.label)}
      icon={item.icon}
      iconType={item.iconType}
      onPress={() => console.log(`${item.key} pressed`)}
      style={{...styles.button, ...{ borderColor: colors.primary }}}
      textStyle={{ color: colors.text }}
      iconColor={colors.primary}
    />
  ), [t, colors]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('analyse.title')}
      </Text>
      
      <FlatList
        data={buttonData}
        renderItem={renderItem}
        keyExtractor={item => item.key}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
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
    backgroundColor: 'transparent',
    flex: 1,
    marginHorizontal: 5,
  },
  listContent: {
    paddingBottom: 20,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
});