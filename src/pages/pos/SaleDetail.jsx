import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiPrinter, FiDownload, FiPlusCircle } from 'react-icons/fi';
import PageSkeleton from '../../components/common/PageSkeleton';
import * as saleService from '../../services/saleService';
import { formatCurrency } from '../../utils/formatCurrency';
import '../../styles/pages/POS.css';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

const RECEIPT_SIZES = [
  { value: '58', label: '58mm' },
  { value: '80', label: '80mm' },
  { value: 'a4', label: 'A4' },
];

function SaleDetail() {
  const { t } = useTranslation('pos');
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);
  const [receiptSize, setReceiptSize] = useState('80');

  useEffect(() => {
    saleService.getSale(id).then(setSale);
  }, [id]);

  if (!sale) {
    return <PageSkeleton />;
  }

  const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalPaid - Number(sale.total_amount);

  // Small lookup translated at render time (not a module-level constant,
  // since it needs the `t` from this component's i18n context) — mpesa /
  // airtel_money aren't in the shared `common` namespace, cash/card/
  // bank_transfer are.
  const paymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return t('common:cash');
      case 'card': return t('common:card');
      case 'bank_transfer': return t('common:bankTransfer');
      case 'mpesa': return t('paymentMpesa');
      case 'airtel_money': return t('paymentAirtelMoney');
      default: return method;
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/pos/sales')}>
            <FiArrowLeft aria-hidden="true" /> {t('backToSaleHistory')}
          </button>
          <h1 className="page-title">{sale.sale_number}</h1>
          <p className="page-subtitle">
            {sale.branch_name} · {formatDateTime(sale.created_at)} · {t('cashierInline', { name: `${sale.cashier_first_name} ${sale.cashier_last_name}` })}
            {sale.customer_first_name ? ` · ${t('customerInline', { name: `${sale.customer_first_name} ${sale.customer_last_name}` })}` : ` · ${t('walkInCustomer')}`}
          </p>
        </div>
        <div className="page-actions">
          <select
            className="form-control"
            style={{ width: 90 }}
            value={receiptSize}
            onChange={(e) => setReceiptSize(e.target.value)}
            aria-label={t('receiptPaperSizeAria')}
          >
            {RECEIPT_SIZES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
          </select>
          <button type="button" className="btn btn-secondary" onClick={() => saleService.printReceipt(sale.id, receiptSize)}>
            <FiPrinter aria-hidden="true" /> {t('common:print')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => saleService.downloadReceiptPdf(sale.id, sale.sale_number, receiptSize)}>
            <FiDownload aria-hidden="true" /> {t('downloadPdf')}
          </button>
          <button type="button" className="btn btn-primary" onClick={() => navigate('/pos')}>
            <FiPlusCircle aria-hidden="true" /> {t('newSale')}
          </button>
        </div>
      </div>

      {sale.notes && (
        <div className="alert alert-info mb-4" role="note">{sale.notes}</div>
      )}

      <div className="card mb-5">
        <div className="card-header"><span className="card-title">{t('itemsCardTitle')}</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('common:product')}</th>
                <th>{t('common:quantity')}</th>
                <th>{t('common:unitPrice')}</th>
                <th>{t('common:discount')}</th>
                <th>{t('colLineTotal')}</th>
              </tr>
            </thead>
            <tbody>
              {sale.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                  <td>{Number(item.discount_amount) > 0 ? `-${formatCurrency(item.discount_amount)}` : '—'}</td>
                  <td>{formatCurrency(item.line_total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer flex justify-end">
          <div style={{ minWidth: 240 }}>
            <div className="pos-totals-row"><span>{t('common:subtotal')}</span><span>{formatCurrency(sale.subtotal)}</span></div>
            {Number(sale.discount_amount) > 0 && (
              <div className="pos-totals-row"><span>{t('common:discount')}</span><span>-{formatCurrency(sale.discount_amount)}</span></div>
            )}
            <div className="pos-totals-row pos-totals-row-total"><span>{t('common:total')}</span><span>{formatCurrency(sale.total_amount)}</span></div>
          </div>
        </div>
      </div>

      {sale.profit && (
        <div className="card mb-5">
          <div className="card-header"><span className="card-title">{t('profitCardTitle')}</span></div>
          <div className="card-body flex" style={{ gap: 'var(--space-6)', flexWrap: 'wrap' }}>
            <div>
              <div className="text-xs text-secondary">{t('cost')}</div>
              <div className="text-sm font-semibold">{formatCurrency(sale.profit.cost)}</div>
            </div>
            <div>
              <div className="text-xs text-secondary">{t('grossProfit')}</div>
              <div className="text-sm font-semibold">{formatCurrency(sale.profit.grossProfit)}</div>
            </div>
            <div>
              <div className="text-xs text-secondary">{t('margin')}</div>
              <div className="text-sm font-semibold">{sale.profit.marginPercent.toFixed(1)}%</div>
            </div>
          </div>
        </div>
      )}

      <div className="card">
        <div className="card-header"><span className="card-title">{t('paymentsCardTitle')}</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>{t('colMethod')}</th>
                <th>{t('common:amount')}</th>
                <th>{t('common:reference')}</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{paymentMethodLabel(payment.payment_method)}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.reference_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer flex justify-end">
          <span className="text-sm font-semibold">{balance >= 0 ? t('change') : t('balanceDue')}: {formatCurrency(Math.abs(balance))}</span>
        </div>
      </div>
    </div>
  );
}

export default SaleDetail;
