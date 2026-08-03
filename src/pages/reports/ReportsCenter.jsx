import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FiPrinter, FiDownload, FiFileText, FiBarChart2, FiGrid, FiTrendingUp,
  FiDollarSign, FiPackage, FiBox, FiUsers, FiTruck, FiCreditCard, FiLayers,
} from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import { usePermission } from '../../hooks/usePermission';
import { useCompany } from '../../hooks/useCompany';
import * as reportService from '../../services/reportService';
import * as branchService from '../../services/branchService';
import * as categoryService from '../../services/categoryService';
import * as customerService from '../../services/customerService';
import * as productService from '../../services/productService';
import * as userService from '../../services/userService';
import { formatCurrency } from '../../utils/formatCurrency';
import { downloadCsv } from '../../utils/exportCsv';
import '../../styles/pages/Reports.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function yesterdayIso() {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

// Monday-based week start, matching regional convention (no other date-range
// widget in the app currently defines a week start, so this is the first).
function startOfWeekIso() {
  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;
  const monday = new Date(now);
  monday.setDate(now.getDate() - diffToMonday);
  return monday.toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

function daysAgoIso(days) {
  const d = new Date();
  d.setDate(d.getDate() - days);
  return d.toISOString().slice(0, 10);
}

function firstOfLastMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 10);
}

function lastOfLastMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 0).toISOString().slice(0, 10);
}

function firstOfYearIso() {
  const now = new Date();
  return new Date(now.getFullYear(), 0, 1).toISOString().slice(0, 10);
}

const DATE_PRESETS = {
  today: () => [todayIso(), todayIso()],
  yesterday: () => [yesterdayIso(), yesterdayIso()],
  week: () => [startOfWeekIso(), todayIso()],
  last7: () => [daysAgoIso(6), todayIso()],
  last30: () => [daysAgoIso(29), todayIso()],
  month: () => [firstOfMonthIso(), todayIso()],
  lastMonth: () => [firstOfLastMonthIso(), lastOfLastMonthIso()],
  year: () => [firstOfYearIso(), todayIso()],
};

const MONEY_KEYS = new Set([
  'value', 'totalRevenue', 'totalAmount', 'totalDiscount', 'averageSale', 'totalValue',
  'salesRevenue', 'carwashRevenue', 'expenses', 'totalExpenses', 'net', 'cogs', 'grossProfit', 'netProfit',
  'totalPurchased', 'totalPaid', 'outstandingBalance', 'averageDailySales', 'averageInvoice',
]);

// label/summary/title/labelHeader values below are `reports` namespace
// translation keys, resolved via t() at render time — this module-level
// config can't call hooks directly (same pattern as Sidebar.jsx's
// NAV_ITEMS).
const PURCHASE_STATUS_OPTIONS = [
  { value: 'pending', labelKey: 'statusOptions.pending' },
  { value: 'received', labelKey: 'statusOptions.received' },
  { value: 'cancelled', labelKey: 'statusOptions.cancelled' },
];

const RETURN_STATUS_OPTIONS = [
  { value: 'pending', labelKey: 'statusOptions.pending' },
  { value: 'approved', labelKey: 'statusOptions.approved' },
  { value: 'rejected', labelKey: 'statusOptions.rejected' },
];

