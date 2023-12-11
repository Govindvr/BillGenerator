// @ts-nocheck

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import MainButton from './mainButton';

const Card = ({ date,customerName,amount,inno,onPressButton }) => {
  let billtitle =  `View Bill No ${inno}`;
  return (
    <View style={styles.card}>
        <View style={styles.cardText1}>
            <Text style={styles.amount}>Amount: ₹{amount}</Text>
             <Text style={styles.date}>{date}</Text>
      </View>
      <View style={styles.cardText2}>
         <Text style={styles.customerName}>{customerName}</Text>
      </View>
      <View style={styles.cardText2}>
        <MainButton title={billtitle} onPress={onPressButton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#c5edeb',
    borderRadius: 20,
    padding: 20,
    marginBottom: 8,
    elevation: 3, // for shadow on Android
    shadowColor: '#000', // for shadow on iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
  },
  date: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customerName: {
    fontSize: 14,
    marginBottom: 8,
  },
  amount: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  inno: {
    fontSize: 12,
    fontWeight: 'bold',
  },

  
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
  cardText1: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cardText2: {
    flexDirection: 'row',
    justifyContent: 'center',
    },
});

export default Card;
