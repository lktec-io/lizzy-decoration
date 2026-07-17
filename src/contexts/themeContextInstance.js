import { createContext } from 'react';

export const ThemeContext = createContext(null);

// Metadata drives both the picker popup's live-preview cards and the
// chart-color hook (chartTheme.js) — swatch values here are hand-kept in
// sync with the real CSS custom properties in src/styles/themes.css (same
// duplication trade-off chartTheme.js already documents for Chart.js:
// JS-side consumers can't read CSS custom properties at construction time).
export const THEMES = [
  {
    id: 'aurora',
    name: 'Aurora Glass',
    tagline: 'Luxury fintech',
    preview: {
      pageBg: '#EEF3FB',
      sidebarFrom: '#0B1F4D',
      sidebarTo: '#123262',
      navbarBg: 'rgba(255,255,255,0.7)',
      cardBg: 'rgba(255,255,255,0.75)',
      textOnSidebar: '#C7D2E8',
      primary: '#0B1F4D',
      accent: '#10B981',
      chart: ['#2F6BFF', '#10B981', '#22D3EE', '#8B5CF6'],
    },
  },
  {
    id: 'midnight',
    name: 'Midnight Navy',
    tagline: 'Dark futuristic',
    preview: {
      pageBg: '#0B1628',
      sidebarFrom: '#08121F',
      sidebarTo: '#101D33',
      navbarBg: 'rgba(16,29,51,0.75)',
      cardBg: 'rgba(19,35,61,0.68)',
      textOnSidebar: '#9AA5B8',
      primary: '#3B9EFF',
      accent: '#22D3EE',
      chart: ['#3B9EFF', '#22D3EE', '#10B981', '#818CF8'],
    },
  },
  {
    id: 'frost',
    name: 'Pearl Frost',
    tagline: 'Clean & elegant',
    preview: {
      pageBg: '#F6F5F2',
      sidebarFrom: '#FBFAF7',
      sidebarTo: '#F0EEE9',
      navbarBg: 'rgba(255,255,255,0.75)',
      cardBg: 'rgba(255,255,255,0.85)',
      textOnSidebar: '#3B4258',
      primary: '#2952CC',
      accent: '#0E9488',
      chart: ['#2952CC', '#0E9488', '#94A3B8', '#C9A15A'],
    },
  },
];

export const THEME_IDS = THEMES.map((t) => t.id);
