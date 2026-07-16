import { useTheme } from '../../hooks/useTheme';

// Mirrors src/styles/themes.css — Chart.js bakes colors into the chart at
// construction time and can't read CSS custom properties directly (and the
// hand-rolled DoughnutChart SVG reads slice colors as plain JS values, not
// CSS), so each theme's palette is duplicated here as plain hex. Consumers
// call useChartTheme() (below) instead of importing a static palette, so a
// theme switch re-renders every chart with the new colors automatically.
const THEME_CHART_PALETTES = {
  aurora: {
    primary: '#0B1F4D',
    primaryHover: '#123262',
    accent: '#10B981',
    blue: '#2F6BFF',
    graySecondary: '#5B6B8C',
    border: 'rgba(15, 23, 42, 0.1)',
    success: '#10B981',
    warning: '#F59E0B',
    danger: '#EF4444',
    info: '#2F6BFF',
    categorical: ['#0B1F4D', '#2F6BFF', '#10B981', '#F59E0B', '#334155', '#EF4444'],
    doughnut: ['#2F6BFF', '#10B981', '#C89B3C', '#22D3EE', '#F59E0B', '#8B5CF6', '#14B8A6'],
    doughnutTrack: 'rgba(15, 23, 42, 0.1)',
    doughnutOther: '#5B6B8C',
    tooltipBg: 'rgba(11, 31, 77, 0.92)',
  },
  midnight: {
    primary: '#39FF88',
    primaryHover: '#2EE673',
    accent: '#22D3EE',
    blue: '#A78BFA',
    graySecondary: '#8B93A7',
    border: 'rgba(255, 255, 255, 0.08)',
    success: '#39FF88',
    warning: '#FFD166',
    danger: '#FF4D6D',
    info: '#22D3EE',
    categorical: ['#39FF88', '#22D3EE', '#A78BFA', '#FFD166', '#FF6EC7', '#FF4D6D'],
    doughnut: ['#39FF88', '#22D3EE', '#A78BFA', '#FF6EC7', '#FFD166', '#5EEAD4', '#FF4D6D'],
    doughnutTrack: 'rgba(255, 255, 255, 0.08)',
    doughnutOther: '#8B93A7',
    tooltipBg: 'rgba(4, 18, 10, 0.94)',
  },
  frost: {
    primary: '#2952CC',
    primaryHover: '#1F3FA0',
    accent: '#0E9488',
    blue: '#2952CC',
    graySecondary: '#6B7280',
    border: 'rgba(15, 23, 42, 0.08)',
    success: '#16A34A',
    warning: '#D97706',
    danger: '#DC2626',
    info: '#2952CC',
    categorical: ['#2952CC', '#0E9488', '#94A3B8', '#C9A15A', '#DC2626', '#3F4756'],
    doughnut: ['#2952CC', '#0E9488', '#C9A15A', '#94A3B8', '#D97706', '#7C8FBF', '#DC2626'],
    doughnutTrack: 'rgba(15, 23, 42, 0.08)',
    doughnutOther: '#6B7280',
    tooltipBg: 'rgba(30, 36, 48, 0.92)',
  },
};

export const BASE_FONT = {
  family: 'Poppins, sans-serif',
  size: 12,
};

// The single hook every chart component (BarChart/LineChart/DoughnutChart)
// and every page passing an explicit `color`/dataset color reads from —
// swapping themes re-renders these with the new palette, no chart-specific
// wiring needed per caller.
export function useChartTheme() {
  const { theme } = useTheme();
  return THEME_CHART_PALETTES[theme] || THEME_CHART_PALETTES.aurora;
}

// Default/fallback exports for any non-component context that can't call a
// hook — always Aurora. Live chart components must use useChartTheme().
export const CHART_COLORS = THEME_CHART_PALETTES.aurora;
export const CATEGORICAL_PALETTE = THEME_CHART_PALETTES.aurora.categorical;
export const DOUGHNUT_PALETTE = THEME_CHART_PALETTES.aurora.doughnut;
