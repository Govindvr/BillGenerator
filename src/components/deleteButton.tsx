// @ts-nocheck

import React from 'react';
import {Vibration, StyleSheet} from 'react-native';
import {Button} from 'react-native-paper';
import theme from '../config/theme';

const DeleteButton = ({onPress, title}) => {
  const handlePress = () => {
    // Trigger haptic feedback
    Vibration.vibrate(100);
    // Call the provided onPress function
    onPress();
  };

  return (
    <Button
      mode="contained"
      onPress={handlePress}
      style={styles.button}
      labelStyle={styles.buttonLabel}
      icon="delete"
      buttonColor={theme.colors.error}>
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

export default DeleteButton;
