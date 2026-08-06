import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiBriefcase, FiMapPin, FiUsers, FiShield, FiTag, FiDroplet, FiPercent, FiClock } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';

// labelKey resolves through the `settings` i18n namespace at render time
// (translation keys can't be evaluated in this module-level array, which
// exists before any React/i18n context is available) — same pattern as
// Sidebar.jsx's NAV_ITEMS.
//
// requiredPermission is only set on Audit Trail — every other tab here
// stays unconditionally visible (unchanged from before), matching how the
// route-level RequirePermission guard behind each of them already works.
// Audit Trail additionally hides its own tab (not just guards the route)
// since the spec requires it "visible only to Super Administrator and
// Manager" rather than just inaccessible-if-clicked.
const TABS = [
  { to: '/settings/company', labelKey: 'tabCompany', icon: FiBriefcase },
  { to: '/settings/branches', labelKey: 'tabBranches', icon: FiMapPin },
  { to: '/settings/users', labelKey: 'tabUsers', icon: FiUsers },
  { to: '/settings/permissions', labelKey: 'tabRoles', icon: FiShield },
  { to: '/settings/expense-categories', labelKey: 'tabExpenseCategories', icon: FiTag },
  { to: '/settings/carwash-services', labelKey: 'tabCarwashPackages', icon: FiDroplet },
  { to: '/settings/system', labelKey: 'tabTaxEmail', icon: FiPercent },
  { to: '/settings/audit-trail', labelKey: 'tabAuditTrail', icon: FiClock, requiredPermission: 'audit.view' },
];

function SettingsTabs() {
  const { t } = useTranslation('settings');
  const { hasPermission } = useAuth();
  const visibleTabs = TABS.filter((tab) => !tab.requiredPermission || hasPermission(tab.requiredPermission));

  return (
    <div className="notifications-tabs mb-5">
      {visibleTabs.map(({ to, labelKey, icon: Icon }) => (
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
