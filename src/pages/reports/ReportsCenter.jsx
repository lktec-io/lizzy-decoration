import { useEffect, useMemo, useState } from 'react';
import { FiPrinter, FiDownload, FiFileText, FiBarChart2 } from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import { usePermission } from '../../hooks/usePermission';
import * as reportService from '../../services/reportService';
import * as branchService from '../../services/branchService';
import * as categoryService from '../../services/categoryService';
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
  'salesRevenue', 'carwashRevenue', 'expenses', 'net', 'cogs', 'grossProfit', 'netProfit',
]);

// Exactly the reports named in the signed proposal's "12. Reporting Module"
// section (Sales, Inventory, Financial/Profit, Car Wash, Branch Reports) —
// the backend still supports the other report types (Purchases, Products,
// Customers, Suppliers, Returns, Transfers), they're just not surfaced here.
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
        <div className="card-body">
          <EmptyState icon={FiBarChart2} title="No data" description="No data for the selected filters." />
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
  const [filters, setFilters] = useState({ dateFrom: firstOfMonthIso(), dateTo: todayIso(), branchId: '', categoryId: '' });
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);

  const config = REPORT_CONFIGS[reportType];

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
    categoryService.listActiveCategories().then(setCategories);
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
  }, [reportType, filters.dateFrom, filters.dateTo, filters.branchId, filters.categoryId]);

  const summaryEntries = useMemo(() => {
    if (!report?.summary || !config.summary) return [];
    return Object.entries(config.summary).map(([key, label]) => ({ key, label, value: report.summary[key] }));
  }, [report, config]);

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      const params = {};
      config.filters.forEach((key) => {
        if (filters[key]) params[key] = filters[key];
      });
      await reportService.exportReportPdf(reportType, params);
    } catch {
      setError('Failed to export PDF.');
    } finally {
      setExportingPdf(false);
    }
  };

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
            <button type="button" className={`btn btn-secondary ${exportingPdf ? 'btn-loading' : ''}`} onClick={handleExportPdf} disabled={exportingPdf}>
              <FiFileText aria-hidden="true" /> Export PDF
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
        </div>
      </div>

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
