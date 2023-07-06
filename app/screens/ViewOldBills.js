import {FlatList, SafeAreaView, StyleSheet, Vibration } from 'react-native';
import colors from '../config/colors';
import Card from '../components/card';

function ViewOldBills(navigation) {
    const dummyData = [
        {
          id: '1',
          date: '2023-06-01',
          customerName: 'Mastercell Telecom Services pvt Ltd',
          amount: 100.00,
        },
        {
          id: '2',
          date: '2023-06-02',
          customerName: 'Jane Smith',
          amount: 150.00,
        },
        {
          id: '3',
          date: '2023-06-03',
          customerName: 'Michael Johnson',
          amount: 75.50,
        },
        {
          id: '4',
          date: '2023-06-04',
          customerName: 'Emily Brown',
          amount: 200.00,
        },
        {
          id: '5',
          date: '2023-06-05',
          customerName: 'David Wilson',
          amount: 120.25,
        },
        {
          id: '6',
          date: '2023-06-06',
          customerName: 'Olivia Davis',
          amount: 90.75,
        },
        {
          id: '7',
          date: '2023-06-07',
          customerName: 'James Martinez',
          amount: 180.50,
        },
        {
          id: '8',
          date: '2023-06-08',
          customerName: 'Sophia Taylor ',
          amount: 60.00,
        },
        {
          id: '9',
          date: '2023-06-09',
          customerName: 'Daniel Anderson',
          amount: 145.80,
        },
        {
          id: '10',
          date: '2023-06-10',
          customerName: 'Isabella Thomas',
          amount: 95.50,
        },
      ];
      
    
      // Repeat the card items for 10 times
      const repeatedData = dummyData
    return (
        <SafeAreaView style={styles.container}>
        <FlatList
            data={repeatedData}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => (
            <Card 
                date={item.date}
                customerName={item.customerName}
                amount={item.amount} 
                onPressButton={() => {
                    Vibration.vibrate(20);
                    console.log('View Bill button pressed');
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