import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CHART_COLORS, BASE_FONT } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function LineChart({ labels, values, color = CHART_COLORS.accent, valueFormatter = (v) => v, height = 280 }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: color,
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${color}33`);
          gradient.addColorStop(1, `${color}00`);
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: BASE_FONT,
        bodyFont: BASE_FONT,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (context) => valueFormatter(context.parsed.y) },
      },
    },
    scales: {
      x: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: false } },
      y: {
        ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary, callback: (v) => valueFormatter(v) },
        grid: { color: CHART_COLORS.border },
      },
    },
  };

  return (
    <div style={{ height }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default LineChart;
