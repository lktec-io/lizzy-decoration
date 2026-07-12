import { NavLink } from 'react-router-dom';

const TABS = [
  { to: '/settings/company', label: 'Company' },
  { to: '/settings/branches', label: 'Branches' },
  { to: '/settings/users', label: 'Users' },
  { to: '/settings/permissions', label: 'Permissions' },
  { to: '/settings/expense-categories', label: 'Expense Categories' },
  { to: '/settings/carwash-services', label: 'Car Wash Packages' },
  { to: '/settings/system', label: 'Tax & Email' },
  { to: '/settings/backups', label: 'Backups' },
];

function SettingsTabs() {
  return (
    <div className="notifications-tabs mb-5">
      {TABS.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) => `notifications-tab ${isActive ? 'notifications-tab-active' : ''}`}
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
}

export default SettingsTabs;
