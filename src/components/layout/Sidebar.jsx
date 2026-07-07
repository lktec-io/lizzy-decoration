import { NavLink } from 'react-router-dom';
import {
  FiGrid, FiMapPin, FiUsers, FiUserCheck, FiTruck, FiTag, FiBookmark,
  FiBox, FiArchive, FiShoppingCart, FiRepeat, FiRotateCcw, FiDollarSign,
  FiDroplet, FiBarChart2, FiBell, FiSettings, FiUser, FiLogOut,
  FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import '../../styles/components/Sidebar.css';

const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/branches', label: 'Branches', icon: FiMapPin },
  { to: '/users', label: 'Users', icon: FiUsers },
  { to: '/customers', label: 'Customers', icon: FiUserCheck },
  { to: '/suppliers', label: 'Suppliers', icon: FiTruck },
  { to: '/categories', label: 'Categories', icon: FiBookmark },
  { to: '/brands', label: 'Brands', icon: FiTag },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/inventory', label: 'Inventory', icon: FiArchive },
  { to: '/purchases', label: 'Purchases', icon: FiShoppingCart },
  { to: '/pos', label: 'Sales (POS)', icon: FiDollarSign },
  { to: '/returns', label: 'Returns', icon: FiRotateCcw },
  { to: '/transfers', label: 'Transfers', icon: FiRepeat },
  { to: '/expenses', label: 'Expenses', icon: FiDollarSign },
  { to: '/carwash', label: 'Car Wash', icon: FiDroplet },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/notifications', label: 'Notifications', icon: FiBell },
  { to: '/settings', label: 'Settings', icon: FiSettings },
  { to: '/profile', label: 'Profile', icon: FiUser },
];

function Sidebar({ collapsed, onToggle }) {
  return (
    <aside className={`sidebar ${collapsed ? 'sidebar-collapsed' : ''}`}>
      <div className="sidebar-brand">
        <span className="sidebar-brand-mark">{collapsed ? 'J' : 'JOZZY'}</span>
      </div>

      <nav className="sidebar-nav">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
          >
            <Icon className="sidebar-link-icon" aria-hidden="true" />
            {!collapsed && <span className="sidebar-link-label">{label}</span>}
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-footer">
        <button type="button" className="sidebar-link sidebar-logout">
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
