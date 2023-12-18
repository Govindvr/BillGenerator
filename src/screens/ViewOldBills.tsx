// @ts-nocheck

import {FlatList, SafeAreaView, StyleSheet, Vibration } from 'react-native';
import colors from '../config/colors';
import Card from '../components/card';
import { getBills } from '../config/supabaseClient';
import React, { useState, useEffect } from 'react';
import ErrorModal from '../components/errorModal';
import testServer from '../config/test';


function ViewOldBills({navigation}) {
      const [showErrorModal, setShowErrorModal] = useState(false);

      async function handleClickText(bill_id,customerName) {
        // Trigger haptic feedback
          Vibration.vibrate(20);
    
          navigation.navigate('NewBill', { billId: bill_id });
      }

      const handleViewBill = (billId) => {
        navigation.navigate('ViewBill', { billId: billId });
      };
      
      const goHome = () => {
        setShowErrorModal(false);
        navigation.navigate('Home');
      }
      
      const [bills, setBills] = useState([]);
      useEffect(() => {
        fetchBills();
      }, []);

      
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
            <Card 
                date={item.date}
                customerName={item.customer_name}
                amount={item.grand_total} 
                inno={item.invoice_number}
                handleClickText={() => {handleClickText(item.id,item.customer_name)}}
                onPressButton={() => {handleViewBill(item.id);
                }}/>
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
});
export default ViewOldBills;