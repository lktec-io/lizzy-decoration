import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as reportRepository from '../repositories/report.repository.js';

const REPORT_TYPES = [
  'sales', 'inventory', 'purchases', 'expenses', 'carwash', 'profit',
  'branches', 'products', 'customers', 'suppliers', 'returns', 'transfers', 'users',
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
    default: throw new ApiError(404, `Unknown report type "${type}"`);
  }
}

export function getReportTypes() {
  return REPORT_TYPES;
}
