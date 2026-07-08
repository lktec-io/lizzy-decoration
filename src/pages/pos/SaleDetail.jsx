import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiPrinter } from 'react-icons/fi';
import * as saleService from '../../services/saleService';
import { formatCurrency } from '../../utils/formatCurrency';
import '../../styles/pages/POS.css';

const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
  card: 'Card',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function SaleDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [sale, setSale] = useState(null);

  useEffect(() => {
    saleService.getSale(id).then(setSale);
  }, [id]);

  if (!sale) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  const totalPaid = sale.payments.reduce((sum, p) => sum + Number(p.amount), 0);
  const balance = totalPaid - Number(sale.total_amount);

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/pos/sales')}>
            <FiArrowLeft aria-hidden="true" /> Back to Sale History
          </button>
          <h1 className="page-title">{sale.sale_number}</h1>
          <p className="page-subtitle">
            {sale.branch_name} · {formatDateTime(sale.created_at)} · Cashier: {sale.cashier_first_name} {sale.cashier_last_name}
            {sale.customer_first_name ? ` · Customer: ${sale.customer_first_name} ${sale.customer_last_name}` : ' · Walk-in customer'}
          </p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-primary" onClick={() => saleService.openReceipt(sale.id)}>
            <FiPrinter aria-hidden="true" /> View / Print Receipt
          </button>
        </div>
      </div>

      {sale.notes && (
        <div className="alert alert-info mb-4" role="note">{sale.notes}</div>
      )}

      <div className="card mb-5">
        <div className="card-header"><span className="card-title">Items</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Product</th>
                <th>Quantity</th>
                <th>Unit Price</th>
                <th>Discount</th>
                <th>Line Total</th>
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
            <div className="pos-totals-row"><span>Subtotal</span><span>{formatCurrency(sale.subtotal)}</span></div>
            {Number(sale.discount_amount) > 0 && (
              <div className="pos-totals-row"><span>Discount</span><span>-{formatCurrency(sale.discount_amount)}</span></div>
            )}
            <div className="pos-totals-row pos-totals-row-total"><span>Total</span><span>{formatCurrency(sale.total_amount)}</span></div>
          </div>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Payments</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr>
                <th>Method</th>
                <th>Amount</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              {sale.payments.map((payment) => (
                <tr key={payment.id}>
                  <td>{PAYMENT_METHOD_LABELS[payment.payment_method] || payment.payment_method}</td>
                  <td>{formatCurrency(payment.amount)}</td>
                  <td>{payment.reference_number || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="card-footer flex justify-end">
          <span className="text-sm font-semibold">{balance >= 0 ? 'Change' : 'Balance Due'}: {formatCurrency(Math.abs(balance))}</span>
        </div>
      </div>
    </div>
  );
}

export default SaleDetail;
