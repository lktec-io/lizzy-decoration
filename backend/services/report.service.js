import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as reportRepository from '../repositories/report.repository.js';

const REPORT_TYPES = [
  'sales', 'inventory', 'purchases', 'expenses', 'carwash', 'profit',
  'branches', 'products', 'customers', 'suppliers', 'returns', 'transfers',
];

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
    branchIds,
  };

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
    default: throw new ApiError(404, `Unknown report type "${type}"`);
  }
}

export function getReportTypes() {
  return REPORT_TYPES;
}
