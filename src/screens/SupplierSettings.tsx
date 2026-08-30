// @ts-nocheck

import React, {useState, useEffect} from 'react';
import {
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  HelperText,
  Text,
  Card,
  Snackbar,
} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import theme from '../config/theme';
import {getStateOptions} from '../config/gstCalculations';
import {getSupplierConfig, saveSupplierConfig} from '../config/supabaseClient';

const GST_UNITS = ['PCS', 'KGS', 'LTR', 'MTR', 'PAIR', 'DOZEN', 'GRAM', 'ML'];

function SupplierSettings({navigation}) {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success', // 'success' or 'error'
  });

  // Form fields
  const [legalBusinessName, setLegalBusinessName] = useState('');
  const [businessAddress, setBusinessAddress] = useState('');
  const [stateCode, setStateCode] = useState('');
  const [pincode, setPincode] = useState('');
  const [gstin, setGstin] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  const stateOptions = getStateOptions();

  // Load existing supplier config if available
  useEffect(() => {
    fetchSupplierConfig();
  }, []);

  const fetchSupplierConfig = async () => {
    try {
      setLoading(true);
      const config = await getSupplierConfig();
      if (config) {
        setLegalBusinessName(config.legal_business_name || '');
        setBusinessAddress(config.business_address || '');
        setStateCode(config.state_code || '');
        setPincode(config.pincode || '');
        setGstin(config.gstin || '');
        setPhone(config.phone || '');
        setEmail(config.email || '');
      }
    } catch (error) {
      console.error('Error fetching supplier config:', error);
      showSnackbar('Error loading configuration', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({visible: true, message, type});
  };

  const validateForm = () => {
    const newErrors = {};

    // Legal business name
    if (!legalBusinessName.trim()) {
      newErrors.legalBusinessName = 'Business name is required';
    }

    // Business address
    if (!businessAddress.trim()) {
      newErrors.businessAddress = 'Business address is required';
    }

    // State code
    if (!stateCode) {
      newErrors.stateCode = 'State is required';
    }

    // Pincode
    if (!pincode.trim()) {
      newErrors.pincode = 'Pincode is required';
    } else if (!/^\d{6}$/.test(pincode)) {
      newErrors.pincode = 'Pincode must be exactly 6 digits';
    }

    // GSTIN
    if (!gstin.trim()) {
      newErrors.gstin = 'GSTIN is required';
    } else if (gstin.length !== 15) {
      newErrors.gstin = 'GSTIN must be exactly 15 characters';
    } else if (!gstin.startsWith(stateCode)) {
      newErrors.gstin = `GSTIN must start with state code ${stateCode}`;
    }

    // Phone (optional, but if provided must be 10 digits)
    if (phone && !/^\d{10}$/.test(phone)) {
      newErrors.phone = 'Phone must be exactly 10 digits';
    }

    // Email (optional, but if provided must be valid)
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors below', 'error');
      return;
    }

    try {
      setSaving(true);
      const config = {
        legal_business_name: legalBusinessName.trim(),
        business_address: businessAddress.trim(),
        state_code: stateCode,
        pincode: pincode.trim(),
        gstin: gstin.trim().toUpperCase(),
        phone: phone.trim() || null,
        email: email.trim() || null,
      };

      const result = await saveSupplierConfig(config);

      if (result.success) {
        showSnackbar('Configuration saved successfully', 'success');
        // Navigate back after a short delay
        setTimeout(() => {
          navigation.goBack();
        }, 1500);
      } else {
        showSnackbar(result.error || 'Error saving configuration', 'error');
      }
    } catch (error) {
      console.error('Error saving supplier config:', error);
      showSnackbar('Error saving configuration', 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Header Card */}
        <Card style={styles.headerCard}>
          <Card.Content>
            <Text variant="headlineSmall" style={styles.headerTitle}>
              Business Configuration
            </Text>
            <Text
              variant="bodySmall"
              style={{color: theme.colors.onSurfaceVariant, marginTop: 8}}>
              Set up your business details once. This information will appear on
              all invoices.
            </Text>
          </Card.Content>
        </Card>

        {/* Legal Business Name */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="Legal Business Name"
            value={legalBusinessName}
            onChangeText={setLegalBusinessName}
            mode="outlined"
            placeholder="e.g., ABC Industries Pvt Ltd"
            error={!!errors.legalBusinessName}
            style={styles.input}
          />
          {errors.legalBusinessName && (
            <HelperText type="error">{errors.legalBusinessName}</HelperText>
          )}
        </View>

        {/* Business Address */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="Business Address"
            value={businessAddress}
            onChangeText={setBusinessAddress}
            mode="outlined"
            placeholder="e.g., Unit 5, Koregaon Park, Pune"
            multiline
            numberOfLines={3}
            error={!!errors.businessAddress}
            style={styles.input}
          />
          {errors.businessAddress && (
            <HelperText type="error">{errors.businessAddress}</HelperText>
          )}
        </View>

        {/* State Code */}
        <View style={styles.fieldContainer}>
          <Text variant="labelLarge" style={styles.label}>
            State
          </Text>
          <Dropdown
            data={stateOptions}
            search
            maxHeight={300}
            labelField="label"
            valueField="value"
            placeholder="Select your state"
            value={stateCode}
            onChange={item => {
              setStateCode(item.value);
              // Clear GSTIN error when state changes
              if (errors.gstin) {
                setErrors({...errors, gstin: undefined});
              }
            }}
            style={[styles.dropdown, errors.stateCode && styles.dropdownError]}
            placeholderStyle={styles.dropdownPlaceholder}
            selectedTextStyle={styles.dropdownSelectedText}
            iconStyle={styles.dropdownIcon}
            itemTextStyle={styles.dropdownItemText}
          />
          {errors.stateCode && (
            <HelperText type="error">{errors.stateCode}</HelperText>
          )}
        </View>

        {/* Pincode */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="Pincode"
            value={pincode}
            onChangeText={setPincode}
            mode="outlined"
            placeholder="6 digits, e.g., 411001"
            maxLength={6}
            keyboardType="numeric"
            error={!!errors.pincode}
            style={styles.input}
          />
          {errors.pincode && (
            <HelperText type="error">{errors.pincode}</HelperText>
          )}
        </View>

        {/* GSTIN */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="GSTIN (15 digits)"
            value={gstin}
            onChangeText={text => setGstin(text.toUpperCase())}
            mode="outlined"
            placeholder="e.g., 27AABCT1234F1Z5"
            maxLength={15}
            error={!!errors.gstin}
            style={styles.input}
          />
          {errors.gstin && <HelperText type="error">{errors.gstin}</HelperText>}
          <HelperText type="info">
            First 2 digits must match your state code ({stateCode || '--'})
          </HelperText>
        </View>

        {/* Phone */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="Phone (Optional)"
            value={phone}
            onChangeText={setPhone}
            mode="outlined"
            placeholder="10 digit mobile number"
            maxLength={10}
            keyboardType="phone-pad"
            error={!!errors.phone}
            style={styles.input}
          />
          {errors.phone && <HelperText type="error">{errors.phone}</HelperText>}
        </View>

        {/* Email */}
        <View style={styles.fieldContainer}>
          <TextInput
            label="Email (Optional)"
            value={email}
            onChangeText={setEmail}
            mode="outlined"
            placeholder="business@example.com"
            keyboardType="email-address"
            error={!!errors.email}
            style={styles.input}
          />
          {errors.email && <HelperText type="error">{errors.email}</HelperText>}
        </View>

        {/* Save Button */}
        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleSave}
            loading={saving}
            disabled={saving}
            style={styles.saveButton}>
            Save Configuration
          </Button>
        </View>
      </ScrollView>

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
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },
  headerCard: {
    marginBottom: 24,
    backgroundColor: theme.colors.primaryContainer,
    borderRadius: 12,
  },
  headerTitle: {
    color: theme.colors.onPrimaryContainer,
    fontWeight: '600',
  },
  fieldContainer: {
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
    color: theme.colors.onBackground,
    fontWeight: '500',
  },
  input: {
    backgroundColor: theme.colors.surface,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: theme.colors.surface,
  },
  dropdownError: {
    borderColor: theme.colors.error,
  },
  dropdownPlaceholder: {
    color: theme.colors.onSurfaceVariant,
  },
  dropdownSelectedText: {
    color: theme.colors.onBackground,
  },
  dropdownIcon: {
    tintColor: theme.colors.primary,
  },
  dropdownItemText: {
    color: theme.colors.onBackground,
  },
  buttonContainer: {
    marginTop: 24,
    marginBottom: 16,
  },
  saveButton: {
    paddingVertical: 8,
  },
});

export default SupplierSettings;
