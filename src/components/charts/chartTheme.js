// Mirrors src/styles/colors.css — Chart.js can't read CSS custom properties
// directly, so the brand palette is duplicated here as plain hex values.
export const CHART_COLORS = {
  gold: '#C8A56A',
  goldDark: '#A88447',
  goldLight: '#D9BC84',
  black: '#111111',
  grayDark: '#1F2937',
  graySecondary: '#6B7280',
  border: '#E5E7EB',
  success: '#16A34A',
  warning: '#F59E0B',
  danger: '#DC2626',
  info: '#2563EB',
};

export const CATEGORICAL_PALETTE = [
  CHART_COLORS.gold,
  CHART_COLORS.grayDark,
  CHART_COLORS.info,
  CHART_COLORS.success,
  CHART_COLORS.warning,
  CHART_COLORS.goldDark,
];

export const BASE_FONT = {
  family: 'Poppins, sans-serif',
  size: 12,
};
