import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiDollarSign, FiTrendingUp, FiBox, FiUsers, FiCreditCard, FiDroplet, FiActivity,
} from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import DashboardHero from '../../components/dashboard/DashboardHero';
import QuickActions from '../../components/dashboard/QuickActions';
import TrendBars from '../../components/dashboard/TrendBars';
import Table from '../../components/common/Table';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import DoughnutChart from '../../components/charts/DoughnutChart';
import * as dashboardService from '../../services/dashboardService';
import * as saleService from '../../services/saleService';
import * as inventoryService from '../../services/inventoryService';
import * as customerService from '../../services/customerService';
import * as expenseService from '../../services/expenseService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import '../../styles/pages/Dashboard.css';

// The 6 KPI cards requested for a Sales Management dashboard (Today's Sales,
// Monthly Sales, Products, Customers, Expenses, Car Wash) — each with its
// own accent hue so KPICard's gradient/glow/accent-bar all read distinctly.
const KPI_DEFS = [
  { key: 'todaySales', label: "Today's Sales", icon: FiDollarSign, money: true, subtitle: 'Across all branches', accent: '#2F6BFF' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: FiTrendingUp, money: true, subtitle: 'This calendar month', accent: '#10B981' },
  { key: 'totalProducts', label: 'Products', icon: FiBox, money: false, subtitle: 'Active catalog items', accent: '#8B5CF6' },
  { key: 'totalCustomers', label: 'Customers', icon: FiUsers, money: false, subtitle: 'Registered accounts', accent: '#14B8A6' },
  { key: 'monthlyExpenses', label: 'Expenses', icon: FiCreditCard, money: true, subtitle: 'This calendar month', accent: '#F59E0B' },
  { key: 'carwashRevenue', label: 'Car Wash', icon: FiDroplet, money: true, subtitle: 'Service revenue today', accent: '#06B6D4' },
];

const CHART_TYPES = ['branch-performance', 'top-products', 'inventory-summary', 'sales-trend', 'carwash-summary'];

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

// Nested stagger for the KPI row specifically — each card fades/scales up
// slightly after the previous one, rather than the whole row appearing as
// one flat block (which is all STAGGER_ITEM alone would give it). Variant
// names match STAGGER_CONTAINER/STAGGER_ITEM's ('hidden'/'show') so Framer
// Motion's propagation carries the parent's animate="show" straight down
// into this nested orchestration with no extra initial/animate props needed.
const KPI_CARD_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const KPI_CARD_ITEM = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

