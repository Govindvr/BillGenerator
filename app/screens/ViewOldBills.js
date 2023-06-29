import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import colors from '../config/colors';

function ViewOldBills(navigation) {
    return (
        <SafeAreaView style={styles.container}>
        <View >
            <Text>Old Bills</Text>
        </View>
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