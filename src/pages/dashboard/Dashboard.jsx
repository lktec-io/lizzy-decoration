import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  FiDollarSign, FiTrendingUp, FiShoppingBag, FiAlertTriangle, FiDroplet, FiActivity,
  FiUserPlus, FiCreditCard, FiShoppingCart,
} from 'react-icons/fi';
import KPICard from '../../components/dashboard/KPICard';
import ChartCard from '../../components/dashboard/ChartCard';
import DashboardHero from '../../components/dashboard/DashboardHero';
import QuickActions from '../../components/dashboard/QuickActions';
import SalesTrendCard from '../../components/dashboard/SalesTrendCard';
import TopProductsCard from '../../components/dashboard/TopProductsCard';
import LowStockAlertCard from '../../components/dashboard/LowStockAlertCard';
import TodaysSummaryCard from '../../components/dashboard/TodaysSummaryCard';
import SystemStatusCard from '../../components/dashboard/SystemStatusCard';
import EmptyState from '../../components/common/EmptyState';
import Skeleton from '../../components/common/Skeleton';
import DoughnutChart from '../../components/charts/DoughnutChart';
import BarChart from '../../components/charts/BarChart';
import * as dashboardService from '../../services/dashboardService';
import * as inventoryService from '../../services/inventoryService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import '../../styles/pages/Dashboard.css';

// The 6 KPI cards requested for this sprint — a different set from the
// previous dashboard round (that one covered Products/Customers/generic
// Expenses; this one is explicitly sales-motion-focused). Each accent is a
// distinct hue with no repeats, per spec.
const KPI_DEFS = [
  { key: 'todaySales', label: "Today's Sales", icon: FiDollarSign, formatter: formatCurrency, subtitle: 'Across all branches', accent: '#10B981' },
  { key: 'monthlySales', label: 'Monthly Sales', icon: FiTrendingUp, formatter: formatCurrency, subtitle: 'This calendar month', accent: '#2F6BFF' },
  { key: 'monthlyProfit', label: 'Monthly Profit', icon: FiTrendingUp, formatter: formatCurrency, subtitle: 'Net of cost this month', accent: '#8B5CF6' },
  { key: 'todayOrders', label: "Today's Orders", icon: FiShoppingBag, formatter: formatNumber, subtitle: 'Completed sales today', accent: '#F59E0B' },
  { key: 'lowStockCount', label: 'Low Stock Products', icon: FiAlertTriangle, formatter: formatNumber, subtitle: 'Need restocking', accent: '#EF4444' },
  { key: 'carwashRevenue', label: "Today's Car Wash", icon: FiDroplet, formatter: formatCurrency, subtitle: 'Service revenue today', accent: '#06B6D4' },
];

const CHART_TYPES = ['branch-performance', 'top-products', 'inventory-summary', 'carwash-summary', 'payment-status', 'revenue-vs-expenses'];

const ACTIVITY_TYPE_META = {
  sale: { icon: FiDollarSign, className: 'activity-feed-dot-sale' },
  customer: { icon: FiUserPlus, className: 'activity-feed-dot-customer' },
  expense: { icon: FiCreditCard, className: 'activity-feed-dot-expense' },
  carwash_transaction: { icon: FiDroplet, className: 'activity-feed-dot-carwash' },
  purchase_order: { icon: FiShoppingCart, className: 'activity-feed-dot-purchase' },
};

const STAGGER_CONTAINER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};

const STAGGER_ITEM = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

