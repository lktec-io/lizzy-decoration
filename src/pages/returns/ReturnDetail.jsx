import { useCallback, useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FiArrowLeft, FiCheck, FiX } from 'react-icons/fi';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import PageSkeleton from '../../components/common/PageSkeleton';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import * as returnService from '../../services/returnService';
import { formatCurrency } from '../../utils/formatCurrency';

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
};

const REASON_KEYS = {
  damaged: 'reasonDamaged',
  wrong_item: 'reasonWrongItem',
  changed_mind: 'reasonChangedMind',
  expired: 'reasonExpired',
  other: 'reasonOther',
};

const REFUND_METHOD_KEYS = {
  cash: 'common:cash',
  mpesa: 'refundMethodMpesa',
  airtel_money: 'refundMethodAirtelMoney',
  bank_transfer: 'common:bankTransfer',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function ReturnDetail() {
  const { t } = useTranslation('returns');
  const { id } = useParams();
  const navigate = useNavigate();
  const canApprove = usePermission('returns.approve');
  const toast = useToast();
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
    return <PageSkeleton />;
  }

  const handleApprove = async () => {
    setActionError('');
    try {
      await returnService.approveReturn(returnRecord.id);
      toast.success(t('returnApproved'));
      loadReturn();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToApproveReturn'));
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await returnService.rejectReturn(returnRecord.id);
      toast.success(t('returnRejected'));
      loadReturn();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToRejectReturn'));
    }
  };

  const isPending = returnRecord.status === 'pending';
  const STATUS_LABELS = {
    pending: t('statusPending'),
    approved: t('statusApproved'),
    rejected: t('statusRejected'),
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <button type="button" className="btn btn-ghost btn-sm mb-2" onClick={() => navigate('/returns')}>
            <FiArrowLeft aria-hidden="true" /> {t('backToReturns')}
          </button>
          <h1 className="page-title">{returnRecord.return_number}</h1>
          <p className="page-subtitle">
            {t('detailSubtitle', { saleNumber: returnRecord.sale_number, branch: returnRecord.branch_name, date: formatDateTime(returnRecord.created_at) })}
          </p>
        </div>
        {canApprove && isPending && (
          <div className="page-actions">
            <button type="button" className="btn btn-danger" onClick={() => setDialog('reject')}>
              <FiX aria-hidden="true" /> {t('reject')}
            </button>
            <button type="button" className="btn btn-primary" onClick={() => setDialog('approve')}>
              <FiCheck aria-hidden="true" /> {t('approve')}
            </button>
          </div>
        )}
      </div>

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card mb-5">
        <div className="card-body">
          <div className="form-row">
            <div>
              <span className="text-xs text-secondary">{t('common:status')}</span>
              <div><span className={`badge ${STATUS_BADGE[returnRecord.status] || 'badge-neutral'}`}>{STATUS_LABELS[returnRecord.status] || returnRecord.status}</span></div>
            </div>
            <div>
              <span className="text-xs text-secondary">{t('reason')}</span>
              <div className="text-sm">{REASON_KEYS[returnRecord.reason] ? t(REASON_KEYS[returnRecord.reason]) : returnRecord.reason}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">{t('common:customer')}</span>
              <div className="text-sm">
                {returnRecord.customer_first_name ? `${returnRecord.customer_first_name} ${returnRecord.customer_last_name}` : t('walkIn')}
              </div>
            </div>
            <div>
              <span className="text-xs text-secondary">{t('requestedBy')}</span>
              <div className="text-sm">{returnRecord.created_by_first_name} {returnRecord.created_by_last_name}</div>
            </div>
            {returnRecord.approved_by_first_name && (
              <div>
                <span className="text-xs text-secondary">{returnRecord.status === 'rejected' ? t('rejectedBy') : t('approvedBy')}</span>
                <div className="text-sm">{returnRecord.approved_by_first_name} {returnRecord.approved_by_last_name}</div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="card mb-5">
        <div className="card-header"><span className="card-title">{t('returnedItemsCardTitle')}</span></div>
        <div className="table-wrapper">
          <table className="table">
            <thead>
              <tr><th>{t('common:product')}</th><th>{t('common:quantity')}</th><th>{t('common:unitPrice')}</th></tr>
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
        <div className="card-header"><span className="card-title">{t('refundCardTitle')}</span></div>
        <div className="card-body">
          <div className="form-row">
            <div>
              <span className="text-xs text-secondary">{t('refundAmountLabel')}</span>
              <div className="text-sm font-semibold">{formatCurrency(returnRecord.refund_amount)}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">{t('refundMethodLabel')}</span>
              <div className="text-sm">{REFUND_METHOD_KEYS[returnRecord.refund_method] ? t(REFUND_METHOD_KEYS[returnRecord.refund_method]) : returnRecord.refund_method}</div>
            </div>
            <div>
              <span className="text-xs text-secondary">{t('refundStatusLabel')}</span>
              <div><span className={`badge ${returnRecord.refund_status === 'refunded' ? 'badge-success' : 'badge-warning'}`}>{returnRecord.refund_status === 'refunded' ? t('refundStatusRefunded') : t('refundStatusPending')}</span></div>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={handleApprove}
        title={t('approveReturnTitle')}
        message={t('approveReturnMessage')}
        confirmLabel={t('approve')}
        variant="primary"
      />
      <ConfirmDialog
        open={dialog === 'reject'}
        onClose={() => setDialog(null)}
        onConfirm={handleReject}
        title={t('rejectReturnTitle')}
        message={t('rejectReturnMessage')}
        confirmLabel={t('reject')}
        variant="danger"
      />
    </div>
  );
}

export default ReturnDetail;
