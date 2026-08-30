// @ts-nocheck

import React, {useState, useEffect} from 'react';
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
import {
  getProductsUpdated,
  saveProduct,
  updateProduct,
  deleteProduct,
} from '../config/supabaseClient';

// GST rate options
const GST_RATES = [
  {label: '0% (Exempt/Nil-rated)', value: '0'},
  {label: '5%', value: '5'},
  {label: '12%', value: '12'},
  {label: '18%', value: '18'},
  {label: '28%', value: '28'},
];

// Unit options
const UNITS = [
  {label: 'PCS (Pieces)', value: 'PCS'},
  {label: 'KGS (Kilograms)', value: 'KGS'},
  {label: 'LTR (Litres)', value: 'LTR'},
  {label: 'MTR (Metres)', value: 'MTR'},
  {label: 'PAIR', value: 'PAIR'},
  {label: 'DOZEN', value: 'DOZEN'},
  {label: 'GRAM', value: 'GRAM'},
  {label: 'ML (Millilitres)', value: 'ML'},
];

function ProductManagement({navigation}) {
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState([]);
  const [dialogVisible, setDialogVisible] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });

  // Form fields
  const [productName, setProductName] = useState('');
  const [hsnSac, setHsnSac] = useState('');
  const [gstRate, setGstRate] = useState('');
  const [unit, setUnit] = useState('');
  const [priceInclGst, setPriceInclGst] = useState('');

  // Validation errors
  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const data = await getProductsUpdated();
      if (data) {
        setProducts(data);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      showSnackbar('Error loading products', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({visible: true, message, type});
  };

  const resetForm = () => {
    setProductName('');
    setHsnSac('');
    setGstRate('');
    setUnit('');
    setPriceInclGst('');
    setErrors({});
    setEditingProductId(null);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!productName.trim()) {
      newErrors.productName = 'Product name is required';
    }

    if (!hsnSac.trim()) {
      newErrors.hsnSac = 'HSN/SAC code is required';
    } else if (!/^\d{4,8}$/.test(hsnSac)) {
      newErrors.hsnSac = 'HSN/SAC must be 4-8 digits';
    }

    if (!gstRate) {
      newErrors.gstRate = 'GST rate is required';
    }

    if (!unit) {
      newErrors.unit = 'Unit is required';
    }

    if (!priceInclGst) {
      newErrors.priceInclGst = 'Price (incl. GST) is required';
    } else if (
      isNaN(parseFloat(priceInclGst)) ||
      parseFloat(priceInclGst) <= 0
    ) {
      newErrors.priceInclGst = 'Price must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveProduct = async () => {
    if (!validateForm()) {
      showSnackbar('Please fix the errors below', 'error');
      return;
    }

    try {
      const productData = {
        product_name: productName.trim(),
        hsn_sac: hsnSac.trim(),
        gst_rate: parseFloat(gstRate),
        unit: unit,
        price_incl_gst: parseFloat(priceInclGst),
      };

      let result;
      if (editingProductId) {
        result = await updateProduct(editingProductId, productData);
      } else {
        result = await saveProduct(productData);
      }

      if (result.success) {
        showSnackbar(
          editingProductId
            ? 'Product updated successfully'
            : 'Product added successfully',
          'success',
        );
        setDialogVisible(false);
        resetForm();
        fetchProducts();
      } else {
        showSnackbar(result.error || 'Error saving product', 'error');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      showSnackbar('Error saving product', 'error');
    }
  };

  const handleEditProduct = product => {
    setProductName(product.product_name);
    setHsnSac(product.hsn_sac);
    setGstRate(product.gst_rate.toString());
    setUnit(product.unit);
    setPriceInclGst(product.price_incl_gst.toString());
    setEditingProductId(product.id);
    setDialogVisible(true);
  };

  const handleDeleteProduct = productId => {
    Alert.alert(
      'Delete Product',
      'Are you sure you want to delete this product?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await deleteProduct(productId);
              if (result.success) {
                showSnackbar('Product deleted successfully', 'success');
                fetchProducts();
              } else {
                showSnackbar(result.error || 'Error deleting product', 'error');
              }
            } catch (error) {
              console.error('Error deleting product:', error);
              showSnackbar('Error deleting product', 'error');
            }
          },
        },
      ],
    );
  };

  const handleOpenDialog = () => {
    resetForm();
    setDialogVisible(true);
  };

  const handleCloseDialog = () => {
    setDialogVisible(false);
    resetForm();
  };

  const renderProductItem = ({item}) => (
    <View>
      <List.Item
        title={item.product_name}
        description={`HSN: ${item.hsn_sac} • GST: ${item.gst_rate}% • ₹${Number(
          item.price_incl_gst || 0,
        ).toFixed(2)} (incl. GST)`}
        left={props => <List.Icon {...props} icon="package" />}
        right={props => (
          <View style={styles.actions}>
            <Button
              mode="text"
              onPress={() => handleEditProduct(item)}
              style={styles.actionButton}>
              Edit
            </Button>
            <Button
              mode="text"
              onPress={() => handleDeleteProduct(item.id)}
              textColor={theme.colors.error}
              style={styles.actionButton}>
              Delete
            </Button>
          </View>
        )}
      />
      <Divider />
    </View>
  );

  const keyExtractor = item => item.id;

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {products.length === 0 ? (
        <View style={styles.emptyState}>
          <Card>
            <Card.Content>
              <Text variant="bodyLarge" style={{textAlign: 'center'}}>
                No products yet
              </Text>
              <Text
                variant="bodySmall"
                style={{
                  textAlign: 'center',
                  marginTop: 8,
                  color: theme.colors.onSurfaceVariant,
                }}>
                Add products with GST-inclusive pricing for quick invoice
                creation
              </Text>
            </Card.Content>
          </Card>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={keyExtractor}
          renderItem={renderProductItem}
          contentContainerStyle={styles.listContent}
          initialNumToRender={12}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={7}
          removeClippedSubviews
        />
      )}

      {/* Add Product Button */}
      <FAB
        icon="plus"
        label="Add Product"
        onPress={handleOpenDialog}
        style={styles.fab}
      />

      {/* Dialog for Add/Edit Product */}
      <Portal>
        <Dialog visible={dialogVisible} onDismiss={handleCloseDialog}>
          <Dialog.Title>
            {editingProductId ? 'Edit Product' : 'Add Product'}
          </Dialog.Title>

          <Dialog.ScrollArea>
            <View style={styles.dialogContent}>
              {/* Product Name */}
              <TextInput
                label="Product Name *"
                value={productName}
                onChangeText={setProductName}
                mode="outlined"
                placeholder="e.g., Tomatoes, Rice"
                error={!!errors.productName}
                style={styles.input}
              />
              {errors.productName && (
                <HelperText type="error">{errors.productName}</HelperText>
              )}

              {/* HSN/SAC Code */}
              <TextInput
                label="HSN/SAC Code *"
                value={hsnSac}
                onChangeText={setHsnSac}
                mode="outlined"
                placeholder="e.g., 0702 for vegetables"
                maxLength={8}
                keyboardType="numeric"
                error={!!errors.hsnSac}
                style={styles.input}
              />
              {errors.hsnSac && (
                <HelperText type="error">{errors.hsnSac}</HelperText>
              )}
              <HelperText type="info">4-8 digit code</HelperText>

              {/* GST Rate */}
              <Text variant="labelLarge" style={styles.label}>
                GST Rate *
              </Text>
              <Dropdown
                data={GST_RATES}
                maxHeight={250}
                labelField="label"
                valueField="value"
                placeholder="Select GST rate"
                value={gstRate}
                onChange={item => setGstRate(item.value)}
                style={[
                  styles.dropdown,
                  errors.gstRate && styles.dropdownError,
                ]}
              />
              {errors.gstRate && (
                <HelperText type="error">{errors.gstRate}</HelperText>
              )}

              {/* Unit */}
              <Text variant="labelLarge" style={styles.label}>
                Unit *
              </Text>
              <Dropdown
                data={UNITS}
                maxHeight={250}
                labelField="label"
                valueField="value"
                placeholder="Select unit"
                value={unit}
                onChange={item => setUnit(item.value)}
                style={[styles.dropdown, errors.unit && styles.dropdownError]}
              />
              {errors.unit && (
                <HelperText type="error">{errors.unit}</HelperText>
              )}

              {/* Price (incl. GST) */}
              <TextInput
                label="Price (incl. GST) *"
                value={priceInclGst}
                onChangeText={setPriceInclGst}
                mode="outlined"
                placeholder="e.g., 100.00"
                keyboardType="decimal-pad"
                error={!!errors.priceInclGst}
                style={styles.input}
              />
              {errors.priceInclGst && (
                <HelperText type="error">{errors.priceInclGst}</HelperText>
              )}
              <HelperText type="info">
                What customer pays (including GST)
              </HelperText>
            </View>
          </Dialog.ScrollArea>

          <Dialog.Actions>
            <Button onPress={handleCloseDialog}>Cancel</Button>
            <Button mode="contained" onPress={handleSaveProduct}>
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

export default ProductManagement;
