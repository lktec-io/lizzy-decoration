import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import * as purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function PurchaseDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    purchaseService.getPurchase(id).then(setPurchase);
  }, [id]);

  if (!purchase) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/purchases')}>
            <FiArrowLeft aria-hidden="true" /> Back to Purchases
          </button>
          <h1 className="page-title">{purchase.purchase_number}</h1>
          <p className="page-subtitle">
            {purchase.supplier_name} · {purchase.branch_name} · {formatDateTime(purchase.created_at)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Items</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Buying Price</th>
                <th>Line Total</th>
              </tr>
            </thead>
            <tbody>
              {purchase.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.buying_price)}</td>
                  <td>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer flex justify-end">
          <span className="text-lg font-semibold">Total: {formatCurrency(purchase.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}

export default PurchaseDetail;
