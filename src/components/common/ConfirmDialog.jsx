import { useState } from 'react';
import Modal from './Modal';

function ConfirmDialog({ open, onClose, onConfirm, title = 'Are you sure?', message, confirmLabel = 'Confirm', variant = 'danger' }) {
  const [submitting, setSubmitting] = useState(false);

  const handleConfirm = async () => {
    setSubmitting(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={onClose} disabled={submitting}>
            Cancel
          </button>
          <button
            type="button"
            className={`btn btn-${variant} ${submitting ? 'btn-loading' : ''}`}
            onClick={handleConfirm}
            disabled={submitting}
          >
            {confirmLabel}
          </button>
        </>
      }
    >
      <p className="text-sm text-secondary">{message}</p>
    </Modal>
  );
}

export default ConfirmDialog;
