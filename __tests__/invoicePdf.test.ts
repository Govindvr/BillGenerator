jest.mock('react-native-fs', () => ({
  DocumentDirectoryPath: '/tmp/documents',
  DownloadDirectoryPath: '/tmp/downloads',
  ExternalDirectoryPath: '/tmp/external',
  mkdir: jest.fn(),
  readDir: jest.fn(),
  exists: jest.fn(),
  readFile: jest.fn(),
}));

jest.mock('react-native-file-viewer', () => ({
  __esModule: true,
  default: {open: jest.fn()},
}));

jest.mock('qrcode', () => ({
  __esModule: true,
  default: {
    toDataURL: jest.fn(),
    toString: jest.fn(),
  },
}));

jest.mock('react-native-html-to-pdf', () => ({
  generatePDF: jest.fn(),
}));

const {
  matchesInvoicePdfFilename,
  generateInvoicePdfFromBill,
} = require('../src/config/invoicePdf');
const {
  formatInvoiceNumber,
  extractInvoiceSequenceNumber,
  normalizeInvoiceNumber,
} = require('../src/config/invoiceNumber');
const RNFS = require('react-native-fs');
const QRCode = require('qrcode').default;
const RNHTMLtoPDF = require('react-native-html-to-pdf');

function countItemRowsFromHtml(html: string): number {
  return (html.match(/<tr class="item-row">/g) || []).length;
}

describe('invoice number helpers', () => {
  it('formats and normalizes category-prefixed invoice numbers separately per kind', () => {
    expect(formatInvoiceNumber('B2B', 7)).toBe('B2B-0007');
    expect(formatInvoiceNumber('B2C', '12')).toBe('B2C-0012');
    expect(normalizeInvoiceNumber('B2B-0009', 'B2C')).toBe('B2B-0009');
    expect(normalizeInvoiceNumber('18', 'B2B')).toBe('B2B-0018');
    expect(extractInvoiceSequenceNumber('B2C-0012')).toBe(12);
  });
});

describe('matchesInvoicePdfFilename', () => {
  it('matches saved invoice PDF files by invoice number across both naming formats', () => {
    expect(
      matchesInvoicePdfFilename('invoice_B2B_45_05-06-2026.pdf', 'B2B-0045'),
    ).toBe(true);
    expect(matchesInvoicePdfFilename('invoice_45_05-06-2026.pdf', '45')).toBe(
      true,
    );
    expect(
      matchesInvoicePdfFilename('invoice_B2C_8_31-08-2026.pdf', 'B2C-0008'),
    ).toBe(true);
  });

  it('does not match partial invoice numbers', () => {
    expect(
      matchesInvoicePdfFilename('invoice_B2B_123_05-06-2026.pdf', 12),
    ).toBe(false);
    expect(matchesInvoicePdfFilename('invoice_12_05-06-2026.pdf', 123)).toBe(
      false,
    );
  });
});

describe('generateInvoicePdfFromBill fixed rows', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    RNFS.mkdir.mockResolvedValue(undefined);
    RNFS.readFile.mockResolvedValue('');
    QRCode.toString.mockResolvedValue('<svg>qr</svg>');
    RNHTMLtoPDF.generatePDF.mockResolvedValue({
      filePath: '/tmp/documents/invoices/invoice_test.pdf',
    });
  });

  it('always renders exactly 15 item rows', async () => {
    const bill = {
      invoice_number: 'B2C-0001',
      bill_kind: 'B2C',
      date: '2026-08-30',
      total_incl_gst: 100,
      total_excl_gst: 90,
      cgst_total: 5,
      sgst_total: 5,
      igst_total: 0,
    };

    const itemCounts = [0, 3, 15, 18];

    for (const count of itemCounts) {
      const items = Array.from({length: count}, (_, index) => ({
        product_name: `Product ${index + 1}`,
        hsn_sac: '1234',
        gst_rate: 18,
        quantity: 1,
        unit: 'Nos',
        price_incl_gst: 100,
        discount_percent: 0,
        item_total_excl_gst: 84.75,
      }));

      const result = await generateInvoicePdfFromBill({
        bill,
        billItems: items,
      });

      const lastCallArgs = RNHTMLtoPDF.generatePDF.mock.calls.at(-1)?.[0];
      expect(lastCallArgs).toBeDefined();
      expect(countItemRowsFromHtml(lastCallArgs.html)).toBe(15);
      expect(result.truncatedItemCount).toBe(Math.max(0, count - 15));
    }
  });
});
