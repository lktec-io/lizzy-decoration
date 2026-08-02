import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBriefcase, FiMapPin, FiUsers, FiShield, FiTag, FiDroplet, FiPercent } from 'react-icons/fi';

// labelKey resolves through the `settings` i18n namespace at render time
// (translation keys can't be evaluated in this module-level array, which
// exists before any React/i18n context is available) — same pattern as
// Sidebar.jsx's NAV_ITEMS.
const TABS = [
  { to: '/settings/company', labelKey: 'tabCompany', icon: FiBriefcase },
  { to: '/settings/branches', labelKey: 'tabBranches', icon: FiMapPin },
  { to: '/settings/users', labelKey: 'tabUsers', icon: FiUsers },
  { to: '/settings/permissions', labelKey: 'tabRoles', icon: FiShield },
  { to: '/settings/expense-categories', labelKey: 'tabExpenseCategories', icon: FiTag },
  { to: '/settings/carwash-services', labelKey: 'tabCarwashPackages', icon: FiDroplet },
  { to: '/settings/system', labelKey: 'tabTaxEmail', icon: FiPercent },
];

function SettingsTabs() {
  const { t } = useTranslation('settings');

  return (
    <div className="notifications-tabs mb-5">
      {TABS.map(({ to, labelKey, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) => `notifications-tab ${isActive ? 'notifications-tab-active' : ''}`}
        >
          <Icon aria-hidden="true" />
          <span>{t(labelKey)}</span>
        </NavLink>
      ))}
    </div>
  );
}

export default SettingsTabs;
