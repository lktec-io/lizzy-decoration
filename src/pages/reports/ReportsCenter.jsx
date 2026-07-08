import { useEffect, useMemo, useState } from 'react';
import { FiPrinter, FiDownload } from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import { usePermission } from '../../hooks/usePermission';
import * as reportService from '../../services/reportService';
import * as branchService from '../../services/branchService';
import * as categoryService from '../../services/categoryService';
import * as supplierService from '../../services/supplierService';
import { formatCurrency } from '../../utils/formatCurrency';
import { downloadCsv } from '../../utils/exportCsv';
import '../../styles/pages/Reports.css';

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
}

const MONEY_KEYS = new Set([
  'value', 'totalRevenue', 'totalAmount', 'totalDiscount', 'averageSale', 'totalValue',
  'totalPurchased', 'totalPaid', 'outstandingBalance', 'totalRefund', 'salesRevenue',
  'carwashRevenue', 'expenses', 'net', 'cogs', 'grossProfit', 'netProfit',
]);

const REPORT_CONFIGS = {
  sales: {
    label: 'Sales', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalSales: 'Total Sales', totalRevenue: 'Total Revenue', totalDiscount: 'Total Discount', averageSale: 'Average Sale' },
    breakdowns: [{ key: 'byDay', title: 'By Day', labelHeader: 'Date' }, { key: 'byBranch', title: 'By Branch', labelHeader: 'Branch' }],
  },
  inventory: {
    label: 'Inventory', filters: ['branchId', 'categoryId'],
    summary: { totalRecords: 'Total Records', totalValue: 'Total Value', lowStock: 'Low Stock', outOfStock: 'Out of Stock' },
    breakdowns: [{ key: 'byCategory', title: 'By Category', labelHeader: 'Category' }],
  },
  purchases: {
    label: 'Purchases', filters: ['dateFrom', 'dateTo', 'branchId', 'supplierId'],
    summary: { totalPurchases: 'Total Purchases', totalAmount: 'Total Amount' },
    breakdowns: [{ key: 'bySupplier', title: 'By Supplier', labelHeader: 'Supplier' }],
  },
  expenses: {
    label: 'Expenses', filters: ['dateFrom', 'dateTo', 'branchId', 'categoryId'],
    summary: { totalExpenses: 'Total Expenses', totalAmount: 'Total Amount' },
    breakdowns: [{ key: 'byCategory', title: 'By Category', labelHeader: 'Category' }],
  },
  carwash: {
    label: 'Car Wash', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalTransactions: 'Total Transactions', totalRevenue: 'Total Revenue' },
    breakdowns: [{ key: 'byService', title: 'Popular Services', labelHeader: 'Service' }],
  },
  profit: {
    label: 'Profit', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: {
      salesRevenue: 'Sales Revenue', carwashRevenue: 'Car Wash Revenue', totalRevenue: 'Total Revenue',
      cogs: 'Cost of Goods Sold', grossProfit: 'Gross Profit', expenses: 'Expenses', netProfit: 'Net Profit',
    },
    breakdowns: [{ key: 'byDay', title: 'By Day', labelHeader: 'Date' }],
  },
  branches: {
    label: 'Branches', filters: ['dateFrom', 'dateTo'],
    breakdowns: [{ key: 'byBranch', title: 'Branch Comparison', labelHeader: 'Branch' }],
  },
  products: {
    label: 'Products', filters: ['dateFrom', 'dateTo', 'branchId', 'categoryId'],
    breakdowns: [{ key: 'topProducts', title: 'Top Products', labelHeader: 'Product' }],
  },
  customers: {
    label: 'Customers', filters: ['dateFrom', 'dateTo', 'branchId'],
    breakdowns: [{ key: 'topCustomers', title: 'Top Customers', labelHeader: 'Customer' }],
  },
  suppliers: {
    label: 'Suppliers', filters: [],
    breakdowns: [{ key: 'bySupplier', title: 'Supplier Balances', labelHeader: 'Supplier' }],
  },
  returns: {
    label: 'Returns', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalReturns: 'Total Returns', totalRefund: 'Total Refund' },
    breakdowns: [{ key: 'byReason', title: 'By Reason', labelHeader: 'Reason' }],
  },
  transfers: {
    label: 'Transfers', filters: ['dateFrom', 'dateTo', 'branchId'],
    summary: { totalTransfers: 'Total Transfers' },
    breakdowns: [{ key: 'byStatus', title: 'By Status', labelHeader: 'Status' }],
  },
};

function humanize(key) {
  const result = key.replace(/([A-Z])/g, ' $1');
  return result.charAt(0).toUpperCase() + result.slice(1);
}

function renderCell(key, value) {
  if (typeof value !== 'number') return value;
  return MONEY_KEYS.has(key) ? formatCurrency(value) : value.toLocaleString();
}

