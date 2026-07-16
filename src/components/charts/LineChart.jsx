import {
  Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { BASE_FONT, useChartTheme } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip);

function LineChart({ labels, values, color, valueFormatter = (v) => v, height = 280 }) {
  const chartColors = useChartTheme();
  const resolvedColor = color || chartColors.accent;

  const data = {
    labels,
    datasets: [
      {
        data: values,
        borderColor: resolvedColor,
        backgroundColor: (context) => {
          const { ctx, chartArea } = context.chart;
          if (!chartArea) return 'transparent';
          const gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
          gradient.addColorStop(0, `${resolvedColor}33`);
          gradient.addColorStop(1, `${resolvedColor}00`);
          return gradient;
        },
        fill: true,
        tension: 0.4,
        borderWidth: 2.5,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointHoverBackgroundColor: resolvedColor,
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
        backgroundColor: chartColors.tooltipBg,
        padding: 12,
        cornerRadius: 8,
        displayColors: false,
        callbacks: { label: (context) => valueFormatter(context.parsed.y) },
      },
    },
    scales: {
      x: { ticks: { font: BASE_FONT, color: chartColors.graySecondary }, grid: { display: false } },
      y: {
        ticks: { font: BASE_FONT, color: chartColors.graySecondary, callback: (v) => valueFormatter(v) },
        grid: { color: chartColors.border },
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
