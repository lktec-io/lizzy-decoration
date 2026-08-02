import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiDollarSign, FiUserPlus, FiCreditCard, FiDroplet, FiBarChart2 } from 'react-icons/fi';
import '../../styles/components/QuickActions.css';

const ACTIONS = [
  { labelKey: 'quickActions.newSale', icon: FiDollarSign, to: '/pos', accent: '#2F6BFF' },
  { labelKey: 'quickActions.newCustomer', icon: FiUserPlus, to: '/customers', accent: '#14B8A6' },
  { labelKey: 'quickActions.newExpense', icon: FiCreditCard, to: '/expenses', accent: '#F59E0B' },
  { labelKey: 'quickActions.newCarWash', icon: FiDroplet, to: '/carwash', accent: '#06B6D4' },
  { labelKey: 'quickActions.reports', icon: FiBarChart2, to: '/reports', accent: '#8B5CF6' },
];

// Same hex->rgb-triple trick KPICard.jsx uses, so the icon wash can be a
// low-opacity rgba() derived from one accent prop instead of a second color.
function hexToRgbTriple(hex) {
  const value = hex.replace('#', '');
  const r = parseInt(value.substring(0, 2), 16);
  const g = parseInt(value.substring(2, 4), 16);
  const b = parseInt(value.substring(4, 6), 16);
  return `${r}, ${g}, ${b}`;
}

function QuickActions() {
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  return (
    <div className="card quick-actions">
      {ACTIONS.map(({ labelKey, icon: Icon, to, accent }) => (
        <button
          key={labelKey}
          type="button"
          className="quick-actions-item"
          onClick={() => navigate(to)}
          style={{ '--quick-action-accent': accent, '--quick-action-accent-rgb': hexToRgbTriple(accent) }}
        >
          <span className="quick-actions-icon"><Icon aria-hidden="true" /></span>
          <span className="quick-actions-label">{t(labelKey)}</span>
        </button>
      ))}
    </div>
  );
}

export default QuickActions;
