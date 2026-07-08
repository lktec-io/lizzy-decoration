import PDFDocument from 'pdfkit';
import { formatCurrency } from '../utils/formatCurrency.js';

const MM_TO_PT = 2.83465;
const mm = (value) => value * MM_TO_PT;

const PAGE_WIDTH = mm(80);
const PAGE_HEIGHT = mm(297);
const MARGIN = mm(4);
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
};

function divider(doc) {
  doc.moveDown(0.2);
  doc.moveTo(MARGIN, doc.y).lineTo(PAGE_WIDTH - MARGIN, doc.y).strokeColor('#CCCCCC').stroke();
  doc.moveDown(0.3);
}

// A narrow, thermal-receipt-shaped PDF — "Preview"/"Print"/"Download PDF"
// per the spec all render the same document; the browser's print dialog
// handles the actual paper-width match at print time.
export function buildReceiptPdf(sale, company) {
  const doc = new PDFDocument({ size: [PAGE_WIDTH, PAGE_HEIGHT], margin: MARGIN });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(12).font('Helvetica-Bold').text(company?.company_name || 'JOZZY Decoration & Accessories', { width: CONTENT_WIDTH, align: 'center' });
  doc.font('Helvetica').fontSize(7);
  if (company?.address) doc.text(company.address, { width: CONTENT_WIDTH, align: 'center' });
  if (company?.phone) doc.text(company.phone, { width: CONTENT_WIDTH, align: 'center' });
  divider(doc);

  doc.fontSize(8);
  doc.text(`Receipt: ${sale.sale_number}`, { width: CONTENT_WIDTH });
  doc.text(`Branch: ${sale.branch_name}`, { width: CONTENT_WIDTH });
  doc.text(`Date: ${new Date(sale.created_at).toLocaleString('en-TZ')}`, { width: CONTENT_WIDTH });
  doc.text(`Cashier: ${sale.cashier_first_name} ${sale.cashier_last_name}`, { width: CONTENT_WIDTH });
  if (sale.customer_first_name) {
    doc.text(`Customer: ${sale.customer_first_name} ${sale.customer_last_name}`, { width: CONTENT_WIDTH });
  }
  divider(doc);

  doc.font('Helvetica-Bold').text('Items', { width: CONTENT_WIDTH });
  doc.font('Helvetica');
  sale.items.forEach((item) => {
    const discountNote = Number(item.discount_amount) > 0 ? `  (-${formatCurrency(item.discount_amount)})` : '';
    doc.fontSize(8).text(item.product_name, { width: CONTENT_WIDTH });
    doc.fontSize(7).fillColor('#4B5563').text(
      `  ${item.quantity} x ${formatCurrency(item.unit_price)} = ${formatCurrency(item.line_total)}${discountNote}`,
      { width: CONTENT_WIDTH },
    );
    doc.fillColor('#111111');
  });
  divider(doc);

  doc.fontSize(8);
  doc.text(`Subtotal: ${formatCurrency(sale.subtotal)}`, { width: CONTENT_WIDTH, align: 'right' });
  if (Number(sale.discount_amount) > 0) {
    doc.text(`Discount: -${formatCurrency(sale.discount_amount)}`, { width: CONTENT_WIDTH, align: 'right' });
  }
  doc.font('Helvetica-Bold').text(`Total: ${formatCurrency(sale.total_amount)}`, { width: CONTENT_WIDTH, align: 'right' });
  doc.font('Helvetica');
  divider(doc);

  doc.font('Helvetica-Bold').text('Payments', { width: CONTENT_WIDTH });
  doc.font('Helvetica');
  sale.payments.forEach((payment) => {
    const label = PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method;
    doc.text(`${label}: ${formatCurrency(payment.amount)}`, { width: CONTENT_WIDTH });
  });
  const totalPaid = sale.payments.reduce((sum, payment) => sum + Number(payment.amount), 0);
  const balance = totalPaid - Number(sale.total_amount);
  if (balance > 0) doc.text(`Change: ${formatCurrency(balance)}`, { width: CONTENT_WIDTH });
  divider(doc);

  doc.fontSize(7).text(company?.receipt_footer || 'Thank you for your business!', { width: CONTENT_WIDTH, align: 'center' });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
  });
}
