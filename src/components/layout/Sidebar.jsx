import { NavLink, useNavigate } from 'react-router-dom';
import {
  FiGrid, FiUserCheck, FiTruck,
  FiBox, FiArchive, FiShoppingCart, FiDollarSign,
  FiDroplet, FiBarChart2, FiSettings, FiLogOut,
  FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { ROUTES } from '../../constants/routes';
import '../../styles/components/Sidebar.css';

// Branches, Users, Roles, Categories, Brands, Notifications, Transfers,
// Returns, and Profile are intentionally not top-level nav items — they're
// reachable via Settings, the Product form, or the Navbar (Profile,
// notification bell) instead. Their routes/pages/backends are untouched,
// just no longer linked from here.
const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: FiGrid, end: true },
  { to: '/customers', label: 'Customers', icon: FiUserCheck },
  { to: '/suppliers', label: 'Suppliers', icon: FiTruck },
  { to: '/products', label: 'Products', icon: FiBox },
  { to: '/inventory', label: 'Inventory', icon: FiArchive },
  { to: '/purchases', label: 'Purchases', icon: FiShoppingCart },
  { to: '/pos', label: 'Sales (POS)', icon: FiDollarSign },
  { to: '/expenses', label: 'Expenses', icon: FiDollarSign },
  { to: '/carwash', label: 'Car Wash', icon: FiDroplet },
  { to: '/reports', label: 'Reports', icon: FiBarChart2 },
  { to: '/settings/company', label: 'Settings', icon: FiSettings },
];

function Sidebar({ collapsed, onToggle }) {
  const { logout } = useAuth();
  const { company } = useCompany();
  const navigate = useNavigate();
  const companyName = company?.company_name || 'JOZZY';

  const handleLogout = async () => {
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
