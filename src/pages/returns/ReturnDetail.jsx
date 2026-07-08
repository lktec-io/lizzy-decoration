import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import * as returnService from '../../services/returnService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

const REASON_LABELS = {
  damaged: 'Damaged Product',
  wrong_item: 'Wrong Product Issued',
  changed_mind: 'Customer Changed Mind',
  expired: 'Expired Product',
  other: 'Other',
};

const REFUND_METHOD_LABELS = {
  cash: 'Cash',
  mpesa: 'M-Pesa',
  airtel_money: 'Airtel Money',
  bank_transfer: 'Bank Transfer',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function ReturnDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canApprove = usePermission('returns.approve');
  const [returnRecord, setReturnRecord] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadReturn = useCallback(() => {
    returnService.getReturn(id).then(setReturnRecord);
  }, [id]);

  useEffect(() => {
    loadReturn();
  }, [loadReturn]);

  if (!returnRecord) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  const handleApprove = async () => {
    setActionError('');
    try {
      await returnService.approveReturn(returnRecord.id);
      loadReturn();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve return.');
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await returnService.rejectReturn(returnRecord.id);
      loadReturn();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject return.');
    }
  };

  const isPending = returnRecord.status === 'pending';

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/returns')}>
            <FiArrowLeft aria-hidden="true" /> Back to Returns
          </button>
          <h1 className="page-title">{returnRecord.return_number}</h1>
          <p className="page-subtitle">
            Against sale {returnRecord.sale_number} · {returnRecord.branch_name} · {formatDateTime(returnRecord.created_at)}
          </p>
        </div>
        {canApprove && isPending && (
          <div className="page-actions">
            <button type="button" className="btn btn-danger" onClick={() => setDialog('reject')}>
              <FiX aria-hidden="true" /> Reject
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setDialog('approve')}>
              <FiCheck aria-hidden="true" /> Approve
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card mb-5">
        <div className="card-body">
          <div className="form-row">
            <div>
              <span className="text-xs text-secondary">Status</span>
              <div><span className={`badge ${STATUS_BADGE[returnRecord.status] || 'badge-neutral'}`}>{returnRecord.status}</span></div>
            </div>
            <div>
              <span className="text-xs text-secondary">Reason</span>
              <div className="text-sm">{REASON_LABELS[returnRecord.reason] || returnRecord.reason}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">Customer</span>
              <div className="text-sm">
                {returnRecord.customer_first_name ? `${returnRecord.customer_first_name} ${returnRecord.customer_last_name}` : 'Walk-in'}
              </div>
            </div>
            <div>
              <span className="text-xs text-secondary">Requested By</span>
              <div className="text-sm">{returnRecord.created_by_first_name} {returnRecord.created_by_last_name}</div>
            </div>
            {returnRecord.approved_by_first_name && (
              <div>
                <span className="text-xs text-secondary">{returnRecord.status === 'rejected' ? 'Rejected By' : 'Approved By'}</span>
                <div className="text-sm">{returnRecord.approved_by_first_name} {returnRecord.approved_by_last_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-header"><span className="card-title">Returned Items</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>Product</th><th>Quantity</th><th>Unit Price</th></tr>
            </thead>
            <tbody>
              {returnRecord.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                  <td>{item.quantity}</td>
                  <td>{formatCurrency(item.unit_price)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Refund</span></div>
        <div className="card-body">
          <div className="form-row">
            <div>
              <span className="text-xs text-secondary">Refund Amount</span>
              <div className="text-sm font-semibold">{formatCurrency(returnRecord.refund_amount)}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">Refund Method</span>
              <div className="text-sm">{REFUND_METHOD_LABELS[returnRecord.refund_method] || returnRecord.refund_method}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">Refund Status</span>
              <div><span className={`badge ${returnRecord.refund_status === 'refunded' ? 'badge-success' : 'badge-warning'}`}>{returnRecord.refund_status}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={handleApprove}
        title="Approve Return"
        message="Approving will restore stock for the returned items and mark the refund as issued."
        confirmLabel="Approve"
        variant="primary"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={handleReject}
        title="Reject Return"
        message="Rejecting this return will not move any stock or issue a refund. This cannot be undone."
        confirmLabel="Reject"
        variant="danger"
      />
    </div>
  );
}

export default ReturnDetail;
