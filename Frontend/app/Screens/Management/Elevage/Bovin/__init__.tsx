import React from 'react';
import { View, Text } from 'react-native';
import { BovinManagementProps } from '../../../../types/navigations';

const BovinManagement: React.FC<BovinManagementProps> = ({ navigation }) => {
  return (
    <View>
      <Text>Bovin Management Screen</Text>
    </View>
  );
};

export default BovinManagement;