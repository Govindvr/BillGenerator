// @ts-nocheck

import React, {useEffect, useState} from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  View,
  Alert,
  Share,
} from 'react-native';
import RNFS from 'react-native-fs';
import {Text, Card, Button, Divider, Chip} from 'react-native-paper';
import theme from '../config/theme';
import {getBillUpdated, getSupplierConfig} from '../config/supabaseClient';
import {formatCurrency, getStateName} from '../config/gstCalculations';
import {
  generateInvoicePdfFromBill,
  getSavedInvoicePdfPath,
  openSavedInvoicePdf,
} from '../config/invoicePdf';

function ViewBill({route, navigation}) {
  const [bill, setBill] = useState(null);
  const [billItems, setBillItems] = useState([]);
  const [supplierConfig, setSupplierConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    const fetchBillDetails = async () => {
      try {
        setLoading(true);
        const {billId} = route.params;

        // Fetch bill details using new function
        const billDetails = await getBillUpdated(billId);
        if (billDetails) {
          setBill(billDetails.bill);
          setBillItems(
            billDetails.products || billDetails.bill.billitems || [],
          );
        }

        // Fetch supplier config
        const supplier = await getSupplierConfig();
        if (supplier) {
          setSupplierConfig(supplier);
        }
      } catch (error) {
        console.error('Error fetching bill:', error);
        Alert.alert('Error', 'Failed to load bill details');
      } finally {
        setLoading(false);
      }
    };

    fetchBillDetails();
  }, [route.params]);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </SafeAreaView>
    );
  }

  if (!bill) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.errorText}>Bill not found</Text>
      </SafeAreaView>
    );
  }

  const billType = bill.is_bill_of_supply ? 'BILL OF SUPPLY' : 'TAX INVOICE';
  const placeOfSupplyStateName = getStateName(bill.place_of_supply_state);
  const supplierStateName = supplierConfig
    ? getStateName(supplierConfig.state_code)
    : 'N/A';
  const totalExclGst = bill.total_excl_gst ?? bill.total ?? 0;
  const cgstTotal = bill.cgst_total ?? bill.cgst ?? 0;
  const sgstTotal = bill.sgst_total ?? bill.sgst ?? 0;
  const igstTotal = bill.igst_total ?? bill.igst ?? 0;
  const totalInclGst = bill.total_incl_gst ?? bill.grand_total ?? 0;
  const isIgst =
    typeof bill.is_igst === 'boolean' ? bill.is_igst : Number(igstTotal) > 0;

  const handleExport = async () => {
    if (exporting) {
      return;
    }

    setExporting(true);

    try {
      let filePath = await getSavedInvoicePdfPath(bill.invoice_number);

      if (!filePath) {
        const pdfResult = await generateInvoicePdfFromBill({
          bill,
          supplierConfig,
          billItems,
        });
        filePath = pdfResult.filePath;
      } else {
        const fileExists = await RNFS.exists(filePath);
        if (!fileExists) {
          const pdfResult = await generateInvoicePdfFromBill({
            bill,
            supplierConfig,
            billItems,
          });
          filePath = pdfResult.filePath;
        }
      }

      await openSavedInvoicePdf(filePath);
    } catch (error) {
      console.error('Error exporting bill:', error);
      Alert.alert('Export failed', 'Unable to export invoice right now.');
    } finally {
      setExporting(false);
    }
  };

  const handleBillThisCustomer = () => {
    navigation.navigate('NewBill', {billId: bill.id, repeatCustomer: true});
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {/* Bill Type Badge */}
        <View style={styles.headerRow}>
          <Text style={styles.billNumber}>Invoice #{bill.invoice_number}</Text>
          <Chip
            label={billType}
            style={{
              backgroundColor: bill.is_bill_of_supply
                ? theme.colors.warningContainer
                : theme.colors.primaryContainer,
            }}
            textStyle={{
              color: bill.is_bill_of_supply
                ? theme.colors.onWarningContainer
                : theme.colors.onPrimaryContainer,
              fontWeight: '600',
            }}
          />
        </View>

        {/* Supplier Information */}
        {supplierConfig && (
          <Card style={styles.card}>
            <Card.Title title="Supplier Details" />
            <Card.Content>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Business Name</Text>
                <Text style={styles.detailValue}>
                  {supplierConfig.legal_business_name}
                </Text>
              </View>
              <Divider />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>GSTIN</Text>
                <Text style={styles.detailValue}>{supplierConfig.gstin}</Text>
              </View>
              <Divider />

              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Address</Text>
                <Text style={styles.detailValue}>
                  {supplierConfig.business_address}, {supplierStateName}{' '}
                  {supplierConfig.pincode}
                </Text>
              </View>
              {supplierConfig.phone && (
                <>
                  <Divider />
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Phone</Text>
                    <Text style={styles.detailValue}>
                      {supplierConfig.phone}
                    </Text>
                  </View>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Bill Header Information */}
        <Card style={styles.card}>
          <Card.Title title="Bill Information" />
          <Card.Content>
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <Text style={styles.detailLabel}>Date</Text>
                <Text style={styles.detailValue}>{bill.date}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.detailLabel}>Financial Year</Text>
                <Text style={styles.detailValue}>
                  {bill.financial_year_start}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Customer Information */}
        <Card style={styles.card}>
          <Card.Title title="Customer Details" />
          <Card.Content>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Customer Name</Text>
              <Text style={styles.detailValue}>{bill.customer_name}</Text>
            </View>
            <Divider />

            {bill.customer_gstin && (
              <>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>GSTIN</Text>
                  <Text style={styles.detailValue}>{bill.customer_gstin}</Text>
                </View>
                <Divider />
              </>
            )}

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Billing Address</Text>
              <Text style={styles.detailValue}>{bill.billing_address}</Text>
            </View>
            <Divider />

            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipping Address</Text>
              <Text style={styles.detailValue}>{bill.shipping_address}</Text>
            </View>

            {bill.customer_phone && (
              <>
                <Divider />
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Phone</Text>
                  <Text style={styles.detailValue}>{bill.customer_phone}</Text>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Location Information */}
        <Card style={styles.card}>
          <Card.Title title="Location Information" />
          <Card.Content>
            <View style={styles.twoColumnRow}>
              <View style={styles.column}>
                <Text style={styles.detailLabel}>Place of Supply</Text>
                <Text style={styles.detailValue}>{placeOfSupplyStateName}</Text>
              </View>
              <View style={styles.column}>
                <Text style={styles.detailLabel}>Tax Type</Text>
                <Text style={styles.detailValue}>
                  {isIgst ? 'IGST' : 'CGST + SGST'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Line Items */}
        <Card style={styles.card}>
          <Card.Title title="Items" />
          <Card.Content>
            {billItems.map((item, index) => (
              <View key={index}>
                <View style={styles.itemHeader}>
                  <Text style={styles.itemName}>{item.product_name}</Text>
                  <Text style={styles.itemPrice}>
                    {formatCurrency(
                      item.item_total_incl_gst ?? item.item_total ?? 0,
                    )}
                  </Text>
                </View>

                <View style={styles.itemDetails}>
                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>HSN: {item.hsn_sac}</Text>
                    <Text style={styles.itemLabel}>GST: {item.gst_rate}%</Text>
                  </View>

                  <View style={styles.itemRow}>
                    <Text style={styles.itemLabel}>
                      Qty: {item.quantity} {item.unit}
                    </Text>
                    <Text style={styles.itemLabel}>
                      Price:{' '}
                      {formatCurrency(
                        item.price_incl_gst ?? item.unitprice ?? 0,
                      )}
                    </Text>
                  </View>

                  {(item.discount_percent ?? item.disc ?? 0) > 0 && (
                    <View style={styles.itemRow}>
                      <Text style={styles.discountLabel}>
                        Discount: {item.discount_percent ?? item.disc}%
                      </Text>
                    </View>
                  )}

                  <Divider style={styles.itemDivider} />

                  <View style={styles.itemBreakdown}>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>
                        Amount (Excl. GST)
                      </Text>
                      <Text style={styles.breakdownValue}>
                        {formatCurrency(
                          item.item_total_excl_gst ?? item.pregstprice ?? 0,
                        )}
                      </Text>
                    </View>
                    <View style={styles.breakdownRow}>
                      <Text style={styles.breakdownLabel}>GST Amount</Text>
                      <Text style={styles.breakdownValue}>
                        {formatCurrency(item.item_gst_amount ?? 0)}
                      </Text>
                    </View>
                  </View>
                </View>

                {index < billItems.length - 1 && (
                  <Divider style={styles.itemSeparator} />
                )}
              </View>
            ))}
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

            {isIgst ? (
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

            <Divider style={styles.summaryDivider} />

            <View style={styles.grandTotalRow}>
              <Text style={styles.grandTotalLabel}>GRAND TOTAL</Text>
              <Text style={styles.grandTotalValue}>
                {formatCurrency(totalInclGst)}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          {/* <Button
            mode="text"
            onPress={handleBillThisCustomer}
            compact
            labelStyle={styles.smallActionLabel}
            style={styles.smallActionButton}>
            Bill this customer
          </Button> */}
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={styles.button}>
            Back
          </Button>
          <Button
            mode="contained"
            onPress={handleExport}
            style={styles.button}
            disabled={exporting}
            loading={exporting}>
            {exporting ? 'Generating...' : 'Generate Invoice'}
          </Button>
        </View>
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
  errorText: {
    fontSize: 16,
    color: theme.colors.error,
    textAlign: 'center',
    marginTop: 32,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  billNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.primary,
  },
  card: {
    marginBottom: 16,
    backgroundColor: theme.colors.surface,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: 8,
  },
  detailLabel: {
    fontSize: 13,
    color: theme.colors.onSurfaceVariant,
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    color: theme.colors.onBackground,
    fontWeight: '600',
    flex: 1.5,
    textAlign: 'right',
  },
  twoColumnRow: {
    flexDirection: 'row',
    gap: 16,
  },
  column: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outlineVariant,
  },
  itemName: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.primary,
    flex: 1,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '700',
    color: theme.colors.onBackground,
  },
  itemDetails: {
    backgroundColor: theme.colors.background,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 4,
    marginBottom: 12,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  itemLabel: {
    fontSize: 12,
    color: theme.colors.onSurfaceVariant,
  },
  discountLabel: {
    fontSize: 12,
    color: theme.colors.warning,
    fontWeight: '600',
  },
  itemDivider: {
    marginVertical: 8,
    backgroundColor: theme.colors.outlineVariant,
  },
  itemBreakdown: {
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 3,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  breakdownLabel: {
    fontSize: 12,
    color: theme.colors.onPrimaryContainer,
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: '600',
    color: theme.colors.onPrimaryContainer,
  },
  itemSeparator: {
    marginVertical: 12,
    backgroundColor: theme.colors.outlineVariant,
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
  summaryDivider: {
    marginVertical: 12,
    backgroundColor: theme.colors.outlineVariant,
    height: 2,
  },
  grandTotalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: theme.colors.primaryContainer,
    paddingHorizontal: 12,
    paddingVertical: 14,
    borderRadius: 6,
    marginTop: 8,
  },
  grandTotalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  grandTotalValue: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.onPrimaryContainer,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginHorizontal: 16,
    marginBottom: 32,
    alignItems: 'center',
  },
  button: {
    flex: 1,
    marginHorizontal: 0,
  },
  smallActionButton: {
    marginHorizontal: 0,
    minWidth: 0,
  },
  smallActionLabel: {
    fontSize: 12,
  },
});

export default ViewBill;
