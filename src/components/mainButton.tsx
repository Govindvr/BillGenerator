// @ts-nocheck

import React from 'react';
import {Vibration, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import theme from '../config/theme';

const MainButton = ({onPress, title, mode = 'contained'}) => {
  const handlePress = () => {
    // Trigger haptic feedback
    Vibration.vibrate(20);
    // Call the provided onPress function
    onPress();
  };

  return (
    <Button
      mode={mode}
      onPress={handlePress}
      style={styles.button}
      labelStyle={styles.buttonLabel}>
      {title}
    </Button>
  );
};

const styles = StyleSheet.create({
  button: {
    marginVertical: 8,
    borderRadius: 8,
    paddingVertical: 6,
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MainButton;