function BreakdownTable({ title, labelHeader, rows, onExport, canExport }) {
  if (!rows || rows.length === 0) {
    return (
      <div className="card mb-5">
        <div className="card-header"><span className="card-title">{title}</span></div>
        <div className="card-body"><p className="text-sm text-secondary">No data for the selected filters.</p></div>
      </div>
    );
  }

  const columns = Object.keys(rows[0]).filter((c) => c !== 'id' && c !== 'code');

  return (
    <div className="card mb-5">
      <div className="card-header">
        <span className="card-title">{title}</span>
        {canExport && (
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => onExport(title, rows)}>
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
  const canExport = usePermission('reports.export');
  const [reportType, setReportType] = useState('sales');
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [filters, setFilters] = useState({ dateFrom: firstOfMonthIso(), dateTo: todayIso(), branchId: '', categoryId: '', supplierId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const config = REPORT_CONFIGS[reportType];

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
    categoryService.listActiveCategories().then(setCategories);
    supplierService.listActiveSuppliers().then(setSuppliers);
  }, []);

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
      .catch(() => setError('Failed to load report.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the selected report on filter/type change is standard data-fetching, not derived state
    loadReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- config is derived from reportType, individual filter fields tracked explicitly below
  }, [reportType, filters.dateFrom, filters.dateTo, filters.branchId, filters.categoryId, filters.supplierId]);

  const summaryEntries = useMemo(() => {
    if (!report?.summary || !config.summary) return [];
    return Object.entries(config.summary).map(([key, label]) => ({ key, label, value: report.summary[key] }));
  }, [report, config]);

  return (
    <div className="reports-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Reports Center</h1>
          <p className="page-subtitle">Live reports generated directly from current data — no hardcoded values</p>
        </div>
        {canExport && (
          <div className="page-actions">
            <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
              <FiPrinter aria-hidden="true" /> Print
            </button>
          </div>
        )}
      </div>

      <div className="reports-type-pills">
        {Object.entries(REPORT_CONFIGS).map(([key, cfg]) => (
          <button
            key={key}
            type="button"
            className={`reports-type-pill ${reportType === key ? 'reports-type-pill-active' : ''}`}
            onClick={() => setReportType(key)}
          >
            {cfg.label}
          </button>
        ))}
      </div>

      <div className="card mb-5">
        <div className="card-body reports-filter-bar">
          {config.filters.includes('dateFrom') && (
            <div className="form-group">
              <label className="form-label" htmlFor="dateFrom">From</label>
              <input id="dateFrom" type="date" className="form-control" value={filters.dateFrom} onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))} />
            </div>
          )}
          {config.filters.includes('dateTo') && (
            <div className="form-group">
              <label className="form-label" htmlFor="dateTo">To</label>
              <input id="dateTo" type="date" className="form-control" value={filters.dateTo} onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))} />
            </div>
          )}
          {config.filters.includes('branchId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="branchId">Branch</label>
              <select id="branchId" className="form-control" value={filters.branchId} onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value }))}>
                <option value="">All Branches</option>
                {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('categoryId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="categoryId">Category</label>
              <select id="categoryId" className="form-control" value={filters.categoryId} onChange={(e) => setFilters((prev) => ({ ...prev, categoryId: e.target.value }))}>
                <option value="">All Categories</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          )}
          {config.filters.includes('supplierId') && (
            <div className="form-group">
              <label className="form-label" htmlFor="supplierId">Supplier</label>
              <select id="supplierId" className="form-control" value={filters.supplierId} onChange={(e) => setFilters((prev) => ({ ...prev, supplierId: e.target.value }))}>
                <option value="">All Suppliers</option>
                {suppliers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          )}
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      {loading ? (
        <div className="flex items-center justify-center p-6"><span className="spinner" aria-label="Loading" /></div>
      ) : (
        <>
          {summaryEntries.length > 0 && (
            <div className="grid grid-cols-4 mb-5">
              {summaryEntries.map((entry) => (
                <KPICard key={entry.key} label={entry.label} value={entry.value} formatter={MONEY_KEYS.has(entry.key) ? (v) => formatCurrency(v) : undefined} />
              ))}
            </div>
          )}

          {config.breakdowns.map((breakdown) => (
            <BreakdownTable
              key={breakdown.key}
              title={breakdown.title}
              labelHeader={breakdown.labelHeader}
              rows={report?.[breakdown.key]}
              canExport={canExport}
              onExport={(title, rows) => downloadCsv(`${config.label}-${title}-${filters.dateFrom}-${filters.dateTo}`, rows)}
            />
          ))}
        </>
      )}
    </div>
  );
}

export default ReportsCenter;
