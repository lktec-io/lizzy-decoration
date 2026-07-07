import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { CATEGORICAL_PALETTE, BASE_FONT } from './chartTheme';

ChartJS.register(ArcElement, Tooltip, Legend);

function DoughnutChart({ labels, values }) {
  const data = {
    labels,
    datasets: [
      {
        data: values,
        backgroundColor: CATEGORICAL_PALETTE,
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    cutout: '65%',
    plugins: {
      legend: { position: 'bottom', labels: { font: BASE_FONT, boxWidth: 10, padding: 12 } },
      tooltip: { titleFont: BASE_FONT, bodyFont: BASE_FONT },
    },
  };

  return (
    <div style={{ height: 260 }}>
      <Doughnut data={data} options={options} />
    </div>
  );
}

export default DoughnutChart;
