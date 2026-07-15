import { formatCurrency, formatNumber } from '../../utils/formatCurrency';
import AnimatedCounter from './AnimatedCounter';

function TodaysSummaryCard({ kpis, loading }) {
  const todaySales = Number(kpis?.todaySales) || 0;
  const todayOrders = Number(kpis?.todayOrders) || 0;
  const todayExpenses = Number(kpis?.todayExpenses) || 0;
  const todayProfit = Number(kpis?.todayProfit) || 0;
  const carsWashed = Number(kpis?.todayCarwashCount) || 0;
  const averageSale = todayOrders > 0 ? todaySales / todayOrders : 0;
  const netIncome = todayProfit - todayExpenses;

  const rows = [
    { label: "Today's Sales", value: todaySales, formatter: formatCurrency },
    { label: "Today's Orders", value: todayOrders, formatter: formatNumber },
    { label: "Today's Expenses", value: todayExpenses, formatter: formatCurrency },
    { label: "Today's Profit", value: todayProfit, formatter: formatCurrency },
    { label: 'Cars Washed', value: carsWashed, formatter: formatNumber },
    { label: 'Average Sale', value: averageSale, formatter: formatCurrency },
    { label: 'Net Income', value: netIncome, formatter: formatCurrency },
  ];

  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Today&apos;s Summary</span></div>
      <div className="card-body">
        <ul className="todays-summary-list">
          {rows.map((row) => (
            <li key={row.label} className="todays-summary-row">
              <span className="todays-summary-label">{row.label}</span>
              <span className="todays-summary-value">
                {loading ? '—' : <AnimatedCounter value={row.value} formatter={row.formatter} />}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export default TodaysSummaryCard;