// inventory-summary comes back as a single {outOfStock, lowStock, inStock}
// object (unlike every other chart type, which is already an array) — this
// is the one shape transform DoughnutChart needs done for it.
function toInventoryDistribution(summary) {
  if (!summary) return [];
  return [
    { label: 'In Stock', value: Number(summary.inStock) || 0 },
    { label: 'Low Stock', value: Number(summary.lowStock) || 0 },
    { label: 'Out of Stock', value: Number(summary.outOfStock) || 0 },
  ];
}

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState({});
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [recentCustomers, setRecentCustomers] = useState([]);
  const [recentExpenses, setRecentExpenses] = useState([]);
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [kpiResult, ...chartResults] = await Promise.all([
          dashboardService.getKpis(),
          ...CHART_TYPES.map((type) => dashboardService.getChart(type)),
        ]);
        // Each of these hits a different module's own permission gate
        // (sales.view / inventory.view / customers.view / expenses.view) —
        // a role scoped to fewer modules (e.g. Store Keeper) can legally
        // lack access to one of them. allSettled means one 403 only empties
        // that section instead of blanking the whole dashboard.
        const [salesResult, lowStockResult, customersResult, expensesResult, activityResult] = await Promise.allSettled([
          saleService.listSales({ limit: 10 }),
          inventoryService.listInventory({ lowStock: true, limit: 10 }),
          customerService.listCustomers({ limit: 5 }),
          expenseService.listExpenses({ limit: 5 }),
          dashboardService.getActivity(8),
        ]);

        if (cancelled) return;

        setKpis(kpiResult);
        const chartMap = {};
        CHART_TYPES.forEach((type, index) => {
          chartMap[type] = chartResults[index];
        });
        setCharts(chartMap);
        setRecentSales(salesResult.status === 'fulfilled' ? salesResult.value.items : []);
        setLowStockProducts(lowStockResult.status === 'fulfilled' ? lowStockResult.value.items : []);
        setRecentCustomers(customersResult.status === 'fulfilled' ? customersResult.value.items : []);
        setRecentExpenses(expensesResult.status === 'fulfilled' ? expensesResult.value.items : []);
        setActivity(activityResult.status === 'fulfilled' ? activityResult.value : []);
      } catch {
        if (!cancelled) setError('Failed to load dashboard data.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const branchPerformance = charts['branch-performance'] || [];
  const topProducts = charts['top-products'] || [];
  const inventoryDistribution = toInventoryDistribution(charts['inventory-summary']);
  const salesTrend = charts['sales-trend'] || [];
  const carwashSummary = charts['carwash-summary'] || [];

  const recentSalesColumns = [
    { key: 'sale_number', label: 'Sale #' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
  ];

  const lowStockColumns = [
    { key: 'product_name', label: 'Product', render: (row) => <div>{row.product_name}<div className="text-xs text-secondary">{row.product_code}</div></div> },
    { key: 'branch_name', label: 'Branch' },
    { key: 'quantity', label: 'Stock', render: (row) => formatNumber(row.quantity) },
    { key: 'min_stock', label: 'Min Stock', render: (row) => formatNumber(row.min_stock) },
  ];

  const recentCustomersColumns = [
    { key: 'name', label: 'Name', render: (row) => `${row.first_name} ${row.last_name}` },
    { key: 'phone', label: 'Phone' },
    { key: 'created_at', label: 'Registered', render: (row) => formatDate(row.created_at) },
  ];

  const recentExpensesColumns = [
    { key: 'expense_date', label: 'Date', render: (row) => formatDate(row.expense_date) },
    { key: 'category_name', label: 'Category' },
    { key: 'amount', label: 'Amount', render: (row) => formatCurrency(row.amount) },
  ];

  const carwashColumns = [
    { key: 'name', label: 'Service' },
    { key: 'value', label: 'Revenue', render: (row) => formatCurrency(row.value) },
  ];

  return (
    <div>
      <DashboardHero />

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        <motion.div variants={STAGGER_ITEM}>
          <QuickActions />
        </motion.div>

        <motion.div className="kpi-grid" variants={KPI_CARD_STAGGER}>
          {KPI_DEFS.map(({ key, label, icon, money, subtitle, accent }) => (
            <motion.div key={key} variants={KPI_CARD_ITEM}>
              <KPICard
                icon={icon}
                label={label}
                value={loading || !kpis ? 0 : kpis[key]}
                formatter={money ? (v) => formatCurrency(v) : (v) => formatNumber(v)}
                subtitle={subtitle}
                accent={accent}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div className="card dashboard-trend-card" variants={STAGGER_ITEM}>
          <div className="card-header"><span className="card-title">Sales Trend</span></div>
          <div className="card-body">
            {loading ? (
              <Skeleton height={160} />
            ) : salesTrend.length === 0 ? (
              <div className="flex items-center justify-center" style={{ height: 160 }}>
                <EmptyState icon={FiTrendingUp} title="No sales recorded yet" />
              </div>
            ) : (
              <TrendBars data={salesTrend} valueFormatter={formatCurrency} />
            )}
          </div>
        </motion.div>

        <motion.div className="chart-grid" variants={STAGGER_ITEM}>
          <ChartCard title="Revenue Breakdown" loading={loading} empty={branchPerformance.length === 0} emptyMessage="No branches yet">
            <DoughnutChart data={branchPerformance.map((b) => ({ label: b.name, value: Number(b.value) }))} valueFormatter={formatCurrency} />
          </ChartCard>

          <ChartCard title="Sales Distribution" loading={loading} empty={topProducts.length === 0} emptyMessage="No sales recorded yet">
            <DoughnutChart data={topProducts.map((p) => ({ label: p.name, value: Number(p.quantity) }))} valueFormatter={formatNumber} />
          </ChartCard>

          <ChartCard title="Inventory Distribution" loading={loading} empty={inventoryDistribution.every((d) => d.value === 0)} emptyMessage="No inventory data yet">
            <DoughnutChart data={inventoryDistribution} valueFormatter={formatNumber} />
          </ChartCard>
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Sales</span></div>
            <Table columns={recentSalesColumns} rows={recentSales} loading={loading} emptyMessage="No sales recorded yet" />
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Low Stock Products</span></div>
            <Table columns={lowStockColumns} rows={lowStockProducts} loading={loading} emptyMessage="No low-stock products right now" />
          </div>
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Customers</span></div>
            <Table columns={recentCustomersColumns} rows={recentCustomers} loading={loading} emptyMessage="No customers yet" />
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Recent Expenses</span></div>
            <Table columns={recentExpensesColumns} rows={recentExpenses} loading={loading} emptyMessage="No expenses recorded yet" />
          </div>
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <div className="card">
            <div className="card-header"><span className="card-title">Car Wash Summary</span></div>
            <Table columns={carwashColumns} rows={carwashSummary} rowKey="name" loading={loading} emptyMessage="No car wash activity this month" />
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Recent Activity</span></div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={220} />
              ) : activity.length === 0 ? (
                <EmptyState icon={FiActivity} title="No recent activity" />
              ) : (
                <ul className="activity-feed">
                  {activity.map((item) => (
                    <li key={item.id} className="activity-feed-item">
                      <span className="activity-feed-dot" aria-hidden="true" />
                      <div className="activity-feed-body">
                        <span className="activity-feed-text">{item.description}</span>
                        <span className="activity-feed-time">
                          {item.first_name ? `${item.first_name} ${item.last_name} · ` : ''}
                          {formatDateTime(item.created_at)}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
