import { View, Text, SafeAreaView, StyleSheet } from 'react-native';
import colors from '../config/colors';

function NewBill() {
    return (
        <SafeAreaView style={styles.container}>
        <View >
            <Text>New Bill</Text>
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
export default NewBill;