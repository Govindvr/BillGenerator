// @ts-nocheck

import colors from '../config/colors';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';


function ErrorModal({ visible, message, onClose }) {
  return (
    <Modal visible={visible} animationType="fade" transparent>
        <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
            <Text style={styles.modalText}>{message}</Text>
            <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>OK</Text>
            </TouchableOpacity>
        </View>
        </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
    error: {
        color: 'red',
        marginBottom: 8,
      },
      modalContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
      },
      modalContent: {
        backgroundColor: 'white',
        padding: 16,
        borderRadius: 8,
        alignItems: 'center',
      },
      modalText: {
        fontSize: 16,
        marginBottom: 16,
      },
      modalButton: {
        backgroundColor: colors.secondary,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 4,
      },
      modalButtonText: {
        color: 'white',
        fontSize: 16,
      },
})

export default ErrorModal