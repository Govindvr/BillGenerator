// GST Tax Calculation Functions
// CORRECTED FORMULA: Backward calculation from GST-inclusive price
// Addresses the ÷200 bug in original code

interface LineItemTax {
  preTaxAmount: number;
  taxAmount: number;
  cgstAmount: number;
  sgstAmount: number;
  igstAmount: number;
}

interface InvoiceTotals {
  totalExclGst: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalInclGst: number;
}

interface LineItem {
  price_incl_gst: number;
  gst_rate: number;
  quantity: number;
  disc?: number; // Discount percentage
}

/**
 * Calculate tax breakdown for a single line item
 * @param priceInclGst - Price including GST (what customer pays)
 * @param gstRate - GST rate (0, 5, 12, 18, or 28)
 * @param isInterState - Whether this is an inter-state supply (IGST vs CGST+SGST)
 * @returns { preTaxAmount, taxAmount, cgstAmount, sgstAmount, igstAmount }
 *
 * FORMULA:
 * preTaxAmount = priceInclGst / (1 + gstRate/100)
 * taxAmount = priceInclGst - preTaxAmount
 * If intra-state: cgst = sgst = taxAmount / 2; igst = 0
 * If inter-state: igst = taxAmount; cgst = sgst = 0
 *
 * EXAMPLE (₹100, 18% GST, intra-state):
 * preTaxAmount = 100 / 1.18 = ₹84.75
 * taxAmount = 100 - 84.75 = ₹15.25
 * cgst = sgst = 15.25 / 2 = ₹7.63 each
 * total = 84.75 + 7.63 + 7.63 = ₹100 ✓
 */
export function calculateLineItemTax(
  priceInclGst: number,
  gstRate: number,
  isInterState: boolean,
): LineItemTax {
  if (priceInclGst === 0 || gstRate === 0) {
    return {
      preTaxAmount: priceInclGst,
      taxAmount: 0,
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: 0,
    };
  }

  // Calculate pre-tax amount by working backward from inclusive price
  const multiplier = 1 + gstRate / 100;
  const preTaxAmount = priceInclGst / multiplier;
  const taxAmount = priceInclGst - preTaxAmount;

  if (isInterState) {
    // Inter-state supply: All tax as IGST
    return {
      preTaxAmount: parseFloat(preTaxAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      cgstAmount: 0,
      sgstAmount: 0,
      igstAmount: parseFloat(taxAmount.toFixed(2)),
    };
  } else {
    // Intra-state supply: Split tax as CGST + SGST (50-50)
    const cgstAmount = taxAmount / 2;
    const sgstAmount = taxAmount / 2;
    return {
      preTaxAmount: parseFloat(preTaxAmount.toFixed(2)),
      taxAmount: parseFloat(taxAmount.toFixed(2)),
      cgstAmount: parseFloat(cgstAmount.toFixed(2)),
      sgstAmount: parseFloat(sgstAmount.toFixed(2)),
      igstAmount: 0,
    };
  }
}

/**
 * Calculate total invoice amounts from line items
 * @param lineItems - Array of line items with price_incl_gst, gst_rate, quantity, disc
 * @param isInterState - Whether invoice is inter-state
 * @returns { totalExclGst, cgst, sgst, igst, totalInclGst }
 */
export function calculateInvoiceTotals(
  lineItems: LineItem[],
  isInterState: boolean,
): InvoiceTotals {
  let totalExclGst = 0;
  let totalCgst = 0;
  let totalSgst = 0;
  let totalIgst = 0;
  let totalInclGst = 0;

  lineItems.forEach(item => {
    // Calculate line item total (after discount)
    const baseAmount = item.price_incl_gst * item.quantity;
    const discountAmount = item.disc ? (baseAmount * item.disc) / 100 : 0;
    const lineItemTotal = baseAmount - discountAmount;

    // Calculate tax for this line item
    const tax = calculateLineItemTax(
      lineItemTotal,
      item.gst_rate,
      isInterState,
    );

    totalExclGst += tax.preTaxAmount;
    totalCgst += tax.cgstAmount;
    totalSgst += tax.sgstAmount;
    totalIgst += tax.igstAmount;
    totalInclGst += lineItemTotal;
  });

  return {
    totalExclGst: parseFloat(totalExclGst.toFixed(2)),
    cgst: parseFloat(totalCgst.toFixed(2)),
    sgst: parseFloat(totalSgst.toFixed(2)),
    igst: parseFloat(totalIgst.toFixed(2)),
    totalInclGst: parseFloat(totalInclGst.toFixed(2)),
  };
}

/**
 * Determine if supply is inter-state based on supplier state and place of supply
 * @param supplierState - Supplier state code (2-digit, e.g., '27' for Maharashtra)
 * @param placeOfSupplyState - Place of supply state code
 * @returns boolean - true if inter-state (different states)
 */
export function isInterStateSale(
  supplierState: string,
  placeOfSupplyState: string,
): boolean {
  if (!supplierState || !placeOfSupplyState) {
    return false;
  }
  return supplierState !== placeOfSupplyState;
}

/**
 * Validate if e-way bill is required
 * @param grandTotal - Invoice total amount
 * @param isInterState - Whether supply is inter-state
 * @param hsnCodes - Array of HSN codes used in invoice
 * @param supplierState - Supplier state code
 * @returns { required: boolean; reason: string; threshold: number }
 *
 * RULES:
 * 1. Inter-state supply ≥ ₹50,000 → E-way bill required
 * 2. Kerala, HSN 71xx (gold) ≥ ₹10,00,000 → E-way bill required
 */
export function checkEWayBillRequired(
  grandTotal: number,
  isInterState: boolean,
  hsnCodes: string[],
  supplierState?: string,
): {required: boolean; reason: string; threshold: number} {
  // Rule 1: Inter-state supplies above ₹50,000
  if (isInterState && grandTotal >= 50000) {
    return {
      required: true,
      reason: 'Inter-state supply exceeds ₹50,000 threshold',
      threshold: 50000,
    };
  }

  // Rule 2: Kerala gold (HSN 71xx) above ₹10,00,000
  if (supplierState === '32') {
    // 32 = Kerala state code
    const hasGoldHsn = hsnCodes.some(hsn => hsn.startsWith('71'));
    if (hasGoldHsn && grandTotal >= 1000000) {
      return {
        required: true,
        reason: 'Kerala gold jewelry exceeds ₹10,00,000 threshold',
        threshold: 1000000,
      };
    }
  }

  return {
    required: false,
    reason: '',
    threshold: 0,
  };
}

/**
 * Format currency for display
 * @param amount - Numeric amount
 * @returns Formatted string with ₹ symbol
 */
export function formatCurrency(
  amount: number | string | null | undefined,
): string {
  const numericAmount = Number(amount);
  const safeAmount = Number.isFinite(numericAmount) ? numericAmount : 0;
  return `₹${safeAmount.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * State code to state name mapping
 */
export const STATE_CODES: Record<string, string> = {
  '01': 'Jammu and Kashmir',
  '02': 'Himachal Pradesh',
  '03': 'Punjab',
  '04': 'Chandigarh',
  '05': 'Uttarakhand',
  '06': 'Haryana',
  '07': 'Delhi',
  '08': 'Rajasthan',
  '09': 'Uttar Pradesh',
  '10': 'Bihar',
  '11': 'Sikkim',
  '12': 'Arunachal Pradesh',
  '13': 'Nagaland',
  '14': 'Manipur',
  '15': 'Mizoram',
  '16': 'Tripura',
  '17': 'Meghalaya',
  '18': 'Assam',
  '19': 'West Bengal',
  '20': 'Jharkhand',
  '21': 'Odisha',
  '22': 'Chhattisgarh',
  '23': 'Madhya Pradesh',
  '24': 'Gujarat',
  '25': 'Daman and Diu',
  '26': 'Dadra and Nagar Haveli',
  '27': 'Maharashtra',
  '29': 'Karnataka',
  '30': 'Goa',
  '31': 'Lakshadweep',
  '32': 'Kerala',
  '33': 'Tamil Nadu',
  '34': 'Puducherry',
  '35': 'Andaman and Nicobar Islands',
  '36': 'Telangana',
  '37': 'Andhra Pradesh',
  '38': 'Ladakh',
};

/**
 * Get state name from state code
 */
export function getStateName(stateCode: string): string {
  return STATE_CODES[stateCode] || 'Unknown';
}

/**
 * Get all state codes as array for dropdowns
 */
export function getStateOptions() {
  return Object.entries(STATE_CODES).map(([code, name]) => ({
    label: `${name} (${code})`,
    value: code,
  }));
}
