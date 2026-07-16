import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import { formatCurrency } from '../utils/formatCurrency.js';
import * as reportRepository from '../repositories/report.repository.js';

const REPORT_TYPES = [
  'sales', 'inventory', 'purchases', 'expenses', 'carwash', 'profit',
  'branches', 'products', 'customers', 'suppliers', 'returns', 'transfers', 'users', 'all',
];

// The "by day" breakdowns (sales/profit) group by a naturally-unbounded
// dimension — every other breakdown groups by a small, capped set (category,
// branch, status, reason, supplier) or already has its own LIMIT. A caller
// could otherwise request a multi-year range and get one row per day with no
// cap; reject spans beyond this instead of silently truncating rows the UI
// would assume is complete.
const MAX_DATE_RANGE_DAYS = 400;

function defaultDateRange() {
  const now = new Date();
  const from = new Date(now.getFullYear(), now.getMonth(), 1);
  const toIso = now.toISOString().slice(0, 10);
  const fromIso = from.toISOString().slice(0, 10);
  return { dateFrom: fromIso, dateTo: toIso };
}

// Reports must reflect live database data with no hardcoded values (per the
// spec's explicit business rule) — every report type below is a real
// aggregate query, not a stub. Date filters default to "this month so far"
// when the caller doesn't specify a range.
export async function getReport(type, query, user) {
  if (!REPORT_TYPES.includes(type)) {
    throw new ApiError(404, `Unknown report type "${type}"`);
  }

  const branchIds = await getAccessibleBranchIds(user);
  if (query.branchId) {
    const branchId = Number(query.branchId);
    if (branchIds !== null && !branchIds.includes(branchId)) {
      throw new ApiError(403, 'You do not have access to this branch');
    }
  }

  const { dateFrom, dateTo } = defaultDateRange();
  const filters = {
    dateFrom: query.dateFrom || dateFrom,
    dateTo: query.dateTo || dateTo,
    branchId: query.branchId ? Number(query.branchId) : undefined,
    categoryId: query.categoryId ? Number(query.categoryId) : undefined,
    supplierId: query.supplierId ? Number(query.supplierId) : undefined,
    cashierId: query.cashierId ? Number(query.cashierId) : undefined,
    customerId: query.customerId ? Number(query.customerId) : undefined,
    productId: query.productId ? Number(query.productId) : undefined,
    status: query.status || undefined,
    branchIds,
  };

  const spanDays = (new Date(filters.dateTo) - new Date(filters.dateFrom)) / 86400000;
  if (spanDays > MAX_DATE_RANGE_DAYS) {
    throw new ApiError(400, `Date range too large — please select a range of ${MAX_DATE_RANGE_DAYS} days or fewer.`);
  }

  switch (type) {
    case 'sales': return reportRepository.salesReport(filters);
    case 'inventory': return reportRepository.inventoryReport(filters);
    case 'purchases': return reportRepository.purchasesReport(filters);
    case 'expenses': return reportRepository.expensesReport(filters);
    case 'carwash': return reportRepository.carwashReport(filters);
    case 'profit': return reportRepository.profitReport(filters);
    case 'branches': return reportRepository.branchesReport(filters);
    case 'products': return reportRepository.productsReport(filters);
    case 'customers': return reportRepository.customersReport(filters);
    case 'suppliers': return reportRepository.suppliersReport(filters);
    case 'returns': return reportRepository.returnsReport(filters);
    case 'transfers': return reportRepository.transfersReport(filters);
    case 'users': return reportRepository.usersReport(filters);
    case 'all': return buildAllReport(filters);
    default: throw new ApiError(404, `Unknown report type "${type}"`);
  }
}

// Plain, factual sentences generated from the same numbers already computed
// above — no invented figures, no LLM narrative. Each line only appears if
// its underlying denominator is non-zero (e.g. no "Car Wash contributes 0%
// of $0" line when there's no revenue at all in the period).
function buildBusinessSummary({ sales, products, customers, expenses, carwash, profit }) {
  const lines = [];

  if (sales.summary.totalSales > 0) {
    lines.push(`Total sales revenue was ${formatCurrency(sales.summary.totalRevenue)} across ${sales.summary.totalSales} transactions (average sale ${formatCurrency(sales.summary.averageSale)}).`);
  }

  if (profit.summary.totalRevenue > 0 && carwash.summary.totalRevenue > 0) {
    const carwashShare = (carwash.summary.totalRevenue / profit.summary.totalRevenue) * 100;
    lines.push(`Car Wash contributed ${carwashShare.toFixed(1)}% of total revenue (${formatCurrency(carwash.summary.totalRevenue)} from ${carwash.summary.totalTransactions} washes).`);
  }

  if (products.topProducts.length > 0) {
    const top = products.topProducts[0];
    lines.push(`Top selling product was ${top.label}, with ${top.quantity} units sold (${formatCurrency(top.value)} in revenue).`);
  }

  if (expenses.summary.totalExpenses > 0) {
    lines.push(`Total expenses recorded: ${formatCurrency(expenses.summary.totalAmount)} across ${expenses.summary.totalExpenses} entries.`);
  }

  lines.push(`Net profit for the period: ${formatCurrency(profit.summary.netProfit)}.`);

  if (customers.topCustomers.length > 0) {
    const top = customers.topCustomers[0];
    lines.push(`Top customer was ${top.label}, with ${formatCurrency(top.value)} in purchases across ${top.orders} orders.`);
  }

  return lines;
}

// The "business summary" report — reuses every existing report function
// unmodified (same real queries every individual report already runs, run
// in parallel) and flattens the results into the same flat
// { summary, ...breakdownArrays } shape every other report type already
// returns, so the existing generic frontend table/PDF/Excel/CSV renderers
// need no special-casing for this one type — only a new REPORT_CONFIGS
// entry (frontend + reportConfig.js) naming which flattened keys to show.
async function buildAllReport(filters) {
  const [sales, products, customers, expenses, carwash, profit] = await Promise.all([
    reportRepository.salesReport(filters),
    reportRepository.productsReport(filters),
    reportRepository.customersReport(filters),
    reportRepository.expensesReport(filters),
    reportRepository.carwashReport(filters),
    reportRepository.profitReport(filters),
  ]);

  return {
    summary: {
      totalSales: sales.summary.totalSales,
      totalRevenue: profit.summary.totalRevenue,
      totalExpenses: expenses.summary.totalAmount,
      carwashRevenue: carwash.summary.totalRevenue,
      netProfit: profit.summary.netProfit,
    },
    salesByDay: sales.byDay,
    salesByBranch: sales.byBranch,
    topProducts: products.topProducts,
    topCustomers: customers.topCustomers,
    expensesByCategory: expenses.byCategory,
    carwashByService: carwash.byService,
    analysis: buildBusinessSummary({ sales, products, customers, expenses, carwash, profit }),
  };
}

export function getReportTypes() {
  return REPORT_TYPES;
}
