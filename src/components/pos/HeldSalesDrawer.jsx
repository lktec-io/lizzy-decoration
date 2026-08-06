import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiPlayCircle, FiTrash2, FiClock } from 'react-icons/fi';
import Modal from '../common/Modal';
import ConfirmDialog from '../common/ConfirmDialog';
import EmptyState from '../common/EmptyState';
import * as heldSaleService from '../../services/heldSaleService';
import { useToast } from '../../hooks/useToast';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

// A modal (not a bespoke side panel) — reuses the exact same glass modal
// system every other POS overlay (Scanner, Quick Customer, Sale Completed)
// already uses, per the "one consistent design language" convention
// established elsewhere in POS.jsx.
function HeldSalesDrawer({ open, onClose, branchId, onResume, onListChange }) {
  const { t } = useTranslation('pos');
  const toast = useToast();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const load = () => {
    setLoading(true);
    heldSaleService.listHeldSales(branchId)
      .then((rows) => {
        setItems(rows);
        onListChange?.(rows.length);
      })
      .catch(() => toast.error(t('failedToLoadHeldSales')))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- data fetch on open/branch change, same pattern as useTable.js
    if (open) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reload whenever the drawer opens or the branch changes
  }, [open, branchId]);

  const handleResume = (held) => {
    onResume(held);
    onClose();
  };

  const handleDelete = async () => {
    await heldSaleService.deleteHeldSale(deleteTarget.id);
    setItems((prev) => {
      const next = prev.filter((row) => row.id !== deleteTarget.id);
      onListChange?.(next.length);
      return next;
    });
  };

  return (
    <>
      <Modal open={open} onClose={onClose} title={t('heldSalesTitle')} size="lg">
        {loading ? (
          <div className="flex items-center justify-center p-6"><span className="spinner" aria-label={t('common:loading')} /></div>
        ) : items.length === 0 ? (
          <EmptyState icon={FiClock} title={t('noHeldSales')} description={t('noHeldSalesDescription')} />
        ) : (
          <div className="held-sales-list">
            {items.map((held) => (
              <div key={held.id} className="held-sales-list-item">
                <div className="held-sales-list-main">
                  <span className="held-sales-list-number">{held.hold_number}</span>
                  <span className="held-sales-list-customer">{held.customer_name || t('walkInCustomer')}</span>
                  <span className="held-sales-list-meta">
                    {t('itemsCount', { count: held.items_count })} · {formatDateTime(held.created_at)} · {held.held_by_name}
                  </span>
                </div>
                <div className="held-sales-list-side">
                  <span className="held-sales-list-total">{formatCurrency(held.total_amount)}</span>
                  <div className="held-sales-list-actions">
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => handleResume(held)}>
                      <FiPlayCircle aria-hidden="true" /> {t('resume')}
                    </button>
                    <button
                      type="button"
                      className="btn btn-ghost btn-icon"
                      onClick={() => setDeleteTarget(held)}
                      aria-label={t('deleteHoldAria', { number: held.hold_number })}
                    >
                      <FiTrash2 />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title={t('deleteHoldConfirmTitle')}
        message={t('deleteHoldConfirmMessage', { number: deleteTarget?.hold_number })}
        confirmLabel={t('common:delete')}
      />
    </>
  );
}

export default HeldSalesDrawer;
