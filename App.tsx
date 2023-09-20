/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// @ts-nocheck
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from './src/screens/HomeScreen';
import NewBill from './src/screens/NewBill';
import ViewOldBills from './src/screens/ViewOldBills';
import ViewBill from './src/screens/ViewBill';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewBill" component={NewBill} />
        <Stack.Screen name="ViewOldBills" component={ViewOldBills} />
        <Stack.Screen name="ViewBill" component={ViewBill} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}