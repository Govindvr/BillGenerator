// @ts-nocheck

import React from 'react';
import { TouchableHighlight, Vibration, Text, StyleSheet } from 'react-native';
import colors from '../config/colors';
import Icon from 'react-native-vector-icons/AntDesign';


const DeleteButton = ({ onPress, title }) => {
    const handlePress = () => {
        // Trigger haptic feedback
        Vibration.vibrate(100);
    
        // Call the provided onPress function
        onPress();
      };
    return (
        <TouchableHighlight
        onPress={handlePress}
        style={styles.button}
        >
        
        <Text style={styles.buttonText}><Icon
          name="delete"
          size={15}
          colour="#fff"
          />{title}</Text>
        </TouchableHighlight>
    );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: 'red',
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

export default DeleteButton;
