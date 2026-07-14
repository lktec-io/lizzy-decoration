import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiAlertTriangle, FiDroplet, FiBarChart2 } from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import DashboardHero from '../../components/dashboard/DashboardHero';
import Table from '../../components/common/Table';
import DoughnutChart from '../../components/charts/DoughnutChart';
import * as dashboardService from '../../services/dashboardService';
import * as saleService from '../../services/saleService';
import * as inventoryService from '../../services/inventoryService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import '../../styles/pages/Dashboard.css';

// Exactly the items in the signed proposal's "1. Main Dashboard" section
// (Daily Sales, Monthly Sales, Business Profit Summary, Low Stock Alerts,
// Car Wash Activity Summary, Branch Performance Statistics, Top Selling
// Products, Recent Transactions, Inventory Notifications), plus a Branch
// Summary card derived from the already-fetched branch-performance chart
// data (branch count + top branch) rather than any new backend field.
// Accent colors are fixed per card (never cycled), each a distinct hue so
// every card reads with its own identity at a glance: blue, green,
// emerald, amber, teal, purple.
const KPI_DEFS = [
  { key: 'todaySales', label: "Today's Sales", icon: FiDollarSign, money: true, subtitle: 'Across all branches', accent: '#2F6BFF' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: FiTrendingUp, money: true, subtitle: 'This calendar month', accent: '#10B981' },
  { key: 'todayProfit', label: 'Profit', icon: FiTrendingUp, money: true, subtitle: 'Net of cost & expenses', accent: '#059669' },
  { key: 'lowStockCount', label: 'Low Stock', icon: FiAlertTriangle, money: false, subtitle: 'Products needing restock', accent: '#F59E0B' },
  { key: 'carwashRevenue', label: 'Car Wash Today', icon: FiDroplet, money: true, subtitle: 'Service revenue', accent: '#14B8A6' },
];

const CHART_TYPES = ['branch-performance', 'top-products'];

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

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState({});
  const [recentSales, setRecentSales] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
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
        const [salesResult, lowStockResult] = await Promise.all([
          saleService.listSales({ limit: 10 }),
          inventoryService.listInventory({ lowStock: true, limit: 10 }),
        ]);

        if (cancelled) return;

        setKpis(kpiResult);
        const chartMap = {};
        CHART_TYPES.forEach((type, index) => {
          chartMap[type] = chartResults[index];
        });
        setCharts(chartMap);
        setRecentSales(salesResult.items);
        setLowStockProducts(lowStockResult.items);
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
  const topBranch = branchPerformance.length
    ? [...branchPerformance].sort((a, b) => Number(b.value) - Number(a.value))[0]
    : null;

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

  return (
    <div>
      <DashboardHero />

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show">
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
          <motion.div variants={KPI_CARD_ITEM}>
            <KPICard
              icon={FiBarChart2}
              label="Branch Summary"
              value={loading ? 0 : branchPerformance.length}
              formatter={(v) => formatNumber(v)}
              subtitle={topBranch ? `Top: ${topBranch.name}` : 'No branch data yet'}
              accent="#8B5CF6"
            />
          </motion.div>
        </motion.div>

        <motion.div className="chart-grid" variants={STAGGER_ITEM}>
          <ChartCard title="Branch Performance" loading={loading} empty={branchPerformance.length === 0} emptyMessage="No branches yet">
            <DoughnutChart data={branchPerformance.map((b) => ({ label: b.name, value: Number(b.value) }))} valueFormatter={formatCurrency} />
          </ChartCard>

          <ChartCard title="Top Selling Products" loading={loading} empty={topProducts.length === 0} emptyMessage="No sales recorded yet">
            <DoughnutChart data={topProducts.map((p) => ({ label: p.name, value: Number(p.quantity) }))} valueFormatter={formatNumber} />
          </ChartCard>
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <div className="card">
            <div className="card-header"><span className="card-title">Recent Transactions</span></div>
            <Table columns={recentSalesColumns} rows={recentSales} loading={loading} emptyMessage="No sales recorded yet" />
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Inventory Notifications</span></div>
            <Table columns={lowStockColumns} rows={lowStockProducts} loading={loading} emptyMessage="No low-stock products right now" />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
