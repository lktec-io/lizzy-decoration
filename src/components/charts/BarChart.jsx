import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, BASE_FONT } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip);

function BarChart({ labels, values, label = 'Value', color = CHART_COLORS.gold, horizontal = false }) {
  const data = {
    labels,
    datasets: [
      {
        label,
        data: values,
        backgroundColor: color,
        borderRadius: 4,
        maxBarThickness: 36,
      },
    ],
  };

  const options = {
    indexAxis: horizontal ? 'y' : 'x',
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: { titleFont: BASE_FONT, bodyFont: BASE_FONT },
    },
    scales: {
      x: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: !horizontal, color: CHART_COLORS.border } },
      y: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: horizontal, color: CHART_COLORS.border } },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default BarChart;
