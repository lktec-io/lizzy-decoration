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
