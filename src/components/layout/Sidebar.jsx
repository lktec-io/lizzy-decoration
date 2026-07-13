import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  FiGrid, FiUserCheck, FiTruck,
  FiBox, FiArchive, FiShoppingCart, FiDollarSign, FiRotateCcw,
  FiDroplet, FiBarChart2, FiSettings, FiLogOut,
  FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { ROUTES } from '../../constants/routes';
import '../../styles/components/Sidebar.css';

// Staggered reveal, played only when the mobile drawer opens (see the
// openKey/key-remount trick in Sidebar() below) — on desktop mobileOpen
// never becomes true so this never triggers, avoiding an unwanted
// animate-in on every load.
const NAV_STAGGER_CONTAINER = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.12 } },
};

const NAV_ICON_VARIANT = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2, ease: 'easeOut' } },
};

const NAV_LABEL_VARIANT = {
  hidden: { opacity: 0, x: 25 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] } },
};

// Branches, Users, Roles, Categories, Brands, Notifications, and Profile
// are intentionally not top-level nav items — they're reachable via
// Settings, the Product form, or the Navbar (Profile, notification bell)
// instead. Transfers has no UI at all anymore (backend untouched). Returns
// is a full top-level module, matching the client's module list.
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/customers', label: 'Customers', icon: FiUserCheck },
  { to: '/suppliers', label: 'Suppliers', icon: FiTruck },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/inventory', label: 'Inventory', icon: FiArchive },
  { to: '/purchases', label: 'Purchases', icon: FiShoppingCart },
  { to: '/pos', label: 'Sales (POS)', icon: FiDollarSign },
  { to: '/returns', label: 'Returns', icon: FiRotateCcw },
  { to: '/expenses', label: 'Expenses', icon: FiDollarSign },
  { to: '/carwash', label: 'Car Wash', icon: FiDroplet },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/settings/company', label: 'Settings', icon: FiSettings },
];

function Sidebar({ collapsed, onToggle, onNavigate, mobileOpen }) {
  const { logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const companyName = company?.company_name || 'JOZZY';

  // Replays the label/icon stagger every time the mobile drawer opens: each
  // open increments openKey, which remounts the nav list so its "hidden"
  // initial state applies fresh. Desktop never toggles mobileOpen (the
  // hamburger button that would is hidden there), so openKey stays 0
  // forever and initial={false} below keeps desktop's instant, unanimated
  // rendering exactly as it was. Derived directly during render (not an
  // effect) per React's "adjusting state when a prop changes" pattern —
  // this is a prop-driven derivation, not a side effect.
  const [openKey, setOpenKey] = useState(0);
  const [prevMobileOpen, setPrevMobileOpen] = useState(mobileOpen);
  if (mobileOpen !== prevMobileOpen) {
    setPrevMobileOpen(mobileOpen);
    if (mobileOpen) setOpenKey((key) => key + 1);
  }

  const handleLogout = async () => {
    onNavigate?.();
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        {company?.logo_path ? (
          <img src={company.logo_path} alt={companyName} className="sidebar-brand-logo" />
        ) : (
          <span className="sidebar-brand-mark">{collapsed ? companyName.charAt(0) : companyName}</span>
        )}
      </div>

      <motion.nav
        key={openKey}
        className="sidebar-nav"
        variants={NAV_STAGGER_CONTAINER}
        initial={openKey === 0 ? false : 'hidden'}
        animate="visible"
        onClickCapture={onNavigate}
      >
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
            onClick={onNavigate}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <motion.span
                    layoutId="sidebar-active-pill"
                    className="sidebar-link-indicator"
                    transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                  />
                )}
                <motion.span className="sidebar-link-icon" variants={NAV_ICON_VARIANT}>
                  <Icon aria-hidden="true" />
                </motion.span>
                {!collapsed && (
                  <motion.span className="sidebar-link-label" variants={NAV_LABEL_VARIANT}>
                    {label}
                  </motion.span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </motion.nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-link sidebar-logout" onClick={handleLogout}>
          <FiLogOut className="sidebar-link-icon" aria-hidden="true" />
          {!collapsed && <span className="sidebar-link-label">Logout</span>}
        </button>
        <button
          type="button"
          className="sidebar-collapse-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <FiChevronsRight /> : <FiChevronsLeft />}
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
