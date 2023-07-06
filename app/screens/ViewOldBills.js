import {FlatList, SafeAreaView, StyleSheet, Vibration } from 'react-native';
import colors from '../config/colors';
import Card from '../components/card';
import { getBills } from '../config/supabaseClient';
import React, { useState, useEffect } from 'react';


function ViewOldBills({navigation}) {

      const handleViewBill = (billId) => {
        navigation.navigate('ViewBill', { billId: billId });
      };
      const [bills, setBills] = useState([]);
      useEffect(() => {
        fetchBills();
      }, []);
      
      async function fetchBills() {
        const billsData = await getBills();
        if (billsData) {
          setBills(billsData);
        }
      }
      // Repeat the card items for 10 times
   
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
                onPressButton={() => {handleViewBill(item.id);

                }}/>
        )}
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