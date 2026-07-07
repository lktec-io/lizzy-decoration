import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler } from 'chart.js';
import { Line } from 'react-chartjs-2';
import { CHART_COLORS, BASE_FONT } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Filler);

function LineChart({ labels, values, label = 'Value', color = CHART_COLORS.gold }) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        borderColor: color,
        backgroundColor: `${color}26`,
        fill: true,
        tension: 0.35,
        pointRadius: 3,
        pointBackgroundColor: color,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: BASE_FONT, bodyFont: BASE_FONT },
    },
    scales: {
      x: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: false } },
      y: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { color: CHART_COLORS.border } },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Line data={data} options={options} />
    </div>
  );
}

export default LineChart;
