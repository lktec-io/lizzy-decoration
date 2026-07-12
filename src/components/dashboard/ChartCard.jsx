import { FiBarChart2 } from 'react-icons/fi';
import Skeleton from '../common/Skeleton';
import EmptyState from '../common/EmptyState';

function ChartCard({ title, loading, empty, emptyMessage = 'No data yet', children }) {
  return (
    <div className="card">
      <div className="card-header">
        <span className="card-title">{title}</span>
      </div>
      <div className="card-body">
        {loading ? (
          <Skeleton height={260} />
        ) : empty ? (
          <div className="flex items-center justify-center" style={{ height: 260 }}>
            <EmptyState icon={FiBarChart2} title={emptyMessage} />
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

export default ChartCard;
