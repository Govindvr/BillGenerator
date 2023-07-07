import React from "react";
import 'react-native-url-polyfill/auto'
import { createClient } from '@supabase/supabase-js'
import {REACT_NATIVE_SUPABASE_URL, REACT_NATIVE_ANON_KEY } from '@env';
import AsyncStorage from '@react-native-async-storage/async-storage';

import * as SecureStore from 'expo-secure-store'

const ExpoSecureStoreAdapter = {
  getItem: (key) => {
    return SecureStore.getItemAsync(key)
  },
  setItem: (key, value) => {
    SecureStore.setItemAsync(key, value)
  },
  removeItem: (key) => {
    SecureStore.deleteItemAsync(key)
  },
}


// Use the environment variables
const supabaseUrl = REACT_NATIVE_SUPABASE_URL;
const supabaseKey = REACT_NATIVE_ANON_KEY;
  
  // Create the Supabase client with the storage option
  const supabase = createClient(supabaseUrl, supabaseKey, {  auth: {
    storage: ExpoSecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }, });
  
  async function getLastInvoiceNumber() {

    try {
      const { data, error } = await supabase
        .from('bill')
        .select('invoice_number')
        .limit(1)
        .order('invoice_number', { ascending: false });
  
      if (error) {
        
        console.error('Error fetching invoice number:', error);
        return null;
      }
  
      if (data && data.length > 0) {

        return data[0].invoice_number;
      }
  
      return null;
    } catch (error) {
        
      console.error('Error fetching invoice number:', error);
      return null;
    }
  }

  async function getBills() {
      
      try {
        const { data, error } = await supabase
          .from('bill')
          .select('id, customer_name, grand_total, date')
          .order('date', { ascending: false });
    
        if (error) {
          
          console.error('Error fetching bills:', error);
          return null;
        }
    
        if (data && data.length > 0) {
  
          return data;
        }
    
        return null;
      } catch (error) {
          
        console.error('Error fetching bills:', error);
        return null;
      }
  }

  async function getBill(id) {

    try {
      const { data, error } = await supabase
        .from('bill')
        .select(`
          *,
          billitems:billitems (product_id, product:products (product_name, gst_rate, unit, hsn_sac), quantity, pregstprice,unitprice, item_total, disc)
        `)
        .eq('id', id);
  
      if (error) {
        console.error('Error fetching bill details:', error);
        return null;
      }
  
      if (data && data.length > 0) {
        const bill = data[0];
        const products = bill.billitems.map(item => ({
          product_name: item.product.product_name,
          hsn_sac: item.product.hsn_sac,
          gst_rate: item.product.gst_rate,
          quantity: item.quantity,
          unitprice: item.unitprice,
          unit: item.product.unit,
          disc: item.disc,
          item_total: item.pregstprice,
        }));
  
        return { bill, products };
      }
  
      return null;
    } catch (error) {
      console.error('Error fetching bill details:', error);
      return null;
    }
  }
  
  async function getProducts() {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('product_name', { ascending: true });
  
      if (error) {
        console.error('Error fetching products:', error);
        return null;
      }
  
      if (data && data.length > 0) {
        return data;
      }
  
      return null;
    } catch (error) {
      console.error('Error fetching products:', error);
      return null;
    }
  }

  async function saveInvoiceToDb(invoice) {
  }
  export { getLastInvoiceNumber, getBills, getBill, getProducts };
  export default supabase;
  