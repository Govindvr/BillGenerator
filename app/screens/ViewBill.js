import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Linking,ScrollView } from 'react-native';
import { getBill } from '../config/supabaseClient';
import OpenLinkButton from '../components/printButton';

function ViewBill({ route }) {

  const [bill, setBill] = useState(null);
  const [products, setProducts] = useState([]);

  useEffect(() => {
    const fetchBillDetails = async () => {
      const { billId } = route.params;
      const billDetails = await getBill(billId);
      if (billDetails) {
        setBill(billDetails.bill);
        setProducts(billDetails.products);
      }
    };
  
    fetchBillDetails();
  }, [route.params]);

  if (!bill || products.length === 0) {
    return (
      <View style={styles.container}>
        <Text>Loading...</Text>
      </View>
    );
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.heading}>Bill Details</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Invoice Number:</Text>
        <Text style={styles.label}>{bill.invoice_number}</Text>
      </View>
      
      <View style={styles.row}>
        <Text style={styles.label}>Date:</Text>
        <Text style={styles.label}>{bill.date}</Text>
      </View>

      <Text style={styles.label}>Customer Name:</Text>
      <Text style={styles.text}>{bill.customer_name}</Text>
      <Text style={styles.label}>Billing Address:</Text>
      <Text style={styles.text}>{bill.billing_address}</Text>
      
      <View style={styles.row}>
        <Text style={styles.label}>Customer GST:</Text>
        <Text style={styles.text}>{bill.customer_gst}</Text>
      </View>

      <View style={styles.row}>
        <Text style={styles.label}>Customer Phone:</Text>
        <Text style={styles.text}>{bill.customer_phone}</Text>
      </View>

      <Text style={styles.label}>Shipping Address:</Text>
      <Text style={styles.text}>{bill.shipping_address}</Text>

      <View style={styles.row}>
        <Text style={styles.label}>Total:</Text>
        <Text style={styles.text}>{bill.total}</Text>
      </View>

      <View style={styles.row}> 
        <Text style={styles.label}>CGST:</Text>
        <Text style={styles.text}>{bill.cgst}</Text>
      </View>

      <View style={styles.row}> 
        <Text style={styles.label}>SGST:</Text>
        <Text style={styles.text}>{bill.sgst}</Text>
      </View>

      <View style={styles.row}> 
        <Text style={styles.label}>Grand Total:</Text>
        <Text style={styles.label}>{bill.grand_total}</Text>
      </View>
    
      <Text style={styles.heading}>Products</Text>
      {products.map((product, index) => (
        <View key={index} style={styles.productItem}>
            <View style={styles.row}>
                <Text style={styles.label}>Product Name:</Text>
                <Text style={styles.label}>{product.product_name}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>HSN Code:</Text>
                <Text style={styles.text}>{product.hsn_sac}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>GST Rate:</Text>
                <Text style={styles.text}>{product.gst_rate}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Quantity:</Text>
                <Text style={styles.text}>{product.quantity}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Unit:</Text>
                <Text style={styles.text}>{product.unit}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Unit Price:</Text>
                <Text style={styles.text}>{product.unitprice}</Text>
            </View>

            <View style={styles.row}>
                <Text style={styles.label}>Discount:</Text>
                <Text style={styles.text}>{product.disc}</Text>
            </View>

            <View style={styles.row}>
            <Text style={styles.label}>Total:</Text>
            <Text style={styles.label}>{product.item_total}</Text>
            </View>



            
        </View>
      ))}
      <OpenLinkButton url="https://docs.google.com/spreadsheets/d/1czE1-2jvlOsDIBBcXHaN4zF3-WeWkHbwRumcuDNcFYc/export?format=pdf&portrait=true&size=A4" />

    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
  },
  heading: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 5,
  },
  label: {
    fontWeight: 'bold',
    marginBottom: 5,
    paddingEnd: 10,
  },
  text: {
    marginBottom: 5,
  },
  productItem: {
    borderWidth: 1,
    borderColor: 'gray',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
  },
});

export default ViewBill;