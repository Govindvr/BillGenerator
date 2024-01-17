// @ts-nocheck

import {FlatList, SafeAreaView, StyleSheet, Vibration, View, Text, Alert } from 'react-native';
import colors from '../config/colors';
import { getBills, deleteInvoice } from '../config/supabaseClient';
import React, { useState, useEffect } from 'react';
import ErrorModal from '../components/errorModal';
import testServer from '../config/test';
import DeleteButton from '../components/deleteButton';
import { useFocusEffect } from '@react-navigation/native';


function BillEditor({navigation}) {
      const [showErrorModal, setShowErrorModal] = useState(false);

      const goHome = () => {
        setShowErrorModal(false);
        navigation.navigate('Home');
      }
      const [bills, setBills] = useState([]);

      useEffect(() => {
        fetchBills();
      }, []);
      
      const handleDeleteBill = (billId) => {
        Alert.alert(
          'Delete Bill',
          'Are you sure you want to delete this bill?',
          [
            {
              text: 'Cancel',
              onPress: () => {
                Vibration.vibrate(30);
                // console.log('Cancel Pressed');
              },
              style: 'cancel',
            },
            { 
              text: 'Delete', 
              onPress: async () => {
                Vibration.vibrate(30);
                const result = await deleteInvoice(billId);
                // console.log(result);
                if ('status' in result) {
                  // Success case
                  Alert.alert('Success', 'Invoice deleted successfully',
                  [
                    {
                      text: 'Ok',
                      onPress: () => {
                        Vibration.vibrate(30);
                        navigation.navigate('Home');
                      },
                    }
                  ]
                  );
                  // Do any additional actions you want on success
                } else if ('error' in result) {
                  // Error case
                  Alert.alert('Error', `Error deleting invoice: ${result.error}`);
                  // Handle the error, show a message to the user, or perform other actions
                } else {
                  // Handle unexpected response
                  Alert.alert('Unexpected Response', 'An unexpected response occurred');

                }
                fetchBills();
              },
            },
          ],
          { cancelable: false },
        );
      };

      useFocusEffect(
        React.useCallback(() => {
          // Fetch data or perform actions when the screen comes into focus
          fetchBills();
        }, [])
      );

      
      async function fetchBills() {
        try {
          const billsData = await getBills();
          if (billsData) {
            setBills(billsData);
          }
          else
          {
            setShowErrorModal(true);
          }
        } catch (error) {
          setShowErrorModal(true);
        }
      }

    testServer();
    return (
        <SafeAreaView style={styles.container}>
        <FlatList
            data={bills}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
            <View style={styles.card}>
                <View style={styles.cardText1}>
                    <Text style={styles.amount}>Amount: ₹{item.grand_total}</Text>
                    <Text style={styles.date}>{item.date}</Text>
              </View>
              <View style={styles.cardText2}>
                <Text style={styles.customerName}>{item.customer_name}</Text>
              </View>
              <View style={styles.cardText2}>
                <DeleteButton title={"Delete Bill No: " + `${item.invoice_number}`} onPress={() => {handleDeleteBill(item.id); }} />
              </View>
         
            </View>
        )}
        />
         <ErrorModal visible={showErrorModal} 
                      message={"Error recovering Data\nContact the Developer"}
                      onClose={goHome} 
          />
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    card: {
      backgroundColor: '#edc5c5',
      borderRadius: 20,
      padding: 20,
      paddingBottom: 5,
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
      fontWeight: 'bold',
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
    customerLink: {
      fontSize: 11,
      marginBottom: 8,
      color: 'blue',
      textDecorationLine: 'underline',
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
    cardText3: {
      flexDirection: 'row',
      justifyContent: 'center',
      padding: 8,
    },
  
});
export default BillEditor;