import { ApiError } from '../utils/apiError.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as dashboardRepository from '../repositories/dashboard.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

const CHART_HANDLERS = {
  'sales-trend': (branchIds) => dashboardRepository.getSalesTrend(branchIds),
  'revenue-trend': (branchIds) => dashboardRepository.getRevenueTrend(branchIds),
  'expense-trend': (branchIds) => dashboardRepository.getExpenseTrend(branchIds),
  'profit-trend': (branchIds) => dashboardRepository.getProfitTrend(branchIds),
  'top-products': (branchIds) => dashboardRepository.getTopProducts(branchIds),
  'branch-performance': (branchIds) => dashboardRepository.getBranchPerformance(branchIds),
  'inventory-summary': (branchIds) => dashboardRepository.getInventorySummary(branchIds),
  'carwash-summary': (branchIds) => dashboardRepository.getCarwashSummary(branchIds),
};

export async function getKpis(user) {
  const branchIds = await getAccessibleBranchIds(user);
  return dashboardRepository.getKpis(branchIds);
}

export async function getChart(user, type) {
  const handler = CHART_HANDLERS[type];
  if (!handler) {
    throw new ApiError(400, `Unknown chart type "${type}"`);
  }
  const branchIds = await getAccessibleBranchIds(user);
  return handler(branchIds);
}

export async function getActivity(limit = 20) {
  return activityLogRepository.findRecent(limit);
}
