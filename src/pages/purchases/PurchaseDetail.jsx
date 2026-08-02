import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft } from 'react-icons/fi';
import PageSkeleton from '../../components/common/PageSkeleton';
import * as purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function PurchaseDetail() {
  const { t } = useTranslation('purchases');
  const { id } = useParams();
  const navigate = useNavigate();
  const [purchase, setPurchase] = useState(null);

  useEffect(() => {
    purchaseService.getPurchase(id).then(setPurchase);
  }, [id]);

  if (!purchase) {
    return <PageSkeleton />;
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/purchases')}>
            <FiArrowLeft aria-hidden="true" /> {t('backToPurchases')}
          </button>
          <h1 className="page-title">{purchase.purchase_number}</h1>
          <p className="page-subtitle">
            {purchase.supplier_name} · {purchase.branch_name} · {formatDateTime(purchase.created_at)}
          </p>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">{t('itemsCardTitle')}</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common:product')}</th>
                <th>{t('common:quantity')}</th>
                <th>{t('buyingPrice')}</th>
                <th>{t('lineTotal')}</th>
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
          <span className="text-lg font-semibold">{t('totalWithAmount', { amount: formatCurrency(purchase.total_amount) })}</span>
        </div>
      </div>
    </div>
  );
}

export default PurchaseDetail;
