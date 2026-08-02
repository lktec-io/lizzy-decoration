import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// English (source of truth for keys) and Kiswahili resources, one JSON
// file per feature area — mirrors this app's existing page-folder
// structure (src/pages/pos, src/pages/products, ...) rather than one giant
// file, so translating/reviewing one module never risks touching another,
// and multiple people (or agents) can work on separate modules with zero
// merge conflicts. Bundled directly (no runtime fetch/backend) — the
// combined JSON for both languages is small next to the app's JS bundle,
// and bundling means a language switch is genuinely instant (no network
// request) and can never fail partway through loading a namespace.
import enCommon from './locales/en/common.json';
import enLayout from './locales/en/layout.json';
import enAuth from './locales/en/auth.json';
import enErrors from './locales/en/errors.json';
import enDashboard from './locales/en/dashboard.json';
import enProfile from './locales/en/profile.json';
import enReports from './locales/en/reports.json';
import enPos from './locales/en/pos.json';
import enProducts from './locales/en/products.json';
import enInventory from './locales/en/inventory.json';
import enCustomers from './locales/en/customers.json';
import enSuppliers from './locales/en/suppliers.json';
import enBranches from './locales/en/branches.json';
import enPurchases from './locales/en/purchases.json';
import enExpenses from './locales/en/expenses.json';
import enReturns from './locales/en/returns.json';
import enCarwash from './locales/en/carwash.json';
import enSettings from './locales/en/settings.json';
import enCompany from './locales/en/company.json';
import enRoles from './locales/en/roles.json';
import enUsers from './locales/en/users.json';

import swCommon from './locales/sw/common.json';
import swLayout from './locales/sw/layout.json';
import swAuth from './locales/sw/auth.json';
import swErrors from './locales/sw/errors.json';
import swDashboard from './locales/sw/dashboard.json';
import swProfile from './locales/sw/profile.json';
import swReports from './locales/sw/reports.json';
import swPos from './locales/sw/pos.json';
import swProducts from './locales/sw/products.json';
import swInventory from './locales/sw/inventory.json';
import swCustomers from './locales/sw/customers.json';
import swSuppliers from './locales/sw/suppliers.json';
import swBranches from './locales/sw/branches.json';
import swPurchases from './locales/sw/purchases.json';
import swExpenses from './locales/sw/expenses.json';
import swReturns from './locales/sw/returns.json';
import swCarwash from './locales/sw/carwash.json';
import swSettings from './locales/sw/settings.json';
import swCompany from './locales/sw/company.json';
import swRoles from './locales/sw/roles.json';
import swUsers from './locales/sw/users.json';

// Single source of truth for "what languages exist" — the Profile
// language switcher and the persistence logic below both read from this,
// so adding a third language later is adding one entry here plus its
// locale JSON files, not touching every component that renders text.
export const LANGUAGES = [
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'sw', label: 'Kiswahili', flag: '🇹🇿' },
];
export const LANGUAGE_CODES = LANGUAGES.map((l) => l.code);
export const DEFAULT_LANGUAGE = 'en';
export const LANGUAGE_STORAGE_KEY = 'jozzy-language';

function readInitialLanguage() {
  if (typeof window === 'undefined') return DEFAULT_LANGUAGE;
  const stored = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  return LANGUAGE_CODES.includes(stored) ? stored : DEFAULT_LANGUAGE;
}

const resources = {
  en: {
    common: enCommon, layout: enLayout, auth: enAuth, errors: enErrors, dashboard: enDashboard, profile: enProfile,
    reports: enReports, pos: enPos, products: enProducts, inventory: enInventory, customers: enCustomers,
    suppliers: enSuppliers, branches: enBranches, purchases: enPurchases, expenses: enExpenses, returns: enReturns,
    carwash: enCarwash, settings: enSettings, company: enCompany, roles: enRoles, users: enUsers,
  },
  sw: {
    common: swCommon, layout: swLayout, auth: swAuth, errors: swErrors, dashboard: swDashboard, profile: swProfile,
    reports: swReports, pos: swPos, products: swProducts, inventory: swInventory, customers: swCustomers,
    suppliers: swSuppliers, branches: swBranches, purchases: swPurchases, expenses: swExpenses, returns: swReturns,
    carwash: swCarwash, settings: swSettings, company: swCompany, roles: swRoles, users: swUsers,
  },
};

const initialLanguage = readInitialLanguage();

// Set before i18next even finishes initializing so the very first paint
// already has the correct lang attribute — no flash of the wrong value
// the way there would be if this waited for a React effect.
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('lang', initialLanguage);
}

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: DEFAULT_LANGUAGE,
  defaultNS: 'common',
  ns: Object.keys(resources[DEFAULT_LANGUAGE]),
  interpolation: { escapeValue: false }, // React already escapes
  returnEmptyString: false,
  // A missing key renders as the key itself in dev (impossible to miss
  // when a namespace forgot a string) — see the final audit for how this
  // doubled as the actual "search for remaining hardcoded strings" method.
  saveMissing: false,
});

// Fires on every changeLanguage() call (the Profile switcher) — this is
// the one place persistence + the <html lang> attribute are kept in sync
// with whatever language is actually active, so neither can drift from
// the other regardless of which component triggered the change.
i18n.on('languageChanged', (lng) => {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(LANGUAGE_STORAGE_KEY, lng);
  document.documentElement.setAttribute('lang', lng);
});

export default i18n;
