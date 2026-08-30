// @ts-nocheck

import React from 'react';
import 'react-native-url-polyfill/auto';
import {createClient} from '@supabase/supabase-js';
import {EXPO_PUBLIC_SUPABASE_URL, EXPO_PUBLIC_ANON_KEY} from '@env';
import {
  normalizeBillKind,
  formatInvoiceNumber,
  extractInvoiceSequenceNumber,
  normalizeInvoiceNumber,
} from './invoiceNumber';

// Use the environment variables
const supabaseUrl = EXPO_PUBLIC_SUPABASE_URL;
const supabaseKey = EXPO_PUBLIC_ANON_KEY;
const SUPPLIER_SETUP_REQUIRED = 'Please complete Business Settings first.';
const APP_SINGLE_USER_ID = '00000000-0000-0000-0000-000000000001';

function resolveSupplierId(supplierConfig) {
  return (
    supplierConfig?.id ||
    supplierConfig?.supplier_id ||
    supplierConfig?.user_id ||
    null
  );
}

function normalizeFinancialYearStart(value, fallback = 2025) {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.trunc(value);
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    if (/^\d{4}-\d{4}$/.test(trimmed)) {
      const [startYear] = trimmed.split('-');
      return parseInt(startYear, 10);
    }

    if (/^\d{4}$/.test(trimmed)) {
      return parseInt(trimmed, 10);
    }
  }

  return fallback;
}

function normalizeInvoiceDate(dateValue) {
  if (!dateValue) {
    return null;
  }

  const raw = String(dateValue).trim();
  const normalized = raw.replace(/\//g, '-');

  if (/^\d{4}-\d{2}-\d{2}$/.test(normalized)) {
    const [yyyy, mm, dd] = normalized.split('-').map(Number);
    const dt = new Date(yyyy, mm - 1, dd);
    if (
      dt.getFullYear() === yyyy &&
      dt.getMonth() === mm - 1 &&
      dt.getDate() === dd
    ) {
      return normalized;
    }
    return null;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(normalized)) {
    const [dd, mm, yyyy] = normalized.split('-').map(Number);
    const dt = new Date(yyyy, mm - 1, dd);
    if (
      dt.getFullYear() === yyyy &&
      dt.getMonth() === mm - 1 &&
      dt.getDate() === dd
    ) {
      return `${String(yyyy).padStart(4, '0')}-${String(mm).padStart(
        2,
        '0',
      )}-${String(dd).padStart(2, '0')}`;
    }
    return null;
  }

  return null;
}

function normalizeGstin(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).replace(/\s+/g, '').toUpperCase();
  return normalized.length > 0 ? normalized : null;
}

function normalizePhone(value) {
  if (value === null || value === undefined) {
    return null;
  }

  const normalized = String(value).trim();
  return normalized.length > 0 ? normalized : null;
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function getLastInvoiceNumber(
  billKind = 'B2C',
  financialYearStart = null,
) {
  try {
    const supplierConfig = await getSupplierConfig();
    const supplierId = resolveSupplierId(supplierConfig);
    const normalizedBillKind = normalizeBillKind(billKind);

    let query = supabase
      .from('bill')
      .select('invoice_number')
      .limit(1)
      .order('date', {ascending: false})
      .order('created_at', {ascending: false});

    if (supplierId) {
      query = query.eq('supplier_id', supplierId);
    }

    if (financialYearStart !== null && financialYearStart !== undefined) {
      query = query.eq(
        'financial_year_start',
        normalizeFinancialYearStart(financialYearStart, 2025),
      );
    }

    const {data, error} = await query.eq('bill_kind', normalizedBillKind);

    if (error) {
      console.error('Error fetching invoice number:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0].invoice_number;
    }

    return null;
  } catch (error) {
    console.error('Error fetching invoice number:', error);
    return null;
  }
}

async function getBills() {
  try {
    const {data, error} = await supabase
      .from('bill')
      .select(
        'id, customer_name, grand_total, date, invoice_number, customer_gst, bill_kind',
      )
      .order('date', {ascending: false})
      .order('invoice_number', {ascending: false});

    if (error) {
      // console.error('Error fetching bills:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data.map(item => ({
        ...item,
        bill_kind: normalizeBillKind(
          item.bill_kind,
          item.customer_gst ? 'B2B' : 'B2C',
        ),
      }));
    }

    return null;
  } catch (error) {
    // console.error('Error fetching bills:', error);
    return null;
  }
}

