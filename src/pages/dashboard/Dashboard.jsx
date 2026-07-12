import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { FiDollarSign, FiTrendingUp, FiAlertTriangle, FiDroplet } from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import Table from '../../components/common/Table';
import BarChart from '../../components/charts/BarChart';
import * as dashboardService from '../../services/dashboardService';
import * as saleService from '../../services/saleService';
import * as inventoryService from '../../services/inventoryService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import '../../styles/pages/Dashboard.css';

// Exactly the 9 items in the signed proposal's "1. Main Dashboard" section:
// Daily Sales, Monthly Sales, Business Profit Summary, Low Stock Alerts,
// Car Wash Activity Summary, Branch Performance Statistics, Top Selling
// Products, Recent Transactions, Inventory Notifications. Nothing else.
const KPI_DEFS = [
  { key: 'todaySales', label: "Today's Sales", icon: FiDollarSign, money: true },
  { key: 'monthlySales', label: 'Monthly Sales', icon: FiTrendingUp, money: true },
  { key: 'todayProfit', label: 'Profit', icon: FiTrendingUp, money: true },
  { key: 'lowStockCount', label: 'Low Stock', icon: FiAlertTriangle, money: false },
  { key: 'carwashRevenue', label: 'Car Wash Today', icon: FiDroplet, money: true },
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
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of JOZZY Decoration &amp; Accessories</p>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        <motion.div className="kpi-grid" variants={STAGGER_ITEM}>
          {KPI_DEFS.map(({ key, label, icon, money }) => (
            <KPICard
              key={key}
              icon={icon}
              label={label}
              value={loading || !kpis ? 0 : kpis[key]}
              formatter={money ? (v) => formatCurrency(v) : (v) => formatNumber(v)}
            />
          ))}
        </motion.div>

        <motion.div className="chart-grid" variants={STAGGER_ITEM}>
          <ChartCard title="Branch Performance" loading={loading} empty={branchPerformance.length === 0} emptyMessage="No branches yet">
            <BarChart labels={branchPerformance.map((b) => b.name)} values={branchPerformance.map((b) => Number(b.value))} label="Monthly Sales" />
          </ChartCard>

          <ChartCard title="Top Selling Products" loading={loading} empty={topProducts.length === 0} emptyMessage="No sales recorded yet">
            <BarChart labels={topProducts.map((p) => p.name)} values={topProducts.map((p) => Number(p.quantity))} label="Units Sold" horizontal />
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
