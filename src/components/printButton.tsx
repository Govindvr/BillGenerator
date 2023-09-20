// @ts-nocheck

import React from 'react';
import { Button, Linking, View } from 'react-native';

const OpenLinkButton = ({ url,handleFunction }) => {
  const handlePress = () => {
    handleFunction();
    Linking.openURL(url);
  };

  return (
    <View>
      <Button title="Print Bill" onPress={handlePress} />
    </View>
  );
};

export default OpenLinkButton;