const KPI_CARD_STAGGER = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const KPI_CARD_ITEM = {
  hidden: { opacity: 0, y: 16, scale: 0.96 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function toInventoryDistribution(summary) {
  if (!summary) return [];
  return [
    { label: 'Available', value: Number(summary.inStock) || 0 },
    { label: 'Low Stock', value: Number(summary.lowStock) || 0 },
    { label: 'Out Of Stock', value: Number(summary.outOfStock) || 0 },
  ];
}

// Today's Sales is the one KPI with a real, honest day-over-day comparison
// readily available (the sales-trend series already includes yesterday) —
// every other card is left without a trend badge rather than fabricate one.
function computeTodayTrend(salesTrend) {
  if (!salesTrend || salesTrend.length < 2) return null;
  const today = Number(salesTrend[salesTrend.length - 1]?.value) || 0;
  const yesterday = Number(salesTrend[salesTrend.length - 2]?.value) || 0;
  if (yesterday === 0) return null;
  const percent = ((today - yesterday) / yesterday) * 100;
  return { percent, direction: percent >= 0 ? 'up' : 'down' };
}

function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [charts, setCharts] = useState({});
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [activity, setActivity] = useState([]);
  const [todayTrend, setTodayTrend] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [kpiResult, ...chartResults] = await Promise.all([
          dashboardService.getKpis(),
          ...CHART_TYPES.map((type) => dashboardService.getChart(type)),
          dashboardService.getChart('sales-trend', { range: 'week' }),
        ]);
        const [lowStockResult, activityResult] = await Promise.allSettled([
          inventoryService.listInventory({ lowStock: true, limit: 10 }),
          dashboardService.getActivity(10),
        ]);

        if (cancelled) return;

        setKpis(kpiResult);
        const chartMap = {};
        CHART_TYPES.forEach((type, index) => {
          chartMap[type] = chartResults[index];
        });
        setCharts(chartMap);
        setTodayTrend(computeTodayTrend(chartResults[CHART_TYPES.length]));
        setLowStockProducts(lowStockResult.status === 'fulfilled' ? lowStockResult.value.items : []);
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
  const carwashSummary = charts['carwash-summary'] || [];
  const paymentStatus = charts['payment-status'] || [];
  const revenueVsExpenses = charts['revenue-vs-expenses'] || [];

  return (
    <div>
      <DashboardHero />

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <motion.div variants={STAGGER_CONTAINER} initial="hidden" animate="show">
        <motion.div className="kpi-grid" variants={KPI_CARD_STAGGER}>
          {KPI_DEFS.map(({ key, label, icon, formatter, subtitle, accent }) => (
            <motion.div key={key} variants={KPI_CARD_ITEM}>
              <KPICard
                icon={icon}
                label={label}
                value={loading || !kpis ? 0 : kpis[key]}
                formatter={formatter}
                subtitle={subtitle}
                accent={accent}
                trend={key === 'todaySales' ? todayTrend : null}
              />
            </motion.div>
          ))}
        </motion.div>

        <motion.div variants={STAGGER_ITEM}>
          <SalesTrendCard />
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <ChartCard title="Revenue vs Expenses" loading={loading} empty={revenueVsExpenses.length === 0} emptyMessage="No financial activity yet">
            <BarChart
              labels={revenueVsExpenses.map((d) => new Date(d.date).toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' }))}
              datasets={[
                { label: 'Revenue', values: revenueVsExpenses.map((d) => d.revenue), color: '#10B981' },
                { label: 'Expenses', values: revenueVsExpenses.map((d) => d.expenses), color: '#EF4444' },
                { label: 'Profit', values: revenueVsExpenses.map((d) => d.profit), color: '#2F6BFF' },
              ]}
              valueFormatter={formatCurrency}
              height={280}
            />
          </ChartCard>

          <ChartCard title="Sales by Branch" loading={loading} empty={branchPerformance.length === 0} emptyMessage="No branches yet">
            <BarChart
              labels={branchPerformance.map((b) => b.name)}
              values={branchPerformance.map((b) => Number(b.value))}
              color="#2F6BFF"
              horizontal
              valueFormatter={formatCurrency}
              height={280}
            />
          </ChartCard>
        </motion.div>

        <motion.div className="chart-grid" variants={STAGGER_ITEM}>
          <ChartCard title="Payment Status" loading={loading} empty={paymentStatus.length === 0} emptyMessage="No payments recorded yet">
            <DoughnutChart data={paymentStatus.map((p) => ({ label: p.name, value: Number(p.value) }))} valueFormatter={formatCurrency} />
          </ChartCard>

          <ChartCard title="Inventory Status" loading={loading} empty={inventoryDistribution.every((d) => d.value === 0)} emptyMessage="No inventory data yet">
            <DoughnutChart data={inventoryDistribution} valueFormatter={formatNumber} />
          </ChartCard>

          <ChartCard title="Car Wash Services" loading={loading} empty={carwashSummary.length === 0} emptyMessage="No car wash activity this month">
            <DoughnutChart data={carwashSummary.map((c) => ({ label: c.name, value: Number(c.value) }))} valueFormatter={formatCurrency} />
          </ChartCard>
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <TopProductsCard products={topProducts} loading={loading} />
          <LowStockAlertCard products={lowStockProducts} loading={loading} />
        </motion.div>

        <motion.div className="dashboard-bottom-grid" variants={STAGGER_ITEM}>
          <TodaysSummaryCard kpis={kpis} loading={loading} />

          <div className="card">
            <div className="card-header"><span className="card-title">Recent Activity</span></div>
            <div className="card-body">
              {loading ? (
                <Skeleton height={220} />
              ) : activity.length === 0 ? (
                <EmptyState icon={FiActivity} title="No recent activity" />
              ) : (
                <ul className="activity-feed">
                  {activity.map((item) => {
                    const meta = ACTIVITY_TYPE_META[item.reference_type] || { icon: FiActivity, className: 'activity-feed-dot-default' };
                    const TypeIcon = meta.icon;
                    return (
                      <li key={item.id} className="activity-feed-item">
                        <span className={`activity-feed-dot ${meta.className}`} aria-hidden="true"><TypeIcon /></span>
                        <div className="activity-feed-body">
                          <span className="activity-feed-text">{item.description}</span>
                          <span className="activity-feed-time">
                            {item.first_name ? `${item.first_name} ${item.last_name} · ` : ''}
                            {formatDateTime(item.created_at)}
                          </span>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div variants={STAGGER_ITEM}>
          <QuickActions />
        </motion.div>

        <motion.div variants={STAGGER_ITEM}>
          <SystemStatusCard />
        </motion.div>
      </motion.div>
    </div>
  );
}

export default Dashboard;