const REPORT_CONFIGS = {
  sales: {
    labelKey: 'types.sales', filters: ['dateFrom', 'dateTo', 'branchId', 'cashierId', 'customerId', 'productId'],
    summary: { totalSales: 'summary.totalSales', totalRevenue: 'summary.totalRevenue', totalDiscount: 'summary.totalDiscount', averageSale: 'summary.averageSale' },
    breakdowns: [{ key: 'byDay', titleKey: 'breakdowns.byDay', labelHeaderKey: 'labelHeaders.date' }, { key: 'byBranch', titleKey: 'breakdowns.byBranch', labelHeaderKey: 'labelHeaders.branch' }],
  },
  suppliers: {
    labelKey: 'types.suppliers', filters: [],
    breakdowns: [{ key: 'bySupplier', titleKey: 'breakdowns.supplierBalances', labelHeaderKey: 'labelHeaders.supplier' }],
  },
  customers: {
    labelKey: 'types.customers', filters: ['dateFrom', 'dateTo', 'branchId'],
    breakdowns: [{ key: 'topCustomers', titleKey: 'breakdowns.topCustomers', labelHeaderKey: 'labelHeaders.customer' }],
  },
  inventory: {
    labelKey: 'types.inventory', filters: ['branchId', 'categoryId'],
    summary: { totalRecords: 'summary.totalRecords', totalValue: 'summary.totalValue', lowStock: 'summary.lowStock', outOfStock: 'summary.outOfStock' },
    breakdowns: [{ key: 'byCategory', titleKey: 'breakdowns.byCategory', labelHeaderKey: 'labelHeaders.category' }],
  },
  products: {
    labelKey: 'types.products', filters: ['dateFrom', 'dateTo', 'branchId', 'categoryId'],
    breakdowns: [{ key: 'topProducts', titleKey: 'breakdowns.topProducts', labelHeaderKey: 'labelHeaders.product' }],
  },
  purchases: {
    labelKey: 'types.purchases', filters: ['dateFrom', 'dateTo', 'branchId', 'status', 'productId'],
    statusOptions: PURCHASE_STATUS_OPTIONS,
    summary: { totalPurchases: 'summary.totalPurchases', totalAmount: 'summary.totalAmount' },
    breakdowns: [{ key: 'bySupplier', titleKey: 'breakdowns.bySupplier', labelHeaderKey: 'labelHeaders.supplier' }],
  },
  returns: {
    labelKey: 'types.returns', filters: ['dateFrom', 'dateTo', 'branchId', 'status', 'customerId', 'productId'],
    statusOptions: RETURN_STATUS_OPTIONS,
    summary: { totalReturns: 'summary.totalReturns', totalRefund: 'summary.totalRefund' },
    breakdowns: [{ key: 'byReason', titleKey: 'breakdowns.byReason', labelHeaderKey: 'labelHeaders.reason' }],
  },
  expenses: {
    labelKey: 'types.expenses', filters: ['dateFrom', 'dateTo', 'branchId', 'categoryId'],
    summary: { totalExpenses: 'summary.totalExpenses', totalAmount: 'summary.totalAmount' },
    breakdowns: [{ key: 'byCategory', titleKey: 'breakdowns.byCategory', labelHeaderKey: 'labelHeaders.category' }],
  },
  carwash: {
    labelKey: 'types.carwash', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalTransactions: 'summary.totalTransactions', totalRevenue: 'summary.totalRevenue' },
    breakdowns: [{ key: 'byService', titleKey: 'breakdowns.popularServices', labelHeaderKey: 'labelHeaders.service' }],
  },
  profit: {
    labelKey: 'types.profit', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: {
      salesRevenue: 'summary.salesRevenue', carwashRevenue: 'summary.carwashRevenue', totalRevenue: 'summary.totalRevenue',
      cogs: 'summary.cogs', grossProfit: 'summary.grossProfit', expenses: 'summary.expenses', netProfit: 'summary.netProfit',
    },
    breakdowns: [{ key: 'byDay', titleKey: 'breakdowns.byDay', labelHeaderKey: 'labelHeaders.date' }],
  },
  branches: {
    labelKey: 'types.branches', filters: ['dateFrom', 'dateTo'],
    breakdowns: [{ key: 'byBranch', titleKey: 'breakdowns.branchComparison', labelHeaderKey: 'labelHeaders.branch' }],
  },
  users: {
    labelKey: 'types.users', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalUsers: 'summary.totalUsers', activeUsers: 'summary.activeUsers', suspendedUsers: 'summary.suspendedUsers', lockedUsers: 'summary.lockedUsers' },
    breakdowns: [{ key: 'byRole', titleKey: 'breakdowns.byRole', labelHeaderKey: 'labelHeaders.role' }, { key: 'byBranch', titleKey: 'breakdowns.byBranch', labelHeaderKey: 'labelHeaders.branch' }],
  },
  // Combined business-summary report — backend/services/report.service.js's
  // buildAllReport() flattens Sales/Products/Customers/Expenses/Car Wash/
  // Profit into this exact shape, so it renders through the same summary
  // cards + BreakdownTable components every other report type already
  // uses. `analysis` is the one field that isn't a breakdown table — it's
  // rendered separately, right below the summary cards.
  all: {
    labelKey: 'types.all', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: {
      totalSales: 'summary.totalSales', totalRevenue: 'summary.totalRevenue', totalExpenses: 'summary.totalExpenses',
      carwashRevenue: 'summary.carwashRevenue', netProfit: 'summary.netProfit',
    },
    breakdowns: [
      { key: 'salesByDay', titleKey: 'breakdowns.salesByDay', labelHeaderKey: 'labelHeaders.date' },
      { key: 'salesByBranch', titleKey: 'breakdowns.salesByBranch', labelHeaderKey: 'labelHeaders.branch' },
      { key: 'topProducts', titleKey: 'breakdowns.topProducts', labelHeaderKey: 'labelHeaders.product' },
      { key: 'topCustomers', titleKey: 'breakdowns.topCustomers', labelHeaderKey: 'labelHeaders.customer' },
      { key: 'expensesByCategory', titleKey: 'breakdowns.expensesByCategory', labelHeaderKey: 'labelHeaders.category' },
      { key: 'carwashByService', titleKey: 'breakdowns.carwashByService', labelHeaderKey: 'labelHeaders.service' },
    ],
  },
};

