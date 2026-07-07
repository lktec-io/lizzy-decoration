import { useEffect, useState } from 'react';
import {
  FiDollarSign, FiTrendingUp, FiUsers, FiTruck, FiBox, FiArchive,
  FiAlertTriangle, FiCreditCard, FiDroplet, FiRepeat, FiShoppingCart,
} from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import ActivityTimeline from '../../components/dashboard/ActivityTimeline';
import QuickActions from '../../components/dashboard/QuickActions';
import LineChart from '../../components/charts/LineChart';
import BarChart from '../../components/charts/BarChart';
import DoughnutChart from '../../components/charts/DoughnutChart';
import { CHART_COLORS } from '../../components/charts/chartTheme';
import * as dashboardService from '../../services/dashboardService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import '../../styles/pages/Dashboard.css';

const KPI_DEFS = [
  { key: 'todaySales', label: "Today's Sales", icon: FiDollarSign, money: true },
  { key: 'monthlySales', label: 'Monthly Sales', icon: FiTrendingUp, money: true },
  { key: 'todayProfit', label: "Today's Profit", icon: FiTrendingUp, money: true },
  { key: 'monthlyProfit', label: 'Monthly Profit', icon: FiTrendingUp, money: true },
  { key: 'totalCustomers', label: 'Total Customers', icon: FiUsers, money: false },
  { key: 'totalSuppliers', label: 'Total Suppliers', icon: FiTruck, money: false },
  { key: 'totalProducts', label: 'Total Products', icon: FiBox, money: false },
  { key: 'inventoryValue', label: 'Inventory Value', icon: FiArchive, money: true },
  { key: 'lowStockCount', label: 'Low Stock Items', icon: FiAlertTriangle, money: false },
  { key: 'todayExpenses', label: "Today's Expenses", icon: FiCreditCard, money: true },
  { key: 'monthlyExpenses', label: 'Monthly Expenses', icon: FiCreditCard, money: true },
  { key: 'carwashRevenue', label: 'Car Wash Revenue', icon: FiDroplet, money: true },
  { key: 'pendingTransfers', label: 'Pending Transfers', icon: FiRepeat, money: false },
  { key: 'pendingPurchases', label: 'Pending Purchases', icon: FiShoppingCart, money: false },
];

const CHART_TYPES = ['sales-trend', 'revenue-trend', 'expense-trend', 'profit-trend', 'top-products', 'branch-performance', 'inventory-summary', 'carwash-summary'];

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState({});
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [kpiResult, activityResult, ...chartResults] = await Promise.all([
          dashboardService.getKpis(),
          dashboardService.getActivity(10),
          ...CHART_TYPES.map((type) => dashboardService.getChart(type)),
        ]);

        if (cancelled) return;

        setKpis(kpiResult);
        setActivity(activityResult);
        const chartMap = {};
        CHART_TYPES.forEach((type, index) => {
          chartMap[type] = chartResults[index];
        });
        setCharts(chartMap);
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

  const trendChart = (type, label, color) => {
    const rows = charts[type] || [];
    return (
      <ChartCard title={label} loading={loading} empty={rows.length === 0} emptyMessage="No data for this period yet">
        <LineChart labels={rows.map((r) => r.date || r.month)} values={rows.map((r) => Number(r.value))} label={label} color={color} />
      </ChartCard>
    );
  };

  const topProducts = charts['top-products'] || [];
  const branchPerformance = charts['branch-performance'] || [];
  const inventorySummary = charts['inventory-summary'];
  const carwashSummary = charts['carwash-summary'] || [];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Executive overview of JOZZY Decoration &amp; Accessories</p>
        </div>
      </div>

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <div className="kpi-grid">
        {KPI_DEFS.map(({ key, label, icon, money }) => (
          <KPICard
            key={key}
            icon={icon}
            label={label}
            value={loading || !kpis ? 0 : kpis[key]}
            formatter={money ? (v) => formatCurrency(v) : (v) => formatNumber(v)}
          />
        ))}
      </div>

      <div className="chart-grid">
        {trendChart('sales-trend', 'Sales Trend', CHART_COLORS.gold)}
        {trendChart('revenue-trend', 'Revenue Trend', CHART_COLORS.info)}
        {trendChart('expense-trend', 'Expense Trend', CHART_COLORS.danger)}
        {trendChart('profit-trend', 'Monthly Profit', CHART_COLORS.success)}

        <ChartCard title="Top Selling Products" loading={loading} empty={topProducts.length === 0} emptyMessage="No sales recorded yet">
          <BarChart labels={topProducts.map((p) => p.name)} values={topProducts.map((p) => Number(p.quantity))} label="Units Sold" horizontal />
        </ChartCard>

        <ChartCard title="Branch Performance" loading={loading} empty={branchPerformance.length === 0} emptyMessage="No branches yet">
          <BarChart labels={branchPerformance.map((b) => b.name)} values={branchPerformance.map((b) => Number(b.value))} label="Monthly Sales" />
        </ChartCard>

        <ChartCard
          title="Inventory Summary"
          loading={loading}
          empty={!inventorySummary || (inventorySummary.inStock + inventorySummary.lowStock + inventorySummary.outOfStock === 0)}
          emptyMessage="No inventory recorded yet"
        >
          {inventorySummary && (
            <DoughnutChart
              labels={['In Stock', 'Low Stock', 'Out of Stock']}
              values={[inventorySummary.inStock, inventorySummary.lowStock, inventorySummary.outOfStock]}
            />
          )}
        </ChartCard>

        <ChartCard title="Car Wash Summary" loading={loading} empty={carwashSummary.every((s) => Number(s.value) === 0)} emptyMessage="No car wash revenue yet">
          <DoughnutChart labels={carwashSummary.map((s) => s.name)} values={carwashSummary.map((s) => Number(s.value))} />
        </ChartCard>
      </div>

      <div className="dashboard-bottom-grid">
        <div className="card">
          <div className="card-header"><span className="card-title">Recent Activity</span></div>
          <div className="card-body">
            <ActivityTimeline items={activity} loading={loading} />
          </div>
        </div>

        <div className="card">
          <div className="card-header"><span className="card-title">Quick Actions</span></div>
          <div className="card-body">
            <QuickActions />
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
