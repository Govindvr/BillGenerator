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

        return data[0].invoice_number.toString();
      }
  
      return null;
    } catch (error) {
        
      console.error('Error fetching invoice number:', error);
      return null;
    }
  }
  
  export { getLastInvoiceNumber };
  export default supabase;
  