import PDFDocument from 'pdfkit';
import { formatCurrency } from '../utils/formatCurrency.js';
import { logger } from '../config/logger.js';

const MM_TO_PT = 2.83465;
const mm = (value) => value * MM_TO_PT;

const PAGE_MARGIN = mm(15);
const CONTENT_WIDTH = mm(210) - PAGE_MARGIN * 2;

const MONEY_KEYS = new Set([
  'value', 'totalRevenue', 'totalAmount', 'totalDiscount', 'averageSale', 'totalValue',
  'salesRevenue', 'carwashRevenue', 'expenses', 'net', 'cogs', 'grossProfit', 'netProfit',
]);

// Mirrors src/pages/reports/ReportsCenter.jsx's REPORT_CONFIGS labels for
// the 6 report types the UI actually exposes (Sales, Inventory, Expenses,
// Profit, Car Wash, Branches — the proposal's report list). Presentation
// labels only, not business logic — the underlying data comes from the
// same unmodified reportService.getReport() every JSON/CSV consumer uses.
const REPORT_PDF_CONFIGS = {
  sales: {
    title: 'Sales',
    summaryLabels: { totalSales: 'Total Sales', totalRevenue: 'Total Revenue', totalDiscount: 'Total Discount', averageSale: 'Average Sale' },
    breakdowns: [{ key: 'byDay', title: 'By Day', labelHeader: 'Date' }, { key: 'byBranch', title: 'By Branch', labelHeader: 'Branch' }],
  },
  inventory: {
    title: 'Inventory',
    summaryLabels: { totalRecords: 'Total Records', totalValue: 'Total Value', lowStock: 'Low Stock', outOfStock: 'Out of Stock' },
    breakdowns: [{ key: 'byCategory', title: 'By Category', labelHeader: 'Category' }],
  },
  expenses: {
    title: 'Expenses',
    summaryLabels: { totalExpenses: 'Total Expenses', totalAmount: 'Total Amount' },
    breakdowns: [{ key: 'byCategory', title: 'By Category', labelHeader: 'Category' }],
  },
  carwash: {
    title: 'Car Wash',
    summaryLabels: { totalTransactions: 'Total Transactions', totalRevenue: 'Total Revenue' },
    breakdowns: [{ key: 'byService', title: 'Popular Services', labelHeader: 'Service' }],
  },
  profit: {
    title: 'Profit',
    summaryLabels: {
      salesRevenue: 'Sales Revenue', carwashRevenue: 'Car Wash Revenue', totalRevenue: 'Total Revenue',
      cogs: 'Cost of Goods Sold', grossProfit: 'Gross Profit', expenses: 'Expenses', netProfit: 'Net Profit',
    },
    breakdowns: [{ key: 'byDay', title: 'By Day', labelHeader: 'Date' }],
  },
  branches: {
    title: 'Branches',
    summaryLabels: null,
    breakdowns: [{ key: 'byBranch', title: 'Branch Comparison', labelHeader: 'Branch' }],
  },
};

function humanize(key) {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function formatCell(key, value) {
  if (typeof value !== 'number') return String(value ?? '');
  return MONEY_KEYS.has(key) ? formatCurrency(value) : value.toLocaleString();
}

function divider(doc) {
  doc.moveDown(0.3);
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_MARGIN + CONTENT_WIDTH, doc.y).strokeColor('#E5E7EB').stroke();
  doc.moveDown(0.3);
}

// Falls back to a generic, fully-derived layout for any report type not in
// REPORT_PDF_CONFIGS above (every other type reportService already
// supports, just not exposed as a pill in the simplified Reports UI) —
// humanized labels, one table per array-valued field on the report.
function resolveConfig(type, report) {
  const known = REPORT_PDF_CONFIGS[type];
  if (known) return known;

  const breakdowns = Object.keys(report)
    .filter((key) => key !== 'summary' && Array.isArray(report[key]))
    .map((key) => ({ key, title: humanize(key), labelHeader: 'Name' }));

  return {
    title: humanize(type),
    summaryLabels: report.summary ? Object.fromEntries(Object.keys(report.summary).map((k) => [k, humanize(k)])) : null,
    breakdowns,
  };
}

export function buildReportPdf(type, report, { dateFrom, dateTo } = {}) {
  const config = resolveConfig(type, report);
  const dateRangeLabel = dateFrom && dateTo ? `${dateFrom} to ${dateTo}` : 'All time';

  const doc = new PDFDocument({ size: 'A4', margin: PAGE_MARGIN });
  const chunks = [];
  doc.on('data', (chunk) => chunks.push(chunk));

  doc.fontSize(16).font('Helvetica-Bold').text(`${config.title} Report`, { width: CONTENT_WIDTH });
  doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text(dateRangeLabel, { width: CONTENT_WIDTH });
  doc.fillColor('#111111');
  divider(doc);

  if (report.summary && config.summaryLabels) {
    doc.fontSize(11).font('Helvetica-Bold').text('Summary', { width: CONTENT_WIDTH });
    doc.moveDown(0.2);
    doc.fontSize(9).font('Helvetica');
    Object.entries(config.summaryLabels).forEach(([key, label]) => {
      doc.text(`${label}: ${formatCell(key, report.summary[key])}`, { width: CONTENT_WIDTH });
    });
    divider(doc);
  }

  config.breakdowns.forEach(({ key, title: breakdownTitle, labelHeader }) => {
    const rows = report[key];

    doc.fontSize(11).font('Helvetica-Bold').text(breakdownTitle, { width: CONTENT_WIDTH });
    doc.moveDown(0.2);

    if (!rows || rows.length === 0) {
      doc.fontSize(9).font('Helvetica').fillColor('#6B7280').text('No data for the selected filters.', { width: CONTENT_WIDTH });
      doc.fillColor('#111111');
      divider(doc);
      return;
    }

    const columns = Object.keys(rows[0]).filter((c) => c !== 'id' && c !== 'code');
    const columnWidth = CONTENT_WIDTH / columns.length;

    doc.fontSize(8).font('Helvetica-Bold');
    let rowY = doc.y;
    columns.forEach((c, index) => {
      doc.text(c === 'label' ? labelHeader : humanize(c), PAGE_MARGIN + index * columnWidth, rowY, { width: columnWidth });
    });
    doc.moveDown(0.6);
    doc.font('Helvetica');

    rows.forEach((row) => {
      rowY = doc.y;
      columns.forEach((c, index) => {
        doc.fontSize(8).text(formatCell(c, row[c]), PAGE_MARGIN + index * columnWidth, rowY, { width: columnWidth });
      });
      doc.moveDown(0.5);
    });

    divider(doc);
  });

  doc.end();

  return new Promise((resolve, reject) => {
    doc.on('end', () => {
      logger.info('Report PDF generated', { type });
      resolve(Buffer.concat(chunks));
    });
    doc.on('error', reject);
  });
}
