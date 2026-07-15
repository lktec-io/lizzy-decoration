import { FiAlertTriangle } from 'react-icons/fi';
import EmptyState from '../common/EmptyState';
import Skeleton from '../common/Skeleton';
import { formatNumber } from '../../utils/formatCurrency';

// All rows here already come from the lowStock:true filter (quantity <=
// min_stock), so the severity split is a real threshold within that
// population, not an arbitrary color choice: 0 units is the only "red"
// case, at-or-under half of min_stock is "orange", everything else that
// still qualifies as low stock is "green" (low, but not urgent).
function severityOf(product) {
  const quantity = Number(product.quantity);
  const minStock = Number(product.min_stock) || 1;
  if (quantity <= 0) return 'critical';
  if (quantity <= minStock * 0.5) return 'warning';
  return 'caution';
}

const SEVERITY_LABEL = { critical: 'Out of Stock', warning: 'Critical Low', caution: 'Low Stock' };

function LowStockAlertCard({ products, loading }) {
  return (
    <div className="card">
      <div className="card-header"><span className="card-title">Low Stock Alerts</span></div>
      <div className="card-body">
        {loading ? (
          <Skeleton height={220} />
        ) : products.length === 0 ? (
          <EmptyState icon={FiAlertTriangle} title="No low-stock products right now" />
        ) : (
          <ul className="low-stock-list">
            {products.map((product) => {
              const severity = severityOf(product);
              return (
                <li key={product.id} className={`low-stock-alert low-stock-alert-${severity}`}>
                  <span className="low-stock-alert-icon" aria-hidden="true"><FiAlertTriangle /></span>
                  <div className="low-stock-alert-body">
                    <div className="low-stock-alert-name">{product.product_name}</div>
                    <div className="low-stock-alert-meta">
                      {product.branch_name} &middot; {formatNumber(product.quantity)} / {formatNumber(product.min_stock)} min
                    </div>
                  </div>
                  <span className="low-stock-alert-tag">{SEVERITY_LABEL[severity]}</span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

export default LowStockAlertCard;
