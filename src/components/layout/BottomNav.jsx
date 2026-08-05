import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { FiHome, FiShoppingCart, FiPackage, FiBarChart2, FiUser } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import '../../styles/components/BottomNav.css';

// A fixed, mobile-only shortcut dock — NOT a replacement for Sidebar, which
// keeps its full item list and behavior completely untouched (this
// component doesn't read or write any Sidebar state). Exactly five items,
// no more: this is deliberately a "most-used modules" shortcut, not a full
// nav — anything beyond these five belongs in the Sidebar/Navbar drawer,
// which is still one tap away via Navbar's hamburger on the same screens
// this bar shows on.
//
// requiredPermission mirrors the exact codes Sidebar.jsx already gates the
// same routes behind (sales.view for /pos, inventory.view for /inventory,
// reports.view for /reports) — not a new permission concept, just applying
// the one that already exists so a role without access to a module never
// gets a shortcut that immediately bounces them to /403. Home and Profile
// are ungated for the same reason they're ungated in Sidebar (every role
// has dashboard.view; Profile is self-service).
const NAV_ITEMS = [
  { to: '/', labelKey: 'bottomNav.home', icon: FiHome, end: true },
  { to: '/pos', labelKey: 'bottomNav.sales', icon: FiShoppingCart, requiredPermission: 'sales.view' },
  { to: '/inventory', labelKey: 'bottomNav.stock', icon: FiPackage, requiredPermission: 'inventory.view' },
  { to: '/reports', labelKey: 'bottomNav.reports', icon: FiBarChart2, requiredPermission: 'reports.view' },
  { to: '/profile', labelKey: 'bottomNav.profile', icon: FiUser },
];

const ITEM_TAP = { scale: 0.9 };
const ICON_TRANSITION = { duration: 0.25, ease: [0.16, 1, 0.3, 1] };
const PILL_TRANSITION = { type: 'spring', stiffness: 420, damping: 32 };

function BottomNav() {
  const { t } = useTranslation('layout');
  const { hasPermission } = useAuth();
  const navigate = useNavigate();

  const visibleItems = NAV_ITEMS.filter((item) => !item.requiredPermission || hasPermission(item.requiredPermission));

  // Same "intercept, then navigate on the next frame" pattern Sidebar.jsx
  // uses for its own links — here mainly so a tap's press/release visual
  // feedback (whileTap) isn't cut short by an instant route swap.
  const handleClick = (event, to) => {
    event.preventDefault();
    requestAnimationFrame(() => navigate(to));
  };

  return (
    <nav className="bottom-nav glass-bottom-nav" aria-label={t('bottomNav.label')}>
      {visibleItems.map(({ to, labelKey, icon: Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className="bottom-nav-item"
          onClick={(event) => handleClick(event, to)}
        >
          {({ isActive }) => (
            <motion.span className="bottom-nav-item-inner" whileTap={ITEM_TAP}>
              {isActive && (
                <motion.span
                  layoutId="bottom-nav-active-pill"
                  className="bottom-nav-active-pill"
                  transition={PILL_TRANSITION}
                />
              )}
              <motion.span
                className={`bottom-nav-icon ${isActive ? 'bottom-nav-icon-active' : ''}`}
                animate={{ scale: isActive ? 1.1 : 1, y: isActive ? -1 : 0 }}
                transition={ICON_TRANSITION}
              >
                <Icon aria-hidden="true" />
              </motion.span>
              <span className={`bottom-nav-label ${isActive ? 'bottom-nav-label-active' : ''}`}>
                {t(labelKey)}
              </span>
            </motion.span>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

export default BottomNav;