// "Show only: Sales, Product, Inventory, Customer, Supplier, Expenses, All
// Reports" — the other REPORT_CONFIGS entries (purchases/returns/carwash/
// profit/branches/users) stay fully supported by the backend and this same
// generic renderer; they're just no longer offered as a card here, so
// nothing about how a report actually renders needed to change.
const VISIBLE_REPORT_TYPES = ['sales', 'products', 'inventory', 'customers', 'suppliers', 'expenses', 'all'];

const REPORT_ICONS = {
  sales: FiDollarSign,
  products: FiPackage,
  inventory: FiBox,
  customers: FiUsers,
  suppliers: FiTruck,
  expenses: FiCreditCard,
  all: FiLayers,
};

function humanize(key) {
  const result = key.replace(/_/g, ' ').replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function renderCell(key, value) {
  if (typeof value !== 'number') return value;
  return MONEY_KEYS.has(key) ? formatCurrency(value) : value.toLocaleString();
}

function BreakdownTable({ title, labelHeader, rows, onExport, canExport }) {
  const { t } = useTranslation('reports');
  if (!rows || rows.length === 0) {
    return (
      <div className="card mb-5">
        <div className="card-header"><span className="card-title">{title}</span></div>
        <div className="card-body">
          <EmptyState icon={FiBarChart2} title={t('noData')} description={t('noDataForFilters')} />
        </div>
      </div>
    );
  }

  const columns = Object.keys(rows[0]).filter((c) => c !== 'id' && c !== 'code');

  return (
    <div className="card mb-5">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {canExport && (
          <button type="button" className="btn btn-ghost btn-sm no-print" onClick={() => onExport(title, rows)}>
            <FiDownload aria-hidden="true" /> CSV
          </button>
        )}
      </div>
      <div className="table-wrapper">
        <table className="table">
          <thead>
            <tr>{columns.map((c) => <th key={c}>{c === 'label' ? labelHeader : humanize(c)}</th>)}</tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                {columns.map((c) => <td key={c}>{renderCell(c, row[c])}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReportsCenter() {
  const { t } = useTranslation('reports');
  const canExport = usePermission('reports.export');
  const canViewUsers = usePermission('users.view');
  const { company } = useCompany();
  const [reportType, setReportType] = useState('sales');
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [products, setProducts] = useState([]);
  const [cashiers, setCashiers] = useState([]);
  const [datePreset, setDatePreset] = useState('month');
  const [filters, setFilters] = useState({
    dateFrom: firstOfMonthIso(), dateTo: todayIso(), branchId: '', categoryId: '', status: '', customerId: '', productId: '', cashierId: '',
  });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  const config = REPORT_CONFIGS[reportType];

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
    categoryService.listActiveCategories().then(setCategories);
    customerService.listActiveCustomers().then(setCustomers);
    productService.listProducts({ limit: 200 }).then((result) => setProducts(result.items || []));
    // Cashier filter needs the users list, which 403s for a role without
    // users.view (e.g. Cashier/Sales viewing their own Reports) — only
    // fetched, and only offered as a filter, for roles that can see it.
    if (canViewUsers) {
      userService.listUsers({ limit: 200 }).then((result) => setCashiers(result.items || []));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- canViewUsers is derived from the user's role and stable for the component's lifetime
  }, []);

  const applyDatePreset = (preset) => {
    setDatePreset(preset);
    if (preset === 'custom') return;
    const [from, to] = DATE_PRESETS[preset]();
    setFilters((prev) => ({ ...prev, dateFrom: from, dateTo: to }));
  };

  const loadReport = () => {
    setLoading(true);
    setError('');
    const params = {};
    config.filters.forEach((key) => {
      if (filters[key]) params[key] = filters[key];
    });
    reportService
      .getReport(reportType, params)
      .then(setReport)
      .catch(() => setError(t('failedToLoadReport')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the selected report on filter/type change is standard data-fetching, not derived state
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config is derived from reportType, individual filter fields tracked explicitly below
  }, [reportType, filters.dateFrom, filters.dateTo, filters.branchId, filters.categoryId, filters.status, filters.customerId, filters.productId, filters.cashierId]);

  const summaryEntries = useMemo(() => {
    if (!report?.summary || !config.summary) return [];
    return Object.entries(config.summary).map(([key, labelKey]) => ({ key, label: t(labelKey), value: report.summary[key] }));
    // t is a real dependency here (not omitted) — these labels must
    // recompute immediately on a language switch, not just when the
    // report data itself changes.
  }, [report, config, t]);

  // Whichever day-based breakdown this report type has (sales/profit use
  // byDay, the combined "all" report uses salesByDay) becomes the trend
  // line — reports with no date breakdown (inventory, customers, ...)
  // simply render no trend chart rather than a misleading empty one.
  const trendRows = report?.byDay || report?.salesByDay || [];

  // The first categorical (non-day-based) breakdown, charted as a
  // horizontal bar when it's small enough to read as a chart — By Branch,
  // Top Products, By Category, etc. Skips 'byDay'/'salesByDay' explicitly
  // since that data already renders as the trend line above; charting it
  // twice would just be the same numbers in two shapes.
  const chartBreakdown = useMemo(() => {
    const candidate = config.breakdowns.find(({ key }) => {
      if (key === 'byDay' || key === 'salesByDay') return false;
      const rows = report?.[key];
      return Array.isArray(rows) && rows.length > 0 && rows.length <= 10 && typeof rows[0]?.value === 'number';
    });
    return candidate ? { title: t(candidate.titleKey), rows: report[candidate.key] } : null;
    // t is a real dependency — the chart title must update immediately on a language switch.
  }, [config, report, t]);

  const buildExportParams = () => {
    const params = {};
    config.filters.forEach((key) => {
      if (filters[key]) params[key] = filters[key];
    });
    return params;
  };

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await reportService.exportReportPdf(reportType, buildExportParams(), t(config.labelKey));
    } catch {
      setError(t('failedToExportPdf'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await reportService.exportReportExcel(reportType, buildExportParams(), t(config.labelKey));
    } catch {
      setError(t('failedToExportExcel'));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await reportService.exportReportCsv(reportType, buildExportParams(), t(config.labelKey));
    } catch {
      setError(t('failedToExportCsv'));
    } finally {
      setExportingCsv(false);
    }
  };

  // Per-card "Quick Export" shortcut — exports the report type shown on
  // that card without first switching to it. For the currently-open type
  // it reuses the exact filters already applied; for any other type it
  // exports with no filters, which is the same as the backend's own
  // default ("this month so far") rather than an arbitrarily different
  // behavior for a report that was never opened.
  const quickExport = async (type, format) => {
    const cfg = REPORT_CONFIGS[type];
    const label = t(cfg.labelKey);
    const params = type === reportType ? buildExportParams() : {};
    try {
      if (format === 'pdf') await reportService.exportReportPdf(type, params, label);
      else if (format === 'excel') await reportService.exportReportExcel(type, params, label);
      else await reportService.exportReportCsv(type, params, label);
    } catch {
      setError(t('failedToExport', { label }));
    }
  };

  return (
    <div className="reports-page">
      <div className="reports-print-header">
        {company?.logo_path ? (
          <img src={company.logo_path} alt={company.company_name || t('companyLogo')} className="reports-print-logo" />
        ) : (
          <span className="reports-print-mark">{company?.company_name || 'JOZZY'}</span>
        )}
        <span className="reports-print-name">{company?.company_name || 'JOZZY Decoration & Accessories'}</span>
      </div>

      <div className="page-header">
        <div>
          <h1 className="page-title">{t('pageTitle')}</h1>
          <p className="page-subtitle">{t('pageSubtitle')}</p>
        </div>
        {canExport && (
          <div className="page-actions">
            <button type="button" className={`btn btn-secondary ${exportingPdf ? 'btn-loading' : ''}`} onClick={handleExportPdf} disabled={exportingPdf}>
              <FiFileText aria-hidden="true" /> PDF
            </button>
            <button type="button" className={`btn btn-secondary ${exportingExcel ? 'btn-loading' : ''}`} onClick={handleExportExcel} disabled={exportingExcel}>
              <FiGrid aria-hidden="true" /> Excel
            </button>
            <button type="button" className={`btn btn-secondary ${exportingCsv ? 'btn-loading' : ''}`} onClick={handleExportCsv} disabled={exportingCsv}>
              <FiDownload aria-hidden="true" /> CSV
            </button>
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
              <FiPrinter aria-hidden="true" /> {t('common:print')}
            </button>
          </div>
        )}
      </div>

      <div className="reports-type-grid">
        {VISIBLE_REPORT_TYPES.map((key) => {
          const cfg = REPORT_CONFIGS[key];
          const Icon = REPORT_ICONS[key];
          const active = reportType === key;
          const cfgLabel = t(cfg.labelKey);
          return (
            <div key={key} className={`card reports-type-card ${active ? 'reports-type-card-active' : ''}`}>
              <button type="button" className="reports-type-card-select" onClick={() => setReportType(key)}>
                <span className="reports-type-card-icon"><Icon aria-hidden="true" /></span>
                <span className="reports-type-card-title">{cfgLabel}</span>
                <span className="reports-type-card-desc">{t(`descriptions.${key}`)}</span>
              </button>
              {cfg.filters.includes('dateFrom') && (
                <select
                  className="form-control reports-type-card-date no-print"
                  aria-label={t('dateRangeFor', { label: cfgLabel })}
                  value={active ? datePreset : 'month'}
                  onChange={(e) => { setReportType(key); applyDatePreset(e.target.value); }}
                >
                  <option value="today">{t('today')}</option>
                  <option value="week">{t('thisWeek')}</option>
                  <option value="month">{t('thisMonth')}</option>
                  <option value="lastMonth">{t('lastMonth')}</option>
                  <option value="year">{t('thisYear')}</option>
                </select>
              )}
              {canExport && (
                <div className="reports-type-card-actions no-print">
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('exportAsPdf', { label: cfgLabel })} onClick={() => quickExport(key, 'pdf')}>
                    <FiFileText aria-hidden="true" />
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('exportAsExcel', { label: cfgLabel })} onClick={() => quickExport(key, 'excel')}>
                    <FiGrid aria-hidden="true" />
                  </button>
                  <button type="button" className="btn btn-ghost btn-icon btn-sm" aria-label={t('exportAsCsv', { label: cfgLabel })} onClick={() => quickExport(key, 'csv')}>
                    <FiDownload aria-hidden="true" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {config.filters.length > 0 && (
      <div className="card mb-5">
        <div className="card-body reports-filter-bar">
          {config.filters.includes('dateFrom') && (
            <div className="form-group">
              <label className="form-label" htmlFor="datePreset">{t('quickRange')}</label>
              <select id="datePreset" className="form-control" value={datePreset} onChange={(e) => applyDatePreset(e.target.value)}>
                <option value="today">{t('today')}</option>
                <option value="yesterday">{t('yesterday')}</option>
                <option value="last7">{t('last7Days')}</option>
                <option value="last30">{t('last30Days')}</option>
                <option value="week">{t('thisWeek')}</option>
                <option value="month">{t('thisMonth')}</option>
                <option value="lastMonth">{t('lastMonth')}</option>
                <option value="year">{t('thisYear')}</option>
                <option value="custom">{t('custom')}</option>
              </select>
            </div>
          )}
          {config.filters.includes('dateFrom') && (
            <div className="form-group">
              <label className="form-label" htmlFor="dateFrom">{t('common:dateFrom')}</label>
              <input id="dateFrom" type="date" className="form-control" value={filters.dateFrom} onChange={(e) => { setDatePreset('custom'); setFilters((prev) => ({ ...prev, dateFrom: e.target.value })); }} />
            </div>
          )}
          {config.filters.includes('dateTo') && (
            <div className="form-group">
              <label className="form-label" htmlFor="dateTo">{t('common:dateTo')}</label>
              <input id="dateTo" type="date" className="form-control" value={filters.dateTo} onChange={(e) => { setDatePreset('custom'); setFilters((prev) => ({ ...prev, dateTo: e.target.value })); }} />
            </div>
          )}
          {config.filters.includes('branchId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="branchId">{t('common:branch')}</label>
              <select id="branchId" className="form-control" value={filters.branchId} onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value }))}>
                <option value="">{t('common:allBranches')}</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('cashierId') && canViewUsers && (
            <div className="form-group">
              <label className="form-label" htmlFor="cashierId">{t('cashier')}</label>
              <select id="cashierId" className="form-control" value={filters.cashierId} onChange={(e) => setFilters((prev) => ({ ...prev, cashierId: e.target.value }))}>
                <option value="">{t('allCashiers')}</option>
                {cashiers.map((u) => <option key={u.id} value={u.id}>{u.first_name} {u.last_name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('categoryId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="categoryId">{t('category')}</label>
              <select id="categoryId" className="form-control" value={filters.categoryId} onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}>
                <option value="">{t('allCategories')}</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('status') && (
            <div className="form-group">
              <label className="form-label" htmlFor="status">{t('common:status')}</label>
              <select id="status" className="form-control" value={filters.status} onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}>
                <option value="">{t('allStatuses')}</option>
                {config.statusOptions.map((opt) => <option key={opt.value} value={opt.value}>{t(opt.labelKey)}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('customerId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="customerId">{t('common:customer')}</label>
              <select id="customerId" className="form-control" value={filters.customerId} onChange={(e) => setFilters((prev) => ({ ...prev, customerId: e.target.value }))}>
                <option value="">{t('allCustomers')}</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.first_name} {c.last_name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('productId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="productId">{t('common:product')}</label>
              <select id="productId" className="form-control" value={filters.productId} onChange={(e) => setFilters((prev) => ({ ...prev, productId: e.target.value }))}>
                <option value="">{t('allProducts')}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>
      )}

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      {loading ? (
        <div className="grid grid-cols-4 mb-5">
          {Array.from({ length: 4 }, (_, i) => `report-summary-skeleton-${i}`).map((skeletonKey) => (
            <div className="card kpi-card" key={skeletonKey}>
              <div style={{ width: '100%' }}>
                <Skeleton width="60%" height="0.8em" style={{ marginBottom: 'var(--space-2)' }} />
                <Skeleton width="40%" height="1.4em" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div>
          {summaryEntries.length > 0 && (
            <div className="grid grid-cols-4 mb-5">
              {summaryEntries.map((entry) => (
                <KPICard key={entry.key} label={entry.label} value={entry.value} formatter={MONEY_KEYS.has(entry.key) ? (v) => formatCurrency(v) : undefined} />
              ))}
            </div>
          )}

          {(trendRows.length > 0 || chartBreakdown) && (
            <div className={`grid mb-5 ${trendRows.length > 0 && chartBreakdown ? 'grid-cols-2' : 'grid-cols-1'}`}>
              {trendRows.length > 0 && (
                <div className="card">
                  <div className="card-header"><span className="card-title">{reportType === 'profit' ? t('dailyProfitTrend') : t('salesTrend')}</span></div>
                  <div className="card-body">
                    <LineChart
                      labels={trendRows.map((r) => new Date(r.label).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' }))}
                      values={trendRows.map((r) => Number(r.value))}
                      valueFormatter={formatCurrency}
                    />
                  </div>
                </div>
              )}
              {chartBreakdown && (
                <div className="card">
                  <div className="card-header"><span className="card-title">{chartBreakdown.title}</span></div>
                  <div className="card-body">
                    <BarChart
                      labels={chartBreakdown.rows.map((r) => r.label)}
                      values={chartBreakdown.rows.map((r) => Number(r.value))}
                      valueFormatter={formatCurrency}
                      horizontal
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {report?.financialSummary && (
            <div className="card mb-5">
              <div className="card-header"><span className="card-title">{t('financialSummary')}</span></div>
              <div className="card-body">
                <dl className="reports-financial-summary">
                  <div><dt>{t('totalRevenue')}</dt><dd>{formatCurrency(report.financialSummary.totalRevenue)}</dd></div>
                  <div><dt>{t('averageDailySales')}</dt><dd>{formatCurrency(report.financialSummary.averageDailySales)}</dd></div>
                  {report.financialSummary.averageInvoice != null && (
                    <div><dt>{t('averageInvoice')}</dt><dd>{formatCurrency(report.financialSummary.averageInvoice)}</dd></div>
                  )}
                  <div><dt>{t('highestSalesDay')}</dt><dd>{report.financialSummary.highestSalesDay.date} — {formatCurrency(report.financialSummary.highestSalesDay.value)}</dd></div>
                  <div><dt>{t('lowestSalesDay')}</dt><dd>{report.financialSummary.lowestSalesDay.date} — {formatCurrency(report.financialSummary.lowestSalesDay.value)}</dd></div>
                </dl>
              </div>
            </div>
          )}

          {Array.isArray(report?.financialSummary?.monthlyTrend) && (
            <div className="card mb-5">
              <div className="card-header"><span className="card-title">{t('monthlyTrend')}</span></div>
              <div className="card-body">
                <LineChart
                  labels={report.financialSummary.monthlyTrend.map((m) => m.month)}
                  values={report.financialSummary.monthlyTrend.map((m) => Number(m.value))}
                  valueFormatter={formatCurrency}
                />
              </div>
            </div>
          )}

          {/* report.analysis/recommendations are dynamic sentences generated
              server-side (backend/services/reportAnalysis.js) from live
              business data — translating that generated text would require
              either a `lang` param the API doesn't accept today or
              duplicating the analysis-authoring logic client-side, both out
              of scope for a frontend-only i18n rollout that must not change
              APIs or business logic. Only this section's own chrome
              (heading, icon) is localized; the analysis lines themselves
              display in whatever language the backend generated them in
              (currently always English). */}
          {Array.isArray(report?.analysis) && report.analysis.length > 0 && (
            <div className="card mb-5">
              <div className="card-header"><span className="card-title">{t('businessAnalysis')}</span></div>
              <div className="card-body">
                <ul className="reports-analysis-list">
                  {report.analysis.map((line) => <li key={line}>{line}</li>)}
                </ul>
              </div>
            </div>
          )}

          {Array.isArray(report?.recommendations) && report.recommendations.length > 0 && (
            <div className="card mb-5">
              <div className="card-header"><span className="card-title">{t('recommendations')}</span></div>
              <div className="card-body">
                <ul className="reports-recommendations-list">
                  {report.recommendations.map((line) => (
                    <li key={line}><FiTrendingUp aria-hidden="true" /> {line}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {config.breakdowns.map((breakdown) => (
            <BreakdownTable
              key={breakdown.key}
              title={t(breakdown.titleKey)}
              labelHeader={t(breakdown.labelHeaderKey)}
              rows={report?.[breakdown.key]}
              canExport={canExport}
              onExport={(title, rows) => downloadCsv(`${t(config.labelKey)}-${title}-${filters.dateFrom}-${filters.dateTo}`, rows)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default ReportsCenter;