async function getBill(id) {
  try {
    const {data, error} = await supabase
      .from('bill')
      .select(
        `
          *,
          billitems:billitems (product_id, product:products (product_name, gst_rate, unit, hsn_sac), quantity, pregstprice,unitprice, item_total, disc)
        `,
      )
      .eq('id', id);

    if (error) {
      console.error('Error fetching bill details:', error);
      return null;
    }

    if (data && data.length > 0) {
      const bill = data[0];
      const products = bill.billitems.map(item => ({
        product_name: item.product.product_name,
        hsn_sac: item.product.hsn_sac,
        gst_rate: item.product.gst_rate,
        quantity: item.quantity,
        unitprice: item.unitprice,
        unit: item.product.unit,
        disc: item.disc,
        item_total: item.pregstprice,
      }));

      return {bill, products};
    }

    return null;
  } catch (error) {
    console.error('Error fetching bill details:', error);
    return null;
  }
}

async function getProducts() {
  try {
    const {data, error} = await supabase
      .from('products')
      .select('*')
      .order('product_name', {ascending: true});

    if (error) {
      console.error('Error fetching products:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data;
    }

    return null;
  } catch (error) {
    console.error('Error fetching products:', error);
    return null;
  }
}

async function saveInvoiceToDb(invoice) {
  const normalizedDate = normalizeInvoiceDate(invoice.date);
  if (!normalizedDate) {
    return {error: 'Invalid invoice date. Use DD-MM-YYYY or YYYY-MM-DD.'};
  }

  const normalizedInvoiceNumber = normalizeInvoiceNumber(
    invoice.invoice_number,
    invoice.bill_kind || (invoice.customer_gst ? 'B2B' : 'B2C'),
  );

  bill_details = {
    invoice_number: normalizedInvoiceNumber,
    date: normalizedDate,
    customer_name: invoice.customer_name,
    billing_address: invoice.billing_address,
    shipping_address: invoice.shipping_address,
    customer_gst: invoice.customer_gst,
    customer_phone: invoice.customer_phone,
    total: parseFloat(invoice.total),
    cgst: parseFloat(invoice.cgst),
    sgst: parseFloat(invoice.sgst),
    igst: parseFloat(invoice.igst),
    grand_total: parseFloat(invoice.grand_total),
  };
  var bill_id;
  try {
    const {data, error} = await supabase
      .from('bill')
      .insert(bill_details)
      .select();

    bill_id = data[0].id;

    if (error) {
      console.error('Error saving invoice:', error);
      return {error: error.message};
    }
  } catch (error) {
    console.error('Error saving bill:', error);
    return {error: error.message};
  }

  try {
    const bill_items = invoice.products.map(product => {
      return {
        bill_id: bill_id,
        product_id: parseInt(product.product_id),
        quantity: parseInt(product.quantity),
        pregstprice: parseFloat(product.amount),
        item_total: parseFloat(product.item_total),
        gstunitprice: parseFloat(product.gst_rate),
        disc: parseFloat(product.disc),
        unitprice: parseFloat(product.rate),
      };
    });

    const {data, error} = await supabase
      .from('billitems')
      .insert(bill_items)
      .select();

    return {status: 'sucess', bill_id: bill_id};
  } catch (error) {
    console.error('Error saving invoice:', error);
    const {error_delete} = await supabase
      .from('bill')
      .delete()
      .eq('id', bill_id);
    return {status: 'error'};
  }
}

async function deleteInvoice(id) {
  try {
    const {error} = await supabase.from('bill').delete().eq('id', id);

    if (error) {
      console.error('Error deleting invoice:', error);
      return {error: error.message};
    }
    return {status: 'sucess'};
  } catch (error) {
    console.error('Error deleting invoice:', error);
    return {error: error.message};
  }
}

// ============================================================================
// NEW FUNCTIONS FOR GST-COMPLIANT SCHEMA
// ============================================================================

/**
 * Get supplier configuration
 * @returns Supplier config object or null
 */
async function getSupplierConfig() {
  try {
    const {data, error} = await supabase
      .from('supplier_config')
      .select('*')
      .eq('user_id', APP_SINGLE_USER_ID)
      .order('updated_at', {ascending: false})
      .limit(1);

    if (error) {
      console.error('Error fetching supplier config:', error);
      return null;
    }

    if (data && data.length > 0) {
      return data[0];
    }

    // No-auth fallback: load latest supplier config even if user_id is null or unused.
    const {data: fallbackData, error: fallbackError} = await supabase
      .from('supplier_config')
      .select('*')
      .order('updated_at', {ascending: false})
      .limit(1);

    if (fallbackError) {
      console.error('Error fetching supplier config:', fallbackError);
      return null;
    }

    return fallbackData && fallbackData.length > 0 ? fallbackData[0] : null;
  } catch (error) {
    console.error('Error fetching supplier config:', error);
    return null;
  }
}

/**
 * Save or update supplier configuration
 * @param config - Supplier config object
 * @returns { success: boolean, error?: string }
 */
async function saveSupplierConfig(config) {
  try {
    const configData = {
      legal_business_name: config.legal_business_name,
      business_address: config.business_address,
      state_code: config.state_code,
      pincode: config.pincode,
      gstin: config.gstin,
      phone: config.phone,
      email: config.email,
      updated_at: new Date().toISOString(),
    };

    const existingData = await getSupplierConfig();

    if (existingData) {
      // Update existing
      const {error} = await supabase
        .from('supplier_config')
        .update(configData)
        .eq('id', existingData.id)
        .select();

      if (error) {
        if (error.code === '23503') {
          return {
            success: false,
            error:
              'Database still links supplier_config.user_id to auth.users. Remove that foreign key for no-auth mode.',
          };
        }
        console.error('Error updating supplier config:', error);
        return {success: false, error: error.message};
      }
      return {success: true};
    } else {
      // Insert new (prefer no user_id in no-auth mode)
      const {error} = await supabase
        .from('supplier_config')
        .insert([configData])
        .select();

      if (
        error &&
        error.code === '23502' &&
        (error.message || '').includes('user_id')
      ) {
        const {error: retryError} = await supabase
          .from('supplier_config')
          .insert([{...configData, user_id: APP_SINGLE_USER_ID}])
          .select();

        if (retryError) {
          if (retryError.code === '23503') {
            return {
              success: false,
              error:
                'Database still links supplier_config.user_id to auth.users. Remove that foreign key for no-auth mode.',
            };
          }
          console.error('Error saving supplier config:', retryError);
          return {success: false, error: retryError.message};
        }

        return {success: true};
      }

      if (error) {
        if (error.code === '23503') {
          return {
            success: false,
            error:
              'Database still links supplier_config.user_id to auth.users. Remove that foreign key for no-auth mode.',
          };
        }
        console.error('Error saving supplier config:', error);
        return {success: false, error: error.message};
      }
      return {success: true};
    }
  } catch (error) {
    console.error('Error saving supplier config:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Check if invoice number is available for current financial year
 * @param invoiceNumber - Invoice number to check
 * @param financialYearStart - FY (e.g., 2025 for FY 2025-26)
 * @returns boolean - true if available, false if already used
 */
async function isInvoiceNumberAvailable(
  invoiceNumber,
  financialYearStart = 2025,
  billKind = 'B2C',
) {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return true;
    }

    const supplierId = resolveSupplierId(supplierConfig);
    const fyStart = normalizeFinancialYearStart(financialYearStart, 2025);

    if (!supplierId) {
      console.error(
        'Error checking invoice number: supplier ID missing in supplier config',
      );
      return false;
    }

    const normalizedInvoiceNumber = normalizeInvoiceNumber(
      invoiceNumber,
      billKind,
    );
    const query = supabase
      .from('bill')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('invoice_number', normalizedInvoiceNumber)
      .eq('financial_year_start', fyStart)
      .eq('bill_kind', normalizeBillKind(billKind))
      .limit(1);

    const {data, error} = await query;

    if (error) {
      console.error('Error checking invoice number:', error);
      return false;
    }

    // If data is empty, invoice number is available
    return data.length === 0;
  } catch (error) {
    console.error('Error checking invoice number:', error);
    return false;
  }
}

/**
 * Updated getProducts() to return price_incl_gst instead of unitprice
 */
async function getProductsUpdated() {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return [];
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return [];
    }

    const {data, error} = await supabase
      .from('products')
      .select('*')
      .eq('supplier_id', supplierId)
      .is('deleted_at', null)
      .order('product_name', {ascending: true});

    if (error) {
      console.error('Error fetching products:', error);
      return [];
    }

    if (data && data.length > 0) {
      return data.map(item => ({
        ...item,
        price_incl_gst: item.unitprice ?? 0,
        unitprice: item.unitprice ?? 0,
      }));
    }

    return [];
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}

/**
 * Updated getBill() to use new billitems structure with calculated fields
 */
async function getBillUpdated(id) {
  try {
    const {data, error} = await supabase
      .from('bill')
      .select(
        `
          *,
          billitems:billitems (
            id,
            product_id,
            product_name,
            hsn_sac,
            gst_rate,
            quantity,
            unit,
            unitprice,
            disc,
            pregstprice,
            item_total
          )
        `,
      )
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching bill details:', error);
      return null;
    }

    if (data) {
      const normalizedBill = {
        ...data,
        customer_gstin: data.customer_gst || '',
        bill_kind: normalizeBillKind(
          data.bill_kind,
          data.customer_gst ? 'B2B' : 'B2C',
        ),
      };

      const products = (data.billitems || []).map(item => ({
        id: item.id,
        product_id: item.product_id,
        product_name: item.product_name,
        hsn_sac: item.hsn_sac,
        gst_rate: item.gst_rate,
        quantity: item.quantity,
        unit: item.unit,
        price_incl_gst: item.unitprice ?? 0,
        unitprice: item.unitprice ?? 0,
        disc: item.disc,
        item_total_incl_gst: item.item_total ?? 0,
        item_total: item.item_total ?? 0,
        item_gst_amount: (
          Number(item.item_total ?? 0) - Number(item.pregstprice ?? 0)
        ).toFixed(2),
        item_total_excl_gst: item.pregstprice ?? 0,
        pregstprice: item.pregstprice ?? 0,
      }));

      return {bill: normalizedBill, products};
    }

    return null;
  } catch (error) {
    console.error('Error fetching bill details:', error);
    return null;
  }
}

