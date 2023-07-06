import { View, Text, SafeAreaView, StyleSheet,TextInput } from 'react-native';
import colors from '../config/colors';
import { useState,useEffect } from 'react';
import {getLastInvoiceNumber} from '../config/supabaseClient';

function NewBill() {
    const [invoiceNumber, setInvoiceNumber] = useState("");
    useEffect(() => {
        fetchInvoiceNumber();
      }, []);

      async function fetchInvoiceNumber() {
        const number = await getLastInvoiceNumber();
        setInvoiceNumber(number || 'N/A');
      }

      console.log(typeof(invoiceNumber));
    return (
    
        <SafeAreaView style={styles.container}>
        <View style={styles.twoItemBox}>
            <View style={styles.inputBox}>
                <Text style={styles.label}>{"Invoice Number"}</Text>
                <TextInput
                    style={styles.input}
                    value={invoiceNumber}
                    keyboardType="numeric"
                    defaultValue = {invoiceNumber}                
                />
            </View>
            <View style={styles.inputBox}>
                <Text style={styles.label}>{"Invoice Number"}</Text>
                <TextInput
                    style={styles.input}
                    value={2}
                 
                />
            </View>
        </View>
        </SafeAreaView>
    );
}
const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.primary,
    },
    twoItemBox: {
        flexDirection: 'row',
        justifyContent: 'space-around',
    },
    inputBox: {
        marginBottom: 20,
    },label: {
        fontSize: 16,
        fontWeight: 'bold',
        marginBottom: 5,
      },
      input: {
        height: 40,
        width: "80%",
        borderWidth: 1,
        borderColor: 'gray',
        borderRadius: 5,
        paddingHorizontal: 10,
      },
});
export default NewBill;