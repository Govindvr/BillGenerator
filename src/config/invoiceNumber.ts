export const INVOICE_NUMBER_PAD_LENGTH = 4;

export function normalizeBillKind(value, fallback = 'B2C') {
  if (typeof value === 'string') {
    const normalized = value.trim().toUpperCase();
    if (normalized === 'B2B' || normalized === 'B2C') {
      return normalized;
    }
  }

  return fallback;
}

export function formatInvoiceNumber(billKind, sequence) {
  const normalizedKind = normalizeBillKind(billKind, 'B2C');
  const sequenceValue = String(sequence ?? 0).replace(/[^0-9]/g, '');
  const numericSequence = Number.parseInt(sequenceValue || '0', 10);

  return `${normalizedKind}-${String(numericSequence).padStart(
    INVOICE_NUMBER_PAD_LENGTH,
    '0',
  )}`;
}

export function extractInvoiceSequenceNumber(invoiceNumber) {
  const raw = String(invoiceNumber ?? '').trim();
  if (!raw) {
    return 0;
  }

  const prefixedMatch = raw.match(/(?:B2B|B2C)[-_ ]?(\d+)/i);
  if (prefixedMatch) {
    return Number.parseInt(prefixedMatch[1], 10) || 0;
  }

  const rawDigits = raw.replace(/\D+/g, '');
  if (!rawDigits) {
    return 0;
  }

  return Number.parseInt(rawDigits, 10) || 0;
}

export function normalizeInvoiceNumber(value, billKind = 'B2C') {
  const normalizedKind = normalizeBillKind(billKind, 'B2C');
  const raw = String(value ?? '').trim();

  if (!raw) {
    return formatInvoiceNumber(normalizedKind, 0);
  }

  const prefixedMatch = raw.match(/^(B2B|B2C)[-_ ]?(\d+)$/i);
  if (prefixedMatch) {
    return formatInvoiceNumber(prefixedMatch[1], prefixedMatch[2]);
  }

  const digits = raw.replace(/\D+/g, '');
  if (!digits) {
    return formatInvoiceNumber(normalizedKind, 0);
  }

  return formatInvoiceNumber(normalizedKind, digits);
}
