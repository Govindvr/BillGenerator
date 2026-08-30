// @ts-nocheck

import {
  View,
  Text,
  SafeAreaView,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {
  TextInput,
  Button,
  Checkbox,
  Divider,
  Card,
  Snackbar,
  Dialog,
  Portal,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import {Dropdown} from 'react-native-element-dropdown';
import {useFocusEffect} from '@react-navigation/native';
import theme from '../config/theme';
import {useState, useCallback, useEffect} from 'react';
import {
  getLastInvoiceNumber,
  getSupplierConfig,
  getProductsUpdated,
  resolveOrCreateCustomerId,
  saveInvoiceToDbUpdated,
  getBillUpdated,
} from '../config/supabaseClient';
import {
  getStateOptions,
  calculateInvoiceTotals,
  isInterStateSale,
  checkEWayBillRequired,
  formatCurrency,
} from '../config/gstCalculations';
import {generateInvoicePdfFromBill} from '../config/invoicePdf';
import {
  formatInvoiceNumber,
  extractInvoiceSequenceNumber,
  normalizeInvoiceNumber,
} from '../config/invoiceNumber';

function getCurrentDate() {
  const date = new Date();
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  return `${day}-${month}-${year}`;
}

function getFinancialYearStart(date) {
  const [d, m, y] = date.split('-').map(Number);
  const currentDate = new Date(y, m - 1, d);
  const april = new Date(y, 3, 1);

  if (currentDate < april) {
    return y - 1;
  }
  return y;
}

function toDisplayDate(dateValue) {
  if (!dateValue || typeof dateValue !== 'string') {
    return dateValue;
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateValue)) {
    const [yyyy, mm, dd] = dateValue.split('-');
    return `${dd}-${mm}-${yyyy}`;
  }

  return dateValue;
}

function createEmptyProduct(serial = '1') {
  return {
    serial,
    name: '',
    hsn: '',
    gst_rate: '',
    quantity: '',
    unit: '',
    priceInclGst: '',
    discount: '0',
    product_id: '',
    itemTotalInclGst: '',
    itemGstAmount: '',
    itemTotalExclGst: '',
  };
}

const BILL_KIND_OPTIONS = [
  {value: 'B2B', label: 'B2B'},
  {value: 'B2C', label: 'B2C'},
];

function NewBill({navigation, route}) {
  // ============================================================================
  // STATE MANAGEMENT
  // ============================================================================

  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  // Invoice basics
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [date, setDate] = useState(getCurrentDate());
  const [financialYearStart, setFinancialYearStart] = useState(
    getFinancialYearStart(getCurrentDate()),
  );
  const [billKind, setBillKind] = useState('B2C');

  // Customer info
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [customerName, setCustomerName] = useState('');
  const [billingAddress, setBillingAddress] = useState('');
  const [shippingAddress, setShippingAddress] = useState('');
  const [customerGstin, setCustomerGstin] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');

  // Location & GST
  const [placeOfSupplyState, setPlaceOfSupplyState] = useState('32');
  const [supplierState, setSupplierState] = useState('');
  const [isBillOfSupply, setIsBillOfSupply] = useState(false);

  // Products & totals
  const [productsList, setProductsList] = useState([]);
  const [products, setProducts] = useState([createEmptyProduct('1')]);

  // Tax totals
  const [totalExclGst, setTotalExclGst] = useState('0.00');
  const [totalGst, setTotalGst] = useState('0.00');
  const [totalInclGst, setTotalInclGst] = useState('0.00');
  const [cgstTotal, setCgstTotal] = useState('0.00');
  const [sgstTotal, setSgstTotal] = useState('0.00');
  const [igstTotal, setIgstTotal] = useState('0.00');

  // UI state
  const [snackbar, setSnackbar] = useState({
    visible: false,
    message: '',
    type: 'success',
  });
  const [showEwayBillAlert, setShowEwayBillAlert] = useState(false);

  const stateOptions = getStateOptions();

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  useFocusEffect(
    useCallback(() => {
      initializeScreen();
    }, [
      route.params?.billId,
      route.params?.repeatCustomer,
      route.params?.customer?.id,
    ]),
  );

  const resetDraftState = () => {
    setDate(getCurrentDate());
    setFinancialYearStart(getFinancialYearStart(getCurrentDate()));
    setBillKind('B2C');
    setSelectedCustomer(null);
    setCustomerName('');
    setBillingAddress('');
    setShippingAddress('');
    setCustomerGstin('');
    setCustomerPhone('');
    setPlaceOfSupplyState('32');
    setIsBillOfSupply(false);
    setProducts([createEmptyProduct('1')]);
    setTotalExclGst('0.00');
    setTotalGst('0.00');
    setTotalInclGst('0.00');
    setCgstTotal('0.00');
    setSgstTotal('0.00');
    setIgstTotal('0.00');
    setShowEwayBillAlert(false);
  };

  const initializeScreen = async () => {
    try {
      setLoading(true);
      resetDraftState();

      let initialBillKind = route.params?.customer?.gstin ? 'B2B' : 'B2C';
      let initialBillDetails = null;

      // Fetch supplier state for IGST/CGST split
      const supplierConfig = await getSupplierConfig();
      if (supplierConfig?.state_code) {
        setSupplierState(supplierConfig.state_code);
      }

      // Fetch products
      const productsData = await getProductsUpdated();
      if (productsData) {
        setProductsList(productsData);
      }

      // If opened from customer list, prefill customer details
      if (route.params?.customer && !route.params?.billId) {
        handleCustomerSelect(route.params.customer);
        if (route.params.customer?.billing_state_code) {
          setPlaceOfSupplyState(route.params.customer.billing_state_code);
        } else {
          setPlaceOfSupplyState('32');
        }
      }

      // If editing existing bill
      if (route.params?.billId) {
        initialBillDetails = await getBillUpdated(route.params.billId);
        if (initialBillDetails) {
          initialBillKind =
            initialBillDetails.bill.bill_kind ||
            (initialBillDetails.bill.customer_gst ? 'B2B' : 'B2C');
        }
      }

      setBillKind(initialBillKind);

      const number = await getLastInvoiceNumber(
        initialBillKind,
        getFinancialYearStart(getCurrentDate()),
      );
      const nextInvoiceNumber = extractInvoiceSequenceNumber(number) + 1;
      setInvoiceNumber(formatInvoiceNumber(initialBillKind, nextInvoiceNumber));

      if (initialBillDetails) {
        const isRepeatCustomerFlow = !!route.params?.repeatCustomer;
        populateBillData(initialBillDetails, {
          keepCurrentInvoiceMeta: isRepeatCustomerFlow,
        });
      }
    } catch (error) {
      console.error('Error initializing screen:', error);
      showSnackbar('Error loading data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const populateBillData = (billDetails, options = {}) => {
    const {keepCurrentInvoiceMeta = false} = options;

    // Populate bill data for editing
    const bill = billDetails.bill;
    setBillKind(bill.bill_kind || (bill.customer_gst ? 'B2B' : 'B2C'));
    if (!keepCurrentInvoiceMeta) {
      setInvoiceNumber(String(bill.invoice_number || ''));
      setDate(toDisplayDate(bill.date));
      setFinancialYearStart(
        Number(
          bill.financial_year_start || getFinancialYearStart(getCurrentDate()),
        ),
      );
    }
    setCustomerName(bill.customer_name);
    setCustomerGstin(bill.customer_gstin || '');
    setBillingAddress(bill.billing_address);
    setShippingAddress(bill.shipping_address);
    setCustomerPhone(bill.customer_phone || '');
    setPlaceOfSupplyState(bill.place_of_supply_state);
    setIsBillOfSupply(bill.is_bill_of_supply);

    // Populate products
    const loadedItems = billDetails.products || bill.billitems || [];
    if (loadedItems.length > 0) {
      setProducts(
        loadedItems.map((item, index) => ({
          serial: String(index + 1),
          name: item.product_name || item.name || '',
          hsn: item.hsn_sac || item.hsn || '',
          gst_rate: String(item.gst_rate ?? ''),
          quantity: String(item.quantity ?? ''),
          unit: item.unit || '',
          priceInclGst: String(item.price_incl_gst ?? item.unitprice ?? ''),
          discount: String(
            item.discount_percent ?? item.disc ?? item.discount ?? 0,
          ),
          product_id: item.product_id || '',
          itemTotalInclGst: String(
            item.item_total_incl_gst ?? item.item_total ?? '',
          ),
          itemGstAmount: String(item.item_gst_amount ?? ''),
          itemTotalExclGst: String(
            item.item_total_excl_gst ?? item.pregstprice ?? '',
          ),
        })),
      );
    }
  };

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const showSnackbar = (message, type = 'success') => {
    setSnackbar({visible: true, message, type});
  };

  const handleDateChange = newDate => {
    const nextFinancialYearStart = getFinancialYearStart(newDate);
    setDate(newDate);
    setFinancialYearStart(nextFinancialYearStart);
    refreshInvoiceNumber(billKind, nextFinancialYearStart);
  };

  const refreshInvoiceNumber = async (
    nextBillKind = billKind,
    nextFinancialYearStart = financialYearStart,
  ) => {
    const lastInvoiceNumber = await getLastInvoiceNumber(
      nextBillKind,
      nextFinancialYearStart,
    );
    const nextInvoiceNumber =
      extractInvoiceSequenceNumber(lastInvoiceNumber) + 1;
    setInvoiceNumber(formatInvoiceNumber(nextBillKind, nextInvoiceNumber));
  };

  const handleBillKindChange = nextBillKind => {
    setBillKind(nextBillKind);
    refreshInvoiceNumber(nextBillKind, financialYearStart);
  };

  const handleInvoiceNumberChange = value => {
    const normalized = value.replace(/\s+/g, '').replace(/[^A-Za-z0-9-]/g, '');
    setInvoiceNumber(normalizeInvoiceNumber(normalized, billKind));
  };

  const handleCustomerSelect = customer => {
    setSelectedCustomer(customer);
    setCustomerName(customer.customer_name);
    setCustomerGstin(customer.gstin || '');
    setBillingAddress(customer.billing_address);
    setShippingAddress(customer.shipping_address || '');
    setCustomerPhone(customer.phone || '');
  };

  const copyBillingToShipping = () => {
    setShippingAddress(billingAddress);
  };

  const handleProductSelect = (index, selectedProduct) => {
    const updatedProducts = [...products];
    updatedProducts[index].name = selectedProduct.product_name;
    updatedProducts[index].hsn = selectedProduct.hsn_sac;
    updatedProducts[index].gst_rate = selectedProduct.gst_rate.toString();
    updatedProducts[index].unit = selectedProduct.unit;
    updatedProducts[index].priceInclGst =
      selectedProduct.price_incl_gst.toString();
    updatedProducts[index].product_id = selectedProduct.id;
    setProducts(updatedProducts);
  };

  const handleProductFieldChange = (index, field, value) => {
    const updatedProducts = [...products];
    updatedProducts[index][field] = value;
    setProducts(updatedProducts);
  };

  const recalculateProductLine = index => {
    const product = products[index];
    const priceInclGst = parseFloat(product.priceInclGst) || 0;
    const gstRate = parseFloat(product.gst_rate) || 0;
    const quantity = parseFloat(product.quantity) || 0;
    const discount = parseFloat(product.discount) || 0;

    if (!priceInclGst || !quantity) {
      return;
    }

    // Calculate with discount
    const priceAfterDiscount = priceInclGst * (1 - discount / 100);
    const itemTotalInclGst = (priceAfterDiscount * quantity).toFixed(2);

    // Calculate tax using corrected formula
    const itemTotalExclGst = (
      parseFloat(itemTotalInclGst) /
      (1 + gstRate / 100)
    ).toFixed(2);
    const itemGstAmount = (
      parseFloat(itemTotalInclGst) - parseFloat(itemTotalExclGst)
    ).toFixed(2);

    const updatedProducts = [...products];
    updatedProducts[index].itemTotalInclGst = itemTotalInclGst;
    updatedProducts[index].itemTotalExclGst = itemTotalExclGst;
    updatedProducts[index].itemGstAmount = itemGstAmount;
    setProducts(updatedProducts);
  };

  const addProduct = () => {
    const newSerial = (products.length + 1).toString();
    const newProduct = createEmptyProduct(newSerial);
    setProducts([...products, newProduct]);
  };

  const removeProduct = index => {
    if (products.length === 1) {
      showSnackbar('At least one product is required', 'error');
      return;
    }
    setProducts(products.filter((_, i) => i !== index));
  };

  // ============================================================================
  // CALCULATIONS
  // ============================================================================

  useEffect(() => {
    calculateTotals();
  }, [products, placeOfSupplyState]);

  const calculateTotals = () => {
    let totExclGst = 0;
    let totGst = 0;
    let totInclGst = 0;
    let totCgst = 0;
    let totSgst = 0;
    let totIgst = 0;

    products.forEach(product => {
      const exclGst = parseFloat(product.itemTotalExclGst) || 0;
      const gstAmount = parseFloat(product.itemGstAmount) || 0;
      const inclGst = parseFloat(product.itemTotalInclGst) || 0;

      totExclGst += exclGst;
      totGst += gstAmount;
      totInclGst += inclGst;

      // Determine IGST vs CGST+SGST
      const isIgst = isInterStateSale(supplierState, placeOfSupplyState);
      const gstRate = parseFloat(product.gst_rate) || 0;

      if (isIgst) {
        totIgst += gstAmount;
      } else {
        totCgst += gstAmount / 2;
        totSgst += gstAmount / 2;
      }
    });

    setTotalExclGst(totExclGst.toFixed(2));
    setTotalGst(totGst.toFixed(2));
    setTotalInclGst(totInclGst.toFixed(2));
    setCgstTotal(totCgst.toFixed(2));
    setSgstTotal(totSgst.toFixed(2));
    setIgstTotal(totIgst.toFixed(2));

    // Check e-way bill requirement
    checkEWayBillAlert(totInclGst);
  };

  const checkEWayBillAlert = grandTotal => {
    if (!placeOfSupplyState) return;

    const isIgst = isInterStateSale(supplierState, placeOfSupplyState);
    const hsnCodes = products.map(p => p.hsn).filter(Boolean);

    const ewayRequired = checkEWayBillRequired(
      grandTotal,
      isIgst,
      hsnCodes,
      supplierState,
    );

    setShowEwayBillAlert(ewayRequired.required);
  };

  // ============================================================================
  // SAVE LOGIC
  // ============================================================================

  const validateForm = () => {
    const errors = [];

    if (!invoiceNumber.trim()) errors.push('Invoice number is required');
    if (!date.trim()) errors.push('Date is required');
    if (!customerName.trim()) errors.push('Customer name is required');
    if (billKind === 'B2B' && !customerGstin.trim()) {
      errors.push('GSTIN is required for B2B bills');
    } else if (billKind === 'B2B') {
      const normalizedGstin = customerGstin.replace(/\s+/g, '').toUpperCase();
      if (normalizedGstin.length !== 15) {
        errors.push('GSTIN must be exactly 15 characters for B2B bills');
      }
    }
    if (!billingAddress.trim()) errors.push('Billing address is required');
    if (!shippingAddress.trim()) errors.push('Shipping address is required');
    if (!placeOfSupplyState) errors.push('Place of supply state is required');
    if (products.length === 0) errors.push('At least one product is required');

    // Validate products
    products.forEach((product, index) => {
      if (!product.name.trim())
        errors.push(`Product ${index + 1}: Name is required`);
      if (!product.gst_rate)
        errors.push(`Product ${index + 1}: GST rate is required`);
      if (!product.quantity)
        errors.push(`Product ${index + 1}: Quantity is required`);
      if (!product.priceInclGst)
        errors.push(`Product ${index + 1}: Price is required`);
    });

    if (errors.length > 0) {
      Alert.alert('Validation Errors', errors.join('\n'));
      return false;
    }

    return true;
  };

  const saveInvoice = async () => {
    if (!validateForm()) return;

    try {
      setLoading(true);

      // Prepare invoice data
      const isIgst = isInterStateSale(supplierState, placeOfSupplyState);

      const customerResolution = await resolveOrCreateCustomerId({
        id: selectedCustomer?.id || null,
        customer_name: customerName,
        gstin: billKind === 'B2B' ? customerGstin || null : null,
        billing_address: billingAddress,
        billing_state_code:
          selectedCustomer?.billing_state_code || placeOfSupplyState || null,
        shipping_address: shippingAddress,
        shipping_state_code:
          selectedCustomer?.shipping_state_code || placeOfSupplyState || null,
        phone: customerPhone || null,
      });

      if (!customerResolution.success) {
        showSnackbar(
          customerResolution.error || 'Unable to resolve customer',
          'error',
        );
        return;
      }

      const billItems = products.map((product, index) => ({
        serial: (index + 1).toString(),
        product_id: product.product_id,
        product_name: product.name,
        hsn_sac: product.hsn,
        gst_rate: parseFloat(product.gst_rate),
        quantity: parseFloat(product.quantity),
        unit: product.unit,
        price_incl_gst: parseFloat(product.priceInclGst),
        discount_percent: parseFloat(product.discount) || 0,
        item_total_excl_gst: parseFloat(product.itemTotalExclGst),
        item_gst_amount: parseFloat(product.itemGstAmount),
        item_total_incl_gst: parseFloat(product.itemTotalInclGst),
      }));

      const invoice = {
        customer_id: customerResolution.customer_id,
        invoice_number: invoiceNumber,
        date: date,
        financial_year_start: financialYearStart,
        bill_kind: billKind,
        customer_name: customerName,
        customer_gstin: billKind === 'B2B' ? customerGstin || null : null,
        billing_address: billingAddress,
        billing_state_code:
          selectedCustomer?.billing_state_code || placeOfSupplyState || '',
        shipping_address: shippingAddress,
        shipping_state_code:
          selectedCustomer?.shipping_state_code || placeOfSupplyState || '',
        customer_phone: customerPhone || null,
        place_of_supply_state: placeOfSupplyState,
        is_igst: isIgst,
        is_bill_of_supply: isBillOfSupply,
        total_excl_gst: parseFloat(totalExclGst),
        total_gst: parseFloat(totalGst),
        total_incl_gst: parseFloat(totalInclGst),
        cgst_total: parseFloat(cgstTotal),
        sgst_total: parseFloat(sgstTotal),
        igst_total: parseFloat(igstTotal),
        billitems: billItems,
      };

      const result = await saveInvoiceToDbUpdated(invoice);

      if (result.success) {
        try {
          const supplier = await getSupplierConfig();
          const pdfResult = await generateInvoicePdfFromBill({
            bill: {
              ...invoice,
              id: result.bill_id,
              grand_total: invoice.total_incl_gst,
              total_excl_gst: invoice.total_excl_gst,
              cgst_total: invoice.cgst_total,
              sgst_total: invoice.sgst_total,
              igst_total: invoice.igst_total,
            },
            supplierConfig: supplier,
            billItems: billItems,
          });
          console.log('Invoice PDF saved to:', pdfResult.filePath);
        } catch (pdfError) {
          console.warn('Invoice PDF generation failed:', pdfError);
        }

        showSnackbar('Bill saved successfully', 'success');
        setTimeout(() => {
          navigation.replace('ViewOldBills');
          navigation.navigate('ViewBill', {billId: result.bill_id});
        }, 1500);
      } else {
        showSnackbar(result.error || 'Error saving bill', 'error');
      }
    } catch (error) {
      console.error('Error saving invoice:', error);
      showSnackbar('Error saving bill', 'error');
    } finally {
      setLoading(false);
    }
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  const productOptions = productsList.map(p => ({
    label: p.product_name,
    value: p.id,
    product: p,
  }));

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* E-way Bill Alert */}
        {showEwayBillAlert && (
          <Card style={styles.alertCard}>
            <Card.Content>
              <Text style={styles.alertText}>
                ⚠️ E-way bill may be required for this transaction
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Invoice Header */}
        <Card style={styles.headerCard}>
          <Card.Title title="Invoice Details" />
          <Card.Content>
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <Text style={styles.label}>Invoice Number *</Text>
                <TextInput
                  label="Invoice #"
                  value={invoiceNumber}
                  onChangeText={handleInvoiceNumberChange}
                  mode="outlined"
                  keyboardType="default"
                  style={styles.input}
                />
              </View>
              <View style={styles.column}>
                <Text style={styles.label}>Date *</Text>
                <TextInput
                  label="DD-MM-YYYY"
                  value={date}
                  onChangeText={handleDateChange}
                  mode="outlined"
                  style={styles.input}
                />
              </View>
            </View>
            <Text style={styles.helperText}>FY: {financialYearStart}</Text>
            <Text style={styles.label}>Bill Category</Text>
            <SegmentedButtons
              value={billKind}
              onValueChange={handleBillKindChange}
              buttons={BILL_KIND_OPTIONS}
              style={styles.segmentedButtons}
            />
            <Text style={styles.helperText}>
              {billKind} invoices use a separate invoice number series.
            </Text>
          </Card.Content>
        </Card>

        {/* Customer Selection */}
        <Card style={styles.card}>
          <Card.Title title="Customer Information" />
          <Card.Content>
            <Text style={styles.label}>Customer Name *</Text>
            <TextInput
              label="Customer Name"
              value={customerName}
              onChangeText={setCustomerName}
              mode="outlined"
              style={styles.input}
            />

            <Text style={styles.label}>
              GSTIN {billKind === 'B2B' ? '*' : '(Optional)'}
            </Text>
            <TextInput
              label="GSTIN"
              value={customerGstin}
              onChangeText={value =>
                setCustomerGstin(value.replace(/\s+/g, '').toUpperCase())
              }
              mode="outlined"
              maxLength={15}
              placeholder={
                billKind === 'B2B'
                  ? 'Required for B2B invoice'
                  : 'Leave empty for B2C'
              }
              style={styles.input}
            />

            <Text style={styles.label}>Billing Address *</Text>
            <TextInput
              label="Address"
              value={billingAddress}
              onChangeText={setBillingAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Button
              mode="outlined"
              onPress={copyBillingToShipping}
              style={styles.copyButton}>
              Copy to Shipping Address
            </Button>

            <Text style={styles.label}>Shipping Address *</Text>
            <TextInput
              label="Address"
              value={shippingAddress}
              onChangeText={setShippingAddress}
              mode="outlined"
              multiline
              numberOfLines={3}
              style={styles.input}
            />

            <Text style={styles.label}>Phone (Optional)</Text>
            <TextInput
              label="Phone"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              mode="outlined"
              keyboardType="phone-pad"
              maxLength={10}
              style={styles.input}
            />
          </Card.Content>
        </Card>

        {/* Location & Bill Type */}
        <Card style={styles.card}>
          <Card.Title title="Location & Bill Type" />
          <Card.Content>
            <Text style={styles.label}>Place of Supply State *</Text>
            <Dropdown
              data={stateOptions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select state"
              value={placeOfSupplyState}
              onChange={item => setPlaceOfSupplyState(item.value)}
              search
              style={styles.dropdown}
            />

            <View style={styles.checkboxRow}>
              <Checkbox
                status={isBillOfSupply ? 'checked' : 'unchecked'}
                onPress={() => setIsBillOfSupply(!isBillOfSupply)}
              />
              <Text style={styles.checkboxLabel}>
                Bill of Supply (Composition Scheme)
              </Text>
            </View>

            {isBillOfSupply && (
              <HelperText type="info">
                No GST charged for composition scheme businesses
              </HelperText>
            )}
          </Card.Content>
        </Card>

        {/* Products */}
        <Card style={styles.card}>
          <Card.Title title="Products/Items" />
          <Card.Content>
            {products.map((product, index) => (
              <Card key={index} style={styles.productCard}>
                <Card.Content>
                  <Text style={styles.productTitle}>Item {index + 1}</Text>

                  <Text style={styles.label}>Product *</Text>
                  <Dropdown
                    data={productOptions}
                    maxHeight={250}
                    labelField="label"
                    valueField="value"
                    placeholder="Select product"
                    value={product.product_id}
                    onChange={item => handleProductSelect(index, item.product)}
                    search
                    style={styles.dropdown}
                  />

                  <View style={styles.twoColumnRow}>
                    <View style={styles.column}>
                      <Text style={styles.label}>HSN/SAC</Text>
                      <TextInput
                        label="HSN"
                        value={product.hsn}
                        editable={false}
                        mode="outlined"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>GST Rate %</Text>
                      <TextInput
                        label="Rate"
                        value={product.gst_rate}
                        editable={false}
                        mode="outlined"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.twoColumnRow}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Unit</Text>
                      <TextInput
                        label="Unit"
                        value={product.unit}
                        editable={false}
                        mode="outlined"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Price (incl. GST) *</Text>
                      <TextInput
                        label="Price"
                        value={product.priceInclGst}
                        onChangeText={value => {
                          handleProductFieldChange(
                            index,
                            'priceInclGst',
                            value,
                          );
                          recalculateProductLine(index);
                        }}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <View style={styles.twoColumnRow}>
                    <View style={styles.column}>
                      <Text style={styles.label}>Quantity *</Text>
                      <TextInput
                        label="Qty"
                        value={product.quantity}
                        onChangeText={value => {
                          handleProductFieldChange(index, 'quantity', value);
                          recalculateProductLine(index);
                        }}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                      />
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.label}>Discount %</Text>
                      <TextInput
                        label="Discount"
                        value={product.discount}
                        onChangeText={value => {
                          handleProductFieldChange(index, 'discount', value);
                          recalculateProductLine(index);
                        }}
                        mode="outlined"
                        keyboardType="decimal-pad"
                        style={styles.input}
                      />
                    </View>
                  </View>

                  <Divider style={styles.divider} />

                  <View style={styles.twoColumnRow}>
                    <View style={styles.column}>
                      <Text style={styles.calculatedLabel}>Excl. GST</Text>
                      <Text style={styles.calculatedValue}>
                        ₹{product.itemTotalExclGst || '0.00'}
                      </Text>
                    </View>
                    <View style={styles.column}>
                      <Text style={styles.calculatedLabel}>GST</Text>
                      <Text style={styles.calculatedValue}>
                        ₹{product.itemGstAmount || '0.00'}
                      </Text>
                    </View>
                  </View>

                  <View style={styles.totalRow}>
                    <Text style={styles.totalLabel}>Incl. GST</Text>
                    <Text style={styles.totalValue}>
                      ₹{product.itemTotalInclGst || '0.00'}
                    </Text>
                  </View>

                  <Button
                    mode="outlined"
                    textColor={theme.colors.error}
                    onPress={() => removeProduct(index)}
                    style={styles.removeButton}>
                    Remove Item
                  </Button>
                </Card.Content>
              </Card>
            ))}

            <Button
              mode="outlined"
              icon="plus"
              onPress={addProduct}
              style={styles.addButton}>
              Add Item
            </Button>
          </Card.Content>
        </Card>

        {/* Tax Summary */}
        <Card style={styles.card}>
          <Card.Title title="Tax Summary" />
          <Card.Content>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total (Excl. GST)</Text>
              <Text style={styles.summaryValue}>
                {formatCurrency(totalExclGst)}
              </Text>
            </View>

            {isInterStateSale(supplierState, placeOfSupplyState) ? (
              <View style={styles.summaryRow}>
                <Text style={styles.summaryLabel}>IGST</Text>
                <Text style={styles.summaryValue}>
                  {formatCurrency(igstTotal)}
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>CGST (50%)</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(cgstTotal)}
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>SGST (50%)</Text>
                  <Text style={styles.summaryValue}>
                    {formatCurrency(sgstTotal)}
                  </Text>
                </View>
              </>
            )}

            <Divider style={styles.divider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(totalInclGst)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Save Button */}
        <Button
          mode="contained"
          onPress={saveInvoice}
          style={styles.saveButton}
          contentStyle={styles.saveButtonContent}>
          Generate Bill
        </Button>

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
      </ScrollView>
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
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  alertCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.errorContainer,
  },
  alertText: {
    color: theme.colors.error,
    fontWeight: '600',
    fontSize: 14,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onBackground,
    marginBottom: 8,
    marginTop: 12,
  },
  helperText: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    marginTop: 4,
  },
  segmentedButtons: {
    marginTop: 8,
  },
  input: {
    backgroundColor: theme.colors.background,
    marginBottom: 8,
  },
  dropdown: {
    borderWidth: 1,
    borderColor: theme.colors.outline,
    borderRadius: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 12,
    backgroundColor: theme.colors.background,
  },
  copyButton: {
    marginVertical: 12,
    borderColor: theme.colors.primary,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 12,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: theme.colors.onBackground,
  },
  productCard: {
    marginBottom: 16,
    backgroundColor: theme.colors.background,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.primary,
  },
  productTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginBottom: 12,
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 12,
  },
  column: {
    flex: 1,
  },
  divider: {
    marginVertical: 12,
    backgroundColor: theme.colors.outlineVariant,
  },
  calculatedLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
  },
  calculatedValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.primary,
    marginTop: 4,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  totalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  removeButton: {
    borderColor: theme.colors.error,
  },
  addButton: {
    marginTop: 12,
    borderColor: theme.colors.primary,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  summaryLabel: {
    fontSize: 14,
    color: theme.colors.onBackground,
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 4,
    marginTop: 12,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  grandTotalValue: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  saveButton: {
    marginHorizontal: 16,
    marginBottom: 32,
    paddingVertical: 8,
  },
  saveButtonContent: {
    height: 48,
  },
});

export default NewBill;
