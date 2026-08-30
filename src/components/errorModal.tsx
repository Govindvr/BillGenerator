// @ts-nocheck

import React from 'react';
import {Dialog, Portal, Button, Text} from 'react-native-paper';
import theme from '../config/theme';

function ErrorModal({visible, message, onClose, title = 'Error'}) {
  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onClose}>
        <Dialog.Title>{title}</Dialog.Title>
        <Dialog.Content>
          <Text>{message}</Text>
        </Dialog.Content>
        <Dialog.Actions>
          <Button onPress={onClose}>OK</Button>
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

export default ErrorModal;
