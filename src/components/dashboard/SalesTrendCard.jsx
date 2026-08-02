import { useEffect, useState } from 'react';
import { FiTrendingUp } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import LineChart from '../charts/LineChart';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';
import * as dashboardService from '../../services/dashboardService';
import { formatCurrency } from '../../utils/formatCurrency';

const RANGES = [
  { key: 'today', labelKey: 'ranges.today' },
  { key: 'week', labelKey: 'ranges.week' },
  { key: 'month', labelKey: 'ranges.month' },
  { key: 'year', labelKey: 'ranges.year' },
];

function formatLabel(dateStr, range) {
  const date = new Date(dateStr);
  if (range === 'today') return date.toLocaleTimeString('en-TZ', { hour: '2-digit' });
  if (range === 'year') return date.toLocaleDateString('en-TZ', { month: 'short' });
  return date.toLocaleDateString('en-TZ', { day: 'numeric', month: 'short' });
}

function SalesTrendCard() {
  const { t } = useTranslation('dashboard');
  const [range, setRange] = useState('week');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- fetching the trend on range-tab change is standard data-fetching, not derived state
    setLoading(true);
    dashboardService.getChart('sales-trend', { range }).then((result) => {
      if (!cancelled) {
        setData(result || []);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [range]);

  return (
    <div className="card dashboard-trend-card">
      <div className="card-header">
        <span className="card-title">{t('salesTrend')}</span>
        <div className="dashboard-range-tabs" role="tablist" aria-label={t('salesTrendRangeLabel')}>
          {RANGES.map((r) => (
            <button
              key={r.key}
              type="button"
              role="tab"
              aria-selected={range === r.key}
              className={`dashboard-range-tab ${range === r.key ? 'dashboard-range-tab-active' : ''}`}
              onClick={() => setRange(r.key)}
            >
              {t(r.labelKey)}
            </button>
          ))}
        </div>
      </div>
      <div className="card-body">
        {loading ? (
          <Skeleton height={280} />
        ) : data.length === 0 ? (
          <div className="flex items-center justify-center" style={{ height: 280 }}>
            <EmptyState icon={FiTrendingUp} title={t('noSalesForPeriod')} />
          </div>
        ) : (
          <LineChart
            labels={data.map((d) => formatLabel(d.date, range))}
            values={data.map((d) => Number(d.value))}
            valueFormatter={formatCurrency}
          />
        )}
      </div>
    </div>
  );
}

export default SalesTrendCard;
