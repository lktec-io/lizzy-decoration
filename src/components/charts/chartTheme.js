// Mirrors src/styles/colors.css — Chart.js can't read CSS custom properties
// directly, so the palette is duplicated here as plain hex values.
export const CHART_COLORS = {
  primary: '#0F172A',
  primaryHover: '#1E293B',
  accent: '#22C55E',
  blue: '#3B82F6',
  black: '#0F172A',
  grayDark: '#334155',
  graySecondary: '#64748B',
  border: '#E2E8F0',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  info: '#3B82F6',
};

export const CATEGORICAL_PALETTE = [
  CHART_COLORS.primary,
  CHART_COLORS.blue,
  CHART_COLORS.accent,
  CHART_COLORS.warning,
  CHART_COLORS.grayDark,
  CHART_COLORS.danger,
];

export const BASE_FONT = {
  family: 'Poppins, sans-serif',
  size: 12,
};

// Dashboard doughnut-chart palette. Validated with the dataviz skill's
// scripts/validate_palette.js against the dashboard's light background —
// the requested navy (#0B1F4D) failed the lightness/chroma floor as a mark
// color (reads as near-black on a light surface), so it's used for the
// chart's track ring and text instead of a slice fill. Fixed order, never
// cycled per-render; a category beyond this length folds into "Other".
export const DOUGHNUT_PALETTE = [
  '#2F6BFF', // Royal Blue
  '#10B981', // Emerald
  '#C89B3C', // Gold
  '#60A5FA', // Sky
  '#F59E0B', // Orange
  '#8B5CF6', // Purple
  '#14B8A6', // Teal
];
