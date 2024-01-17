/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 */
// @ts-nocheck
import 'react-native-gesture-handler';
import React from 'react';
import { NavigationContainer,useNavigation,DrawerActions } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createDrawerNavigator } from '@react-navigation/drawer';
import HomeScreen from './src/screens/HomeScreen';
import NewBill from './src/screens/NewBill';
import ViewOldBills from './src/screens/ViewOldBills';
import ViewBill from './src/screens/ViewBill';
import BillEditor from './src/screens/BillEditor';
import Icon from 'react-native-vector-icons/Entypo';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Reanimated 2']);

const StackNav = ()=>{
  const Stack = createNativeStackNavigator();
  const navigation = useNavigation();
  return(
    <Stack.Navigator screenOptions={{
      headerLeft: () =>{
        return(
          <Icon
          name="menu"
          onPress={()=>navigation.dispatch(DrawerActions.openDrawer())}
          size={30}
          colour="#fff"
          />
        );
      }
    }}>
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen name="NewBill" component={NewBill} />
        <Stack.Screen name="ViewOldBills" component={ViewOldBills} />
        <Stack.Screen name="ViewBill" component={ViewBill} />
      </Stack.Navigator>
  )
}

const DrawerNav = ()=>{
  const Drawer = createDrawerNavigator();
  return(
    <Drawer.Navigator screenOptions={{
      headerShown: false
    }}>
        <Drawer.Screen name="Home " component={StackNav} />
        <Drawer.Screen name="BillEditor" component={BillEditor} options={{ headerShown: true }}/>
      </Drawer.Navigator>
  )

}

export default function App() {
  return (
    <NavigationContainer>
      <DrawerNav/>
    </NavigationContainer>
  );
}