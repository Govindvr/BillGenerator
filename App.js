import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import HomeScreen from './app/screens/HomeScreen';
import NewBill from './app/screens/NewBill';
import ViewOldBills from './app/screens/ViewOldBills';
import ViewBill from './app/screens/ViewBill';

const Stack = createStackNavigator();

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