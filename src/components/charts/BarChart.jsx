import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from 'chart.js';
import { Bar } from 'react-chartjs-2';
import { CHART_COLORS, BASE_FONT } from './chartTheme';

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

// `datasets` (array of { label, values, color }) renders a grouped/legended
// bar chart (Revenue vs Expenses); the single `values`/`color`/`label` props
// stay the default single-series mode every existing caller already uses.
function BarChart({
  labels, values, label = 'Value', color = CHART_COLORS.primary, horizontal = false,
  datasets = null, valueFormatter = (v) => v, height = 260,
}) {
  const data = {
    labels,
    datasets: datasets
      ? datasets.map((d) => ({
        label: d.label,
        data: d.values,
        backgroundColor: d.color,
        borderRadius: 4,
        maxBarThickness: 28,
      }))
      : [
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
      legend: datasets
        ? { display: true, position: 'top', align: 'end', labels: { font: BASE_FONT, color: CHART_COLORS.graySecondary, usePointStyle: true, boxWidth: 8 } }
        : { display: false },
      tooltip: {
        titleFont: BASE_FONT,
        bodyFont: BASE_FONT,
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        padding: 12,
        cornerRadius: 8,
        callbacks: { label: (context) => `${context.dataset.label}: ${valueFormatter(context.parsed[horizontal ? 'x' : 'y'])}` },
      },
    },
    scales: {
      x: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: !horizontal, color: CHART_COLORS.border } },
      y: { ticks: { font: BASE_FONT, color: CHART_COLORS.graySecondary }, grid: { display: horizontal, color: CHART_COLORS.border } },
    },
  };

  return (
    <div style={{ height }}>
      <Bar data={data} options={options} />
    </div>
  );
}

export default BarChart;