/**
 * Get all customers for current supplier
 */
async function getCustomers() {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return [];
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return [];
    }

    const {data, error} = await supabase
      .from('customer_master')
      .select('*')
      .eq('supplier_id', supplierId)
      .order('customer_name', {ascending: true});

    if (error) {
      console.error('Error fetching customers:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching customers:', error);
    return [];
  }
}

/**
 * Save a new customer
 * @param customer - Customer object
 * @returns { success: boolean, error?: string }
 */
async function saveCustomer(customer) {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return {success: false, error: SUPPLIER_SETUP_REQUIRED};
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return {
        success: false,
        error: 'Supplier ID is missing in Business Settings.',
      };
    }

    const normalizedGstin = normalizeGstin(customer.gstin);
    const normalizedPhone = normalizePhone(customer.phone);

    if (normalizedGstin && normalizedGstin.length > 15) {
      return {
        success: false,
        error: 'GSTIN cannot exceed 15 characters.',
      };
    }

    const customerData = {
      supplier_id: supplierId,
      customer_name: customer.customer_name,
      gstin: normalizedGstin,
      billing_address: customer.billing_address,
      billing_state_code: customer.billing_state_code,
      billing_pincode: customer.billing_pincode,
      shipping_address: customer.shipping_address || null,
      shipping_state_code: customer.shipping_state_code || null,
      shipping_pincode: customer.shipping_pincode || null,
      phone: normalizedPhone,
      email: customer.email || null,
    };

    const {data, error} = await supabase
      .from('customer_master')
      .insert([customerData])
      .select();

    if (error) {
      console.error('Error saving customer:', error);
      return {success: false, error: error.message};
    }

    return {success: true, customer_id: data?.[0]?.id || null};
  } catch (error) {
    console.error('Error saving customer:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Resolve an existing customer ID or create a new customer and return its ID.
 * This allows invoice creation without selecting from a customer dropdown.
 */
async function resolveOrCreateCustomerId(customer) {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return {success: false, error: SUPPLIER_SETUP_REQUIRED};
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return {
        success: false,
        error: 'Supplier ID is missing in Business Settings.',
      };
    }

    if (customer?.id) {
      return {success: true, customer_id: customer.id};
    }

    const customerName = (customer?.customer_name || '').trim();
    const billingAddress = (customer?.billing_address || '').trim();
    if (!customerName || !billingAddress) {
      return {
        success: false,
        error: 'Customer name and billing address are required.',
      };
    }

    const normalizedGstin = normalizeGstin(customer.gstin);

    // Prefer GSTIN match when present, otherwise use name + billing address.
    if (normalizedGstin) {
      const {data: byGstin, error: byGstinError} = await supabase
        .from('customer_master')
        .select('id')
        .eq('supplier_id', supplierId)
        .eq('gstin', normalizedGstin)
        .limit(1);

      if (byGstinError) {
        console.error('Error finding customer by GSTIN:', byGstinError);
      }

      if (byGstin && byGstin.length > 0) {
        return {success: true, customer_id: byGstin[0].id};
      }
    }

    const {data: byNameAddress, error: byNameAddressError} = await supabase
      .from('customer_master')
      .select('id')
      .eq('supplier_id', supplierId)
      .eq('customer_name', customerName)
      .eq('billing_address', billingAddress)
      .limit(1);

    if (byNameAddressError) {
      console.error(
        'Error finding customer by name/address:',
        byNameAddressError,
      );
    }

    if (byNameAddress && byNameAddress.length > 0) {
      return {success: true, customer_id: byNameAddress[0].id};
    }

    const saveResult = await saveCustomer({
      customer_name: customerName,
      gstin: normalizedGstin,
      billing_address: billingAddress,
      billing_state_code: customer.billing_state_code || null,
      billing_pincode: customer.billing_pincode || null,
      shipping_address: customer.shipping_address || null,
      shipping_state_code: customer.shipping_state_code || null,
      shipping_pincode: customer.shipping_pincode || null,
      phone: normalizePhone(customer.phone),
      email: customer.email || null,
    });

    if (!saveResult.success || !saveResult.customer_id) {
      return {
        success: false,
        error: saveResult.error || 'Unable to create customer',
      };
    }

    return {success: true, customer_id: saveResult.customer_id};
  } catch (error) {
    console.error('Error resolving customer ID:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Update an existing customer
 * @param customerId - Customer ID
 * @param customer - Updated customer object
 * @returns { success: boolean, error?: string }
 */
async function updateCustomer(customerId, customer) {
  try {
    const normalizedGstin = normalizeGstin(customer.gstin);
    const normalizedPhone = normalizePhone(customer.phone);

    if (normalizedGstin && normalizedGstin.length > 15) {
      return {
        success: false,
        error: 'GSTIN cannot exceed 15 characters.',
      };
    }

    const customerData = {
      customer_name: customer.customer_name,
      gstin: normalizedGstin,
      billing_address: customer.billing_address,
      billing_state_code: customer.billing_state_code,
      billing_pincode: customer.billing_pincode,
      shipping_address: customer.shipping_address || null,
      shipping_state_code: customer.shipping_state_code || null,
      shipping_pincode: customer.shipping_pincode || null,
      phone: normalizedPhone,
      email: customer.email || null,
      updated_at: new Date().toISOString(),
    };

    const {error} = await supabase
      .from('customer_master')
      .update(customerData)
      .eq('id', customerId);

    if (error) {
      console.error('Error updating customer:', error);
      return {success: false, error: error.message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error updating customer:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Delete a customer
 * @param customerId - Customer ID
 * @returns { success: boolean, error?: string }
 */
async function deleteCustomer(customerId) {
  try {
    const {error} = await supabase
      .from('customer_master')
      .delete()
      .eq('id', customerId);

    if (error) {
      console.error('Error deleting customer:', error);
      return {success: false, error: error.message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error deleting customer:', error);
    return {success: false, error: error.message};
  }
}

// ============================================================================
// PRODUCT MANAGEMENT FUNCTIONS
// ============================================================================

/**
 * Save a new product
 * @param product - Product object
 * @returns { success: boolean, error?: string }
 */
async function saveProduct(product) {
  try {
    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return {success: false, error: SUPPLIER_SETUP_REQUIRED};
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return {
        success: false,
        error: 'Supplier ID is missing in Business Settings.',
      };
    }

    const productData = {
      supplier_id: supplierId,
      product_name: product.product_name,
      hsn_sac: product.hsn_sac,
      gst_rate: product.gst_rate,
      unit: product.unit,
      unitprice: product.unitprice ?? product.price_incl_gst ?? 0,
    };

    const {data, error} = await supabase
      .from('products')
      .insert([productData])
      .select();

    if (error) {
      console.error('Error saving product:', error);
      return {success: false, error: error.message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error saving product:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Update an existing product
 * @param productId - Product ID
 * @param product - Updated product object
 * @returns { success: boolean, error?: string }
 */
async function updateProduct(productId, product) {
  try {
    const productData = {
      product_name: product.product_name,
      hsn_sac: product.hsn_sac,
      gst_rate: product.gst_rate,
      unit: product.unit,
      unitprice: product.unitprice ?? product.price_incl_gst ?? 0,
      updated_at: new Date().toISOString(),
    };

    const {error} = await supabase
      .from('products')
      .update(productData)
      .eq('id', productId);

    if (error) {
      console.error('Error updating product:', error);
      return {success: false, error: error.message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error updating product:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Soft delete a product (set deleted_at)
 * @param productId - Product ID
 * @returns { success: boolean, error?: string }
 */
async function deleteProduct(productId) {
  try {
    const {error} = await supabase
      .from('products')
      .update({deleted_at: new Date().toISOString()})
      .eq('id', productId);

    if (error) {
      console.error('Error deleting product:', error);
      return {success: false, error: error.message};
    }

    return {success: true};
  } catch (error) {
    console.error('Error deleting product:', error);
    return {success: false, error: error.message};
  }
}

/**
 * Updated saveInvoiceToDb() with GST-compliant fields
 * @param invoice - Invoice object with place_of_supply_state, is_igst, and financial_year_start
 */
async function saveInvoiceToDbUpdated(invoice) {
  try {
    const toNumber = value => parseFloat(value || 0);
    const normalizedDate = normalizeInvoiceDate(invoice.date);
    const normalizedBillKind = normalizeBillKind(
      invoice.bill_kind,
      invoice.customer_gst || invoice.customer_gstin ? 'B2B' : 'B2C',
    );
    const normalizedCustomerGst = normalizeGstin(
      invoice.customer_gst || invoice.customer_gstin,
    );
    const normalizedCustomerPhone = normalizePhone(invoice.customer_phone);
    const fyStart = normalizeFinancialYearStart(
      invoice.financial_year_start,
      2025,
    );

    if (!normalizedDate) {
      return {
        success: false,
        error: 'Invalid invoice date. Use DD-MM-YYYY or YYYY-MM-DD.',
      };
    }

    const supplierConfig = await getSupplierConfig();
    if (!supplierConfig) {
      return {success: false, error: SUPPLIER_SETUP_REQUIRED};
    }

    const supplierId = resolveSupplierId(supplierConfig);
    if (!supplierId) {
      return {
        success: false,
        error: 'Supplier ID is missing in Business Settings.',
      };
    }

    if (!invoice.customer_id) {
      return {
        success: false,
        error: 'Customer information is required before saving.',
      };
    }

    if (normalizedBillKind === 'B2B') {
      if (!normalizedCustomerGst || normalizedCustomerGst.length !== 15) {
        return {
          success: false,
          error: 'GSTIN must be exactly 15 characters for B2B bills.',
        };
      }
    }

    if (normalizedCustomerGst && normalizedCustomerGst.length > 15) {
      return {
        success: false,
        error: 'GSTIN cannot exceed 15 characters.',
      };
    }

    // Verify invoice number is unique for this FY
    const isAvailable = await isInvoiceNumberAvailable(
      invoice.invoice_number,
      fyStart,
      normalizedBillKind,
    );
    if (!isAvailable) {
      return {
        success: false,
        error: `Invoice number ${invoice.invoice_number} already exists for FY ${fyStart}`,
      };
    }

    const normalizedInvoiceNumber = normalizeInvoiceNumber(
      invoice.invoice_number,
      normalizedBillKind,
    );

    const billDetails = {
      supplier_id: supplierId,
      customer_id: invoice.customer_id,
      invoice_number: normalizedInvoiceNumber,
      date: normalizedDate,
      customer_name: invoice.customer_name,
      billing_address: invoice.billing_address,
      shipping_address: invoice.shipping_address || null,
      customer_gst: normalizedCustomerGst,
      customer_phone: normalizedCustomerPhone,
      bill_kind: normalizedBillKind,
      total: toNumber(invoice.total_excl_gst ?? invoice.total),
      cgst: toNumber(invoice.cgst_total ?? invoice.cgst),
      sgst: toNumber(invoice.sgst_total ?? invoice.sgst),
      igst: toNumber(invoice.igst_total ?? invoice.igst),
      grand_total: toNumber(invoice.total_incl_gst ?? invoice.grand_total),
      place_of_supply_state: invoice.place_of_supply_state,
      is_igst: invoice.is_igst || false,
      is_bill_of_supply: invoice.is_bill_of_supply || false,
      financial_year_start: fyStart,
    };

    const {data: billData, error: billError} = await supabase
      .from('bill')
      .insert([billDetails])
      .select();

    if (billError) {
      console.error('Error saving bill:', billError);
      return {success: false, error: billError.message};
    }

    const billId = billData[0].id;

    // Save bill items
    const sourceItems = invoice.billitems || invoice.products || [];
    const billItems = sourceItems.map(product => ({
      bill_id: billId,
      product_id: product.product_id,
      product_name: product.product_name || product.name,
      hsn_sac: product.hsn_sac || product.hsn,
      gst_rate: toNumber(product.gst_rate ?? product.gst),
      quantity: toNumber(product.quantity),
      unit: product.unit,
      unitprice: toNumber(
        product.unitprice ?? product.price_incl_gst ?? product.rate,
      ),
      disc: toNumber(
        product.discount_percent ?? product.disc ?? product.discount,
      ),
      item_total: toNumber(
        product.item_total ??
          product.item_total_incl_gst ??
          product.itemTotalInclGst,
      ),
      pregstprice: toNumber(
        product.pregstprice ??
          product.item_total_excl_gst ??
          product.itemTotalExclGst,
      ),
    }));

    const {error: itemsError} = await supabase
      .from('billitems')
      .insert(billItems)
      .select();

    if (itemsError) {
      console.error('Error saving bill items:', itemsError);
      // Delete the bill if items insertion fails
      await supabase.from('bill').delete().eq('id', billId);
      return {success: false, error: itemsError.message};
    }

    return {success: true, bill_id: billId};
  } catch (error) {
    console.error('Error saving invoice:', error);
    return {success: false, error: error.message};
  }
}

export {
  // Original functions (kept for backward compatibility)
  getLastInvoiceNumber,
  getBills,
  getBill,
  getProducts,
  saveInvoiceToDb,
  deleteInvoice,
  // New functions (GST-compliant schema)
  getSupplierConfig,
  saveSupplierConfig,
  isInvoiceNumberAvailable,
  getProductsUpdated,
  getBillUpdated,
  saveInvoiceToDbUpdated,
  // Customer management functions
  getCustomers,
  saveCustomer,
  resolveOrCreateCustomerId,
  updateCustomer,
  deleteCustomer,
  // Product management functions
  saveProduct,
  updateProduct,
  deleteProduct,
};
export default supabase;
