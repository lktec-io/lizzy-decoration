import { useNavigate } from 'react-router-dom';
import { FiDollarSign, FiBox, FiShoppingCart, FiRepeat, FiCreditCard, FiUserPlus, FiTruck, FiFileText } from 'react-icons/fi';

// Every action here targets a page from a later phase (POS, Products,
// Purchases, ...) per the master prompt's own Implementation Order —
// Dashboard (step 7) is built before those modules (steps 8-21). Actions
// light up automatically as each phase's routes go live; until then they're
// visibly disabled rather than linking to a dead page or being hidden.
const QUICK_ACTIONS = [
  { label: 'New Sale', icon: FiDollarSign, to: '/pos', available: false },
  { label: 'New Product', icon: FiBox, to: '/products/new', available: false },
  { label: 'New Purchase', icon: FiShoppingCart, to: '/purchases/new', available: false },
  { label: 'Transfer Stock', icon: FiRepeat, to: '/transfers/new', available: false },
  { label: 'New Expense', icon: FiCreditCard, to: '/expenses/new', available: false },
  { label: 'New Customer', icon: FiUserPlus, to: '/customers/new', available: false },
  { label: 'Register Vehicle', icon: FiTruck, to: '/carwash/vehicles/new', available: false },
  { label: 'Generate Report', icon: FiFileText, to: '/reports', available: false },
];

function QuickActions() {
  const navigate = useNavigate();

  return (
    <div className="quick-actions-grid">
      {QUICK_ACTIONS.map(({ label, icon: Icon, to, available }) => (
        <button
          key={label}
          type="button"
          className="quick-action-btn"
          disabled={!available}
          title={available ? label : `${label} — coming soon`}
          onClick={() => available && navigate(to)}
        >
          <Icon className="quick-action-icon" aria-hidden="true" />
          <span>{label}</span>
        </button>
      ))}
    </div>
  );
}

export default QuickActions;
