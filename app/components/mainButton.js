import React from 'react';
import { TouchableHighlight, Vibration, Text, StyleSheet } from 'react-native';
import colors from '../config/colors';

const MainButton = ({ onPress, title }) => {
    const handlePress = () => {
        // Trigger haptic feedback
        Vibration.vibrate(20);
    
        // Call the provided onPress function
        onPress();
      };
    return (
        <TouchableHighlight
        onPress={handlePress}
        style={styles.button}
        >
        <Text style={styles.buttonText}>{title}</Text>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.secondary,
    borderRadius: 25,
    padding: 15,
    height: 50,
    width: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MainButton;
