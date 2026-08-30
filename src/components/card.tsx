// @ts-nocheck

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {Card, Button, Text} from 'react-native-paper';
import MaterialIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import theme from '../config/theme';

const BillCard = ({
  date,
  customerName,
  amount,
  inno,
  onPressButton,
  handleClickText,
}) => {
  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.invoiceLabel}>Invoice #{inno}</Text>
          <Text style={styles.amount}>₹{amount}</Text>
        </View>
        <Text style={styles.date}>{date}</Text>

        <View style={styles.customerRow}>
          <MaterialIcons
            name="account"
            size={20}
            color={theme.colors.primary}
          />
          <Text style={styles.customerName}>{customerName}</Text>
        </View>
      </Card.Content>

      <Card.Actions style={styles.cardActions}>
        <Button
          mode="text"
          onPress={handleClickText}
          labelStyle={styles.repeatButtonLabel}>
          Repeat Customer
        </Button>
        <Button mode="contained" onPress={onPressButton}>
          View Bill
        </Button>
      </Card.Actions>
    </Card>
  );
};

const areEqual = (prevProps, nextProps) => {
  return (
    prevProps.date === nextProps.date &&
    prevProps.customerName === nextProps.customerName &&
    prevProps.amount === nextProps.amount &&
    prevProps.inno === nextProps.inno &&
    prevProps.onPressButton === nextProps.onPressButton &&
    prevProps.handleClickText === nextProps.handleClickText
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
    borderWidth: 1,
    borderColor: theme.colors.outlineVariant,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  invoiceLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  amount: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  date: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginBottom: 8,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  customerName: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onBackground,
    flex: 1,
  },
  cardActions: {
    paddingHorizontal: 8,
    paddingBottom: 8,
    justifyContent: 'space-between',
  },
  repeatButtonLabel: {
    fontSize: 12,
  },
});

export default React.memo(BillCard, areEqual);
