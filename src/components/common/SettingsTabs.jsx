import { NavLink } from 'react-router-dom';
import { FiBriefcase, FiMapPin, FiUsers, FiShield, FiTag, FiDroplet, FiPercent, FiDatabase } from 'react-icons/fi';

const TABS = [
  { to: '/settings/company', label: 'Company', icon: FiBriefcase },
  { to: '/settings/branches', label: 'Branches', icon: FiMapPin },
  { to: '/settings/users', label: 'Users', icon: FiUsers },
  { to: '/settings/permissions', label: 'Permissions', icon: FiShield },
  { to: '/settings/expense-categories', label: 'Expense Categories', icon: FiTag },
  { to: '/settings/carwash-services', label: 'Car Wash Packages', icon: FiDroplet },
  { to: '/settings/system', label: 'Tax & Email', icon: FiPercent },
  { to: '/settings/backups', label: 'Backups', icon: FiDatabase },
];

function SettingsTabs() {
  return (
    <div className="notifications-tabs mb-5">
      {TABS.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `notifications-tab ${isActive ? 'notifications-tab-active' : ''}`}
        >
          <Icon aria-hidden="true" />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default SettingsTabs;
