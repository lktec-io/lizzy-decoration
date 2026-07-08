import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiSearch } from 'react-icons/fi';
import * as saleService from '../../services/saleService';
import * as returnService from '../../services/returnService';
import { formatCurrency } from '../../utils/formatCurrency';

const REASONS = [
  { value: 'damaged', label: 'Damaged Product' },
  { value: 'wrong_item', label: 'Wrong Product Issued' },
  { value: 'changed_mind', label: 'Customer Changed Mind' },
  { value: 'expired', label: 'Expired Product' },
  { value: 'other', label: 'Other' },
];

const REFUND_METHODS = [
  { value: 'cash', label: 'Cash' },
  { value: 'mpesa', label: 'M-Pesa' },
  { value: 'airtel_money', label: 'Airtel Money' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
];

function ReturnForm() {
  const navigate = useNavigate();
  const [saleQuery, setSaleQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [sale, setSale] = useState(null);
  const [selectedItems, setSelectedItems] = useState({});
  const [reason, setReason] = useState('damaged');
  const [refundMethod, setRefundMethod] = useState('cash');
  const [formError, setFormError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const findSale = async () => {
    if (!saleQuery.trim()) return;
    setSearching(true);
    setFormError('');
    try {
      const result = await saleService.listSales({ search: saleQuery, limit: 5 });
      setSearchResults(result.items);
    } finally {
      setSearching(false);
    }
  };

  const selectSale = async (saleId) => {
    const fullSale = await saleService.getSale(saleId);
    setSale(fullSale);
    setSearchResults([]);
    setSelectedItems({});
  };

  const toggleItem = (saleItem) => {
    setSelectedItems((prev) => {
      const next = { ...prev };
      if (next[saleItem.id]) {
        delete next[saleItem.id];
      } else {
        next[saleItem.id] = saleItem.quantity;
      }
      return next;
    });
  };

  const updateQuantity = (saleItemId, quantity, max) => {
    setSelectedItems((prev) => ({ ...prev, [saleItemId]: Math.max(1, Math.min(max, Number(quantity) || 1)) }));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setFormError('');

    const items = Object.entries(selectedItems).map(([saleItemId, quantity]) => ({
      saleItemId: Number(saleItemId),
      quantity,
    }));
    if (items.length === 0) {
      setFormError('Select at least one item to return');
      return;
    }

    setSubmitting(true);
    try {
      const created = await returnService.createReturn({ saleId: sale.id, reason, refundMethod, items });
      navigate(`/returns/${created.id}`, { replace: true });
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create the return request.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">New Return</h1>
          <p className="page-subtitle">Locate the original sale, choose items to return, and set a reason and refund method</p>
        </div>
      </div>

      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}

      {!sale ? (
        <div className="card">
          <div className="card-header"><span className="card-title">Locate Original Sale</span></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label" htmlFor="saleQuery">Sale Number</label>
                <input
                  id="saleQuery"
                  className="form-control"
                  value={saleQuery}
                  onChange={(e) => setSaleQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && findSale()}
                  placeholder="e.g. SAL-2026-000001"
                />
              </div>
              <div className="form-group" style={{ alignSelf: 'flex-end' }}>
                <button type="button" className={`btn btn-primary ${searching ? 'btn-loading' : ''}`} onClick={findSale}>
                  <FiSearch aria-hidden="true" /> Find Sale
                </button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="table-wrapper">
                <table className="table">
                  <thead>
                    <tr><th>Sale #</th><th>Branch</th><th>Amount</th><th /></tr>
                  </thead>
                  <tbody>
                    {searchResults.map((row) => (
                      <tr key={row.id}>
                        <td>{row.sale_number}</td>
                        <td>{row.branch_name}</td>
                        <td>{formatCurrency(row.total_amount)}</td>
                        <td>
                          <button type="button" className="btn btn-secondary btn-sm" onClick={() => selectSale(row.id)}>Select</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {searchResults.length === 0 && saleQuery && !searching && (
              <p className="text-sm text-secondary mt-3">Search for a sale number to begin.</p>
            )}
          </div>
        </div>
      ) : (
        <form onSubmit={onSubmit}>
          <div className="card mb-5">
            <div className="card-header">
              <span className="card-title">{sale.sale_number}</span>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => setSale(null)}>Change Sale</button>
            </div>
            <div className="table-wrapper">
              <table className="table">
                <thead>
                  <tr><th /><th>Product</th><th>Sold Qty</th><th>Return Qty</th><th>Unit Price</th></tr>
                </thead>
                <tbody>
                  {sale.items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <input
                          type="checkbox"
                          checked={Boolean(selectedItems[item.id])}
                          onChange={() => toggleItem(item)}
                          aria-label={`Return ${item.product_name}`}
                        />
                      </td>
                      <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                      <td>{item.quantity}</td>
                      <td style={{ width: 100 }}>
                        <input
                          type="number"
                          min="1"
                          max={item.quantity}
                          className="form-control"
                          disabled={!selectedItems[item.id]}
                          value={selectedItems[item.id] || item.quantity}
                          onChange={(e) => updateQuantity(item.id, e.target.value, item.quantity)}
                        />
                      </td>
                      <td>{formatCurrency(item.unit_price)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="card mb-5">
            <div className="card-header"><span className="card-title">Return Details</span></div>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="reason">Reason</label>
                  <select id="reason" className="form-control" value={reason} onChange={(e) => setReason(e.target.value)}>
                    {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label form-label-required" htmlFor="refundMethod">Refund Method</label>
                  <select id="refundMethod" className="form-control" value={refundMethod} onChange={(e) => setRefundMethod(e.target.value)}>
                    {REFUND_METHODS.map((m) => <option key={m.value} value={m.value}>{m.label}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/returns')}>Cancel</button>
            <button type="submit" className={`btn btn-primary ${submitting ? 'btn-loading' : ''}`} disabled={submitting}>
              Submit Return Request
            </button>
          </div>
        </form>
      )}
    </div>
  );
}

export default ReturnForm;
