import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import { usePermission } from '../../hooks/usePermission';
import * as transferService from '../../services/transferService';

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  completed: 'badge-success',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function TransferDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const canApprove = usePermission('transfers.approve');
  const [transfer, setTransfer] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadTransfer = useCallback(() => {
    transferService.getTransfer(id).then(setTransfer);
  }, [id]);

  useEffect(() => {
    loadTransfer();
  }, [loadTransfer]);

  if (!transfer) {
    return (
      <div className="flex items-center justify-center p-6">
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  const handleApprove = async () => {
    setActionError('');
    try {
      await transferService.approveTransfer(transfer.id);
      loadTransfer();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve transfer.');
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await transferService.rejectTransfer(transfer.id);
      loadTransfer();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject transfer.');
    }
  };

  const isPending = transfer.status === 'pending';

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/transfers')}>
            <FiArrowLeft aria-hidden="true" /> Back to Transfers
          </button>
          <h1 className="page-title">{transfer.transfer_number}</h1>
          <p className="page-subtitle">
            {transfer.source_branch_name} → {transfer.destination_branch_name} · {formatDateTime(transfer.created_at)}
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
              <div><span className={`badge ${STATUS_BADGE[transfer.status] || 'badge-neutral'}`}>{transfer.status}</span></div>
            </div>
            <div>
              <span className="text-xs text-secondary">Requested By</span>
              <div className="text-sm">{transfer.requested_by_first_name} {transfer.requested_by_last_name}</div>
            </div>
            {transfer.approved_by_first_name && (
              <div>
                <span className="text-xs text-secondary">{transfer.status === 'rejected' ? 'Rejected By' : 'Approved By'}</span>
                <div className="text-sm">{transfer.approved_by_first_name} {transfer.approved_by_last_name}</div>
              </div>
            )}
          </div>
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
              </tr>
            </thead>
            <tbody>
              {transfer.items.map((item) => (
                <tr key={item.id}>
                  <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                  <td>{item.quantity}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={handleApprove}
        title="Approve Transfer"
        message={`Approving will move stock from "${transfer.source_branch_name}" to "${transfer.destination_branch_name}" immediately.`}
        confirmLabel="Approve"
        variant="primary"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={handleReject}
        title="Reject Transfer"
        message="Rejecting this transfer will not move any stock. This cannot be undone."
        confirmLabel="Reject"
        variant="danger"
      />
    </div>
  );
}

export default TransferDetail;
