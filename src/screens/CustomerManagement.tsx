// @ts-nocheck

import React, {useState, useEffect, useCallback} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  View,
  FlatList,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  Dialog,
  Portal,
  List,
  Divider,
  FAB,
  Snackbar,
  HelperText,
  Text,
  Card,
} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import theme from '../config/theme';
import {getStateOptions} from '../config/gstCalculations';
import {
  getCustomers,
  saveCustomer,
  updateCustomer,
} from '../config/supabaseClient';

function CustomerManagement({navigation}) {
  const [loading, setLoading] = useState(true);
  const [customers, setCustomers] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingCustomerId, setEditingCustomerId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  // Form fields
  const [customerName, setCustomerName] = useState('');
  const [gstin, setGstin] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [billingStateCode, setBillingStateCode] = useState('');
  const [billingPincode, setBillingPincode] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [shippingStateCode, setShippingStateCode] = useState('');
  const [shippingPincode, setShippingPincode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  const stateOptions = getStateOptions();

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const data = await getCustomers();
      if (data) {
        setCustomers(data);
      }
    } catch (error) {
      console.error('Error fetching customers:', error);
      showSnackbar('Error loading customers', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({visible: true, message, type});
  };

  const resetForm = () => {
    setCustomerName('');
    setGstin('');
    setBillingAddress('');
    setBillingStateCode('');
    setBillingPincode('');
    setShippingAddress('');
    setShippingStateCode('');
    setShippingPincode('');
    setPhone('');
    setEmail('');
    setErrors({});
    setEditingCustomerId(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!customerName.trim()) {
      newErrors.customerName = 'Customer name is required';
    }

    if (!billingAddress.trim()) {
      newErrors.billingAddress = 'Billing address is required';
    }

    if (!billingStateCode) {
      newErrors.billingStateCode = 'Billing state is required';
    }

    if (!billingPincode.trim()) {
      newErrors.billingPincode = 'Billing pincode is required';
    } else if (!/^\d{6}$/.test(billingPincode)) {
      newErrors.billingPincode = 'Pincode must be exactly 6 digits';
    }

    // GSTIN is optional but must be 15 chars if provided
    if (gstin && gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be exactly 15 characters';
    }

    // Phone is optional but must be 10 digits if provided
    if (phone && !/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone must be exactly 10 digits';
    }

    // Email is optional but must be valid if provided
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    // Shipping pincode must be 6 digits if provided
    if (shippingPincode && !/^\d{6}$/.test(shippingPincode)) {
      newErrors.shippingPincode = 'Shipping pincode must be exactly 6 digits';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveCustomer = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors below', 'error');
      return;
    }

    try {
      const customerData = {
        customer_name: customerName.trim(),
        gstin: gstin.trim() || null,
        billing_address: billingAddress.trim(),
        billing_state_code: billingStateCode,
        billing_pincode: billingPincode.trim(),
        shipping_address: shippingAddress.trim() || null,
        shipping_state_code: shippingStateCode || null,
        shipping_pincode: shippingPincode.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
      };

      let result;
      if (editingCustomerId) {
        result = await updateCustomer(editingCustomerId, customerData);
      } else {
        result = await saveCustomer(customerData);
      }

      if (result.success) {
        showSnackbar(
          editingCustomerId
            ? 'Customer updated successfully'
            : 'Customer added successfully',
          'success',
        );
        setDialogVisible(false);
        resetForm();
        fetchCustomers();
      } else {
        showSnackbar(result.error || 'Error saving customer', 'error');
      }
    } catch (error) {
      console.error('Error saving customer:', error);
      showSnackbar('Error saving customer', 'error');
    }
  };

  const handleEditCustomer = useCallback(customer => {
    setCustomerName(customer.customer_name);
    setGstin(customer.gstin || '');
    setBillingAddress(customer.billing_address);
    setBillingStateCode(customer.billing_state_code);
    setBillingPincode(customer.billing_pincode);
    setShippingAddress(customer.shipping_address || '');
    setShippingStateCode(customer.shipping_state_code || '');
    setShippingPincode(customer.shipping_pincode || '');
    setPhone(customer.phone || '');
    setEmail(customer.email || '');
    setEditingCustomerId(customer.id);
    setDialogVisible(true);
  }, []);

  const handleBillThisCustomer = useCallback(
    customer => {
      navigation.navigate('NewBill', {customer});
    },
    [navigation],
  );

  const handleOpenDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  const renderCustomerItem = useCallback(
    ({item}) => (
      <View>
        <List.Item
          title={item.customer_name}
          description={`${item.billing_address} • ${
            item.billing_state_code || '--'
          }`}
          left={props => <List.Icon {...props} icon="account" />}
          right={props => (
            <View style={styles.actions}>
              <Button
                mode="text"
                onPress={() => handleEditCustomer(item)}
                style={styles.actionButton}>
                Edit
              </Button>
              <Button
                mode="contained-tonal"
                onPress={() => handleBillThisCustomer(item)}
                style={styles.actionButton}>
                Bill this customer
              </Button>
            </View>
          )}
        />
        <Divider />
      </View>
    ),
    [handleBillThisCustomer, handleEditCustomer],
  );

  const keyExtractor = useCallback(item => item.id, []);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {customers.length === 0 ? (
        <View style={styles.emptyState}>
          <Card>
            <Card.Content>
              <Text variant="bodyLarge" style={{textAlign: 'center'}}>
                No customers yet
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  textAlign: 'center',
                  marginTop: 8,
                  color: theme.colors.onSurfaceVariant,
                }}>
                Add customers to reuse them when creating invoices
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <FlatList
          data={customers}
          keyExtractor={keyExtractor}
          renderItem={renderCustomerItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      {/* Add Customer Button */}
      <FAB
        icon="plus"
        label="Add Customer"
        onPress={handleOpenDialog}
        style={styles.fab}
      />

      {/* Dialog for Add/Edit Customer */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCloseDialog}>
          <Dialog.Title>
            {editingCustomerId ? 'Edit Customer' : 'Add Customer'}
          </Dialog.Title>

          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              {/* Customer Name */}
              <TextInput
                label="Customer Name *"
                value={customerName}
                onChangeText={setCustomerName}
                mode="outlined"
                error={!!errors.customerName}
                style={styles.input}
              />
              {errors.customerName && (
                <HelperText type="error">{errors.customerName}</HelperText>
              )}

              {/* GSTIN */}
              <TextInput
                label="GSTIN (Optional)"
                value={gstin}
                onChangeText={text => setGstin(text.toUpperCase())}
                mode="outlined"
                placeholder="Leave empty for B2C (unregistered)"
                maxLength={15}
                error={!!errors.gstin}
                style={styles.input}
              />
              {errors.gstin && (
                <HelperText type="error">{errors.gstin}</HelperText>
              )}
              <HelperText type="info">Null = B2C (Unregistered)</HelperText>

              {/* Billing Address */}
              <TextInput
                label="Billing Address *"
                value={billingAddress}
                onChangeText={setBillingAddress}
                mode="outlined"
                multiline
                numberOfLines={2}
                error={!!errors.billingAddress}
                style={styles.input}
              />
              {errors.billingAddress && (
                <HelperText type="error">{errors.billingAddress}</HelperText>
              )}

              {/* Billing State */}
              <Text variant="labelLarge" style={styles.label}>
                Billing State *
              </Text>
              <Dropdown
                data={stateOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select state"
                value={billingStateCode}
                onChange={item => setBillingStateCode(item.value)}
                style={[
                  styles.dropdown,
                  errors.billingStateCode && styles.dropdownError,
                ]}
              />
              {errors.billingStateCode && (
                <HelperText type="error">{errors.billingStateCode}</HelperText>
              )}

              {/* Billing Pincode */}
              <TextInput
                label="Billing Pincode *"
                value={billingPincode}
                onChangeText={setBillingPincode}
                mode="outlined"
                maxLength={6}
                keyboardType="numeric"
                error={!!errors.billingPincode}
                style={styles.input}
              />
              {errors.billingPincode && (
                <HelperText type="error">{errors.billingPincode}</HelperText>
              )}

              {/* Shipping Address */}
              <TextInput
                label="Shipping Address (Optional)"
                value={shippingAddress}
                onChangeText={setShippingAddress}
                mode="outlined"
                multiline
                numberOfLines={2}
                style={styles.input}
              />

              {/* Shipping State */}
              <Text variant="labelLarge" style={styles.label}>
                Shipping State (Optional)
              </Text>
              <Dropdown
                data={stateOptions}
                search
                maxHeight={300}
                labelField="label"
                valueField="value"
                placeholder="Select state"
                value={shippingStateCode}
                onChange={item => setShippingStateCode(item.value)}
                style={styles.dropdown}
              />

              {/* Shipping Pincode */}
              <TextInput
                label="Shipping Pincode (Optional)"
                value={shippingPincode}
                onChangeText={setShippingPincode}
                mode="outlined"
                maxLength={6}
                keyboardType="numeric"
                error={!!errors.shippingPincode}
                style={styles.input}
              />
              {errors.shippingPincode && (
                <HelperText type="error">{errors.shippingPincode}</HelperText>
              )}

              {/* Phone */}
              <TextInput
                label="Phone (Optional)"
                value={phone}
                onChangeText={setPhone}
                mode="outlined"
                maxLength={10}
                keyboardType="phone-pad"
                error={!!errors.phone}
                style={styles.input}
              />
              {errors.phone && (
                <HelperText type="error">{errors.phone}</HelperText>
              )}

              {/* Email */}
              <TextInput
                label="Email (Optional)"
                value={email}
                onChangeText={setEmail}
                mode="outlined"
                keyboardType="email-address"
                error={!!errors.email}
                style={styles.input}
              />
              {errors.email && (
                <HelperText type="error">{errors.email}</HelperText>
              )}
            </View>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveCustomer}>
              Save
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      {/* Snackbar */}
      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({...snackbar, visible: false})}
        duration={3000}
        style={{
          backgroundColor:
            snackbar.type === 'success'
              ? theme.colors.success
              : theme.colors.error,
        }}>
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingTop: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  fab: {
    position: 'absolute',
    bottom: 16,
    right: 16,
  },
  dialogContent: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  label: {
    marginBottom: 8,
    color: theme.colors.onBackground,
    fontWeight: '500',
  },
  input: {
    marginBottom: 8,
    backgroundColor: theme.colors.surface,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.surface,
  },
  dropdownError: {
    borderColor: theme.colors.error,
  },
  actions: {
    flexDirection: 'row',
  },
  actionButton: {
    marginHorizontal: 4,
  },
});

export default CustomerManagement;
