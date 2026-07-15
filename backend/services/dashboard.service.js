import { ApiError } from '../utils/apiError.js';
import { env } from '../config/env.js';
import { getAccessibleBranchIds } from '../utils/branchScope.js';
import * as dashboardRepository from '../repositories/dashboard.repository.js';
import * as activityLogRepository from '../repositories/activityLog.repository.js';

const CHART_HANDLERS = {
  'sales-trend': (branchIds, query) => dashboardRepository.getSalesTrend(branchIds, query.range),
  'revenue-trend': (branchIds) => dashboardRepository.getRevenueTrend(branchIds),
  'expense-trend': (branchIds) => dashboardRepository.getExpenseTrend(branchIds),
  'profit-trend': (branchIds) => dashboardRepository.getProfitTrend(branchIds),
  'top-products': (branchIds) => dashboardRepository.getTopProducts(branchIds),
  'branch-performance': (branchIds) => dashboardRepository.getBranchPerformance(branchIds),
  'inventory-summary': (branchIds) => dashboardRepository.getInventorySummary(branchIds),
  'carwash-summary': (branchIds) => dashboardRepository.getCarwashSummary(branchIds),
  'payment-status': (branchIds) => dashboardRepository.getPaymentStatus(branchIds),
  'revenue-vs-expenses': (branchIds) => dashboardRepository.getRevenueVsExpenses(branchIds),
};

export async function getKpis(user) {
  const branchIds = await getAccessibleBranchIds(user);
  return dashboardRepository.getKpis(branchIds);
}

export async function getChart(user, type, query = {}) {
  const handler = CHART_HANDLERS[type];
  if (!handler) {
    throw new ApiError(400, `Unknown chart type "${type}"`);
  }
  const branchIds = await getAccessibleBranchIds(user);
  return handler(branchIds, query);
}

export async function getSystemStatus() {
  const { lastBackupAt, lastBackupStatus, onlineUsers } = await dashboardRepository.getSystemStatus();
  return {
    databaseConnected: true, // this call itself just succeeded against MySQL
    cloudinaryConnected: Boolean(env.cloudinary.cloudName && env.cloudinary.apiKey && env.cloudinary.apiSecret),
    serverOnline: true, // trivially true — this response is coming from the server
    lastBackupAt,
    lastBackupStatus,
    onlineUsers,
  };
}

export async function getActivity(limit = 20) {
  return activityLogRepository.findRecent(limit);
}
