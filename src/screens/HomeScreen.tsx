// @ts-nocheck

import React from 'react';
import testServer from '../config/test';
import { 
    SafeAreaView,
    View,
    Text,
    Image,
    StyleSheet,

 } from 'react-native';
import MainButton from '../components/mainButton';
import colors from '../config/colors';

function HomeScreen({navigation}) {
    const handleNewBill = () => navigation.navigate('NewBill');
    const handleViewOldBill = () => navigation.navigate('ViewOldBills');
    testServer();
    return (
        <SafeAreaView style={styles.container}>
        <View style={styles.topContainer}>
            <Image source={require('../assets/olga-logo.png')} style={{width:250, height:250}} />
            <Text style={{fontSize: 30, fontWeight: 'bold'}}>GST Bill Generator</Text>
            </View>
        <View style={styles.bottomContainer}>
            <MainButton onPress={handleNewBill} title="New Bill"/>
            <MainButton onPress={handleViewOldBill} title="View Old Bill"/>

        </View> 
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.primary,
    },
    topContainer: {
      width: '100%',
      height: '50%',
      paddingTop:0,
      alignItems: 'center',
      justifyContent: 'flex-end',
  
  
    },
    bottomContainer: {
      width: '100%',
      height: '50%',
      alignItems: 'center',
      justifyContent:'space-evenly',
    },
  });
  
export default HomeScreen;