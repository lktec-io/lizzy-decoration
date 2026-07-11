import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm, useFieldArray } from 'react-hook-form';
import {
  FiEdit3, FiClock, FiBox, FiDollarSign, FiAlertTriangle, FiXCircle,
  FiRepeat, FiPlus, FiTrash2, FiCheck, FiX, FiEye,
} from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as inventoryService from '../../services/inventoryService';
import * as branchService from '../../services/branchService';
import * as transferService from '../../services/transferService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost' },
  { value: 'correction', label: 'Correction' },
  { value: 'initial_count', label: 'Initial Count' },
  { value: 'system_error', label: 'System Error' },
];

const TRANSFER_STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  completed: 'badge-success',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

const EMPTY_TRANSFER_FORM = { sourceBranchId: '', destinationBranchId: '', items: [{ productId: '', quantity: 1 }] };

// Same field logic as the former standalone TransferForm.jsx (branch
// pickers, per-source-branch stock item rows, quantity-vs-available
// validation) — reused here nearly as-is, just wrapped in a Modal with
// onClose/onCreated callbacks instead of its own route and navigate() calls.
function TransferStockModal({ open, onClose, onCreated }) {
  const [branches, setBranches] = useState([]);
  const [sourceStock, setSourceStock] = useState([]);
  const [formError, setFormError] = useState('');

  const {
    register, control, handleSubmit, watch, reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: EMPTY_TRANSFER_FORM });

  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const watchedItems = watch('items');
  const sourceBranchId = watch('sourceBranchId');

  useEffect(() => {
    if (open) branchService.listActiveBranches().then(setBranches);
  }, [open]);

  useEffect(() => {
    if (!sourceBranchId) {
      setSourceStock([]);
      return;
    }
    inventoryService
      .listInventory({ branchId: sourceBranchId, limit: 200 })
      .then((result) => setSourceStock(result.items.filter((row) => row.available_quantity > 0)));
  }, [sourceBranchId]);

  const availableFor = (productId) => sourceStock.find((row) => String(row.product_id) === String(productId))?.available_quantity ?? 0;

  const handleClose = () => {
    reset(EMPTY_TRANSFER_FORM);
    setFormError('');
    onClose();
  };

  const onSubmit = async (values) => {
    setFormError('');
    const payload = {
      sourceBranchId: Number(values.sourceBranchId),
      destinationBranchId: Number(values.destinationBranchId),
      items: values.items.map((item) => ({ productId: Number(item.productId), quantity: Number(item.quantity) })),
    };
    try {
      await transferService.createTransfer(payload);
      reset(EMPTY_TRANSFER_FORM);
      onCreated();
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create transfer.');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Transfer Stock"
      size="lg"
      footer={
        <>
          <button type="button" className="btn btn-secondary" onClick={handleClose}>Cancel</button>
          <button type="submit" form="transfer-stock-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
            Submit Transfer Request
          </button>
        </>
      }
    >
      {formError && <div className="alert alert-danger mb-4" role="alert">{formError}</div>}
      <form id="transfer-stock-form" onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="form-row">
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="transferSourceBranchId">Source Branch</label>
            <select
              id="transferSourceBranchId"
              className={`form-control ${errors.sourceBranchId ? 'form-control-error' : ''}`}
              {...register('sourceBranchId', { required: 'Source branch is required' })}
            >
              <option value="">Select a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.sourceBranchId && <span className="form-error">{errors.sourceBranchId.message}</span>}
          </div>
          <div className="form-group">
            <label className="form-label form-label-required" htmlFor="transferDestinationBranchId">Destination Branch</label>
            <select
              id="transferDestinationBranchId"
              className={`form-control ${errors.destinationBranchId ? 'form-control-error' : ''}`}
              {...register('destinationBranchId', {
                required: 'Destination branch is required',
                validate: (value) => String(value) !== String(sourceBranchId) || 'Destination must differ from source branch',
              })}
            >
              <option value="">Select a branch</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            {errors.destinationBranchId && <span className="form-error">{errors.destinationBranchId.message}</span>}
          </div>
        </div>

        {!sourceBranchId ? (
          <p className="text-sm text-secondary">Select a source branch to see available stock.</p>
        ) : (
          <div className="table-wrapper">
            <div className="flex items-center justify-between mb-2">
              <span className="card-title">Items</span>
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => append({ productId: '', quantity: 1 })}>
                <FiPlus aria-hidden="true" /> Add Line
              </button>
            </div>
            <table className="table">
              <thead>
                <tr><th>Product</th><th>Available</th><th>Quantity</th><th /></tr>
              </thead>
              <tbody>
                {fields.map((field, index) => {
                  const productId = watchedItems[index]?.productId;
                  const available = availableFor(productId);
                  const qty = Number(watchedItems[index]?.quantity) || 0;
                  const overLimit = productId && qty > available;
                  return (
                    <tr key={field.id}>
                      <td>
                        <select className="form-control" {...register(`items.${index}.productId`, { required: true })}>
                          <option value="">Select product</option>
                          {sourceStock.map((row) => (
                            <option key={row.product_id} value={row.product_id}>
                              {row.product_name} ({row.product_code})
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="text-sm">{productId ? available : '—'}</td>
                      <td style={{ width: 100 }}>
                        <input
                          type="number"
                          min="1"
                          className={`form-control ${overLimit ? 'form-control-error' : ''}`}
                          {...register(`items.${index}.quantity`, { required: true, min: 1 })}
                        />
                        {overLimit && <span className="form-error">Exceeds available stock</span>}
                      </td>
                      <td>
                        {fields.length > 1 && (
                          <button type="button" className="btn btn-ghost btn-icon" onClick={() => remove(index)} aria-label="Remove line">
                            <FiTrash2 />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </form>
    </Modal>
  );
}

// Same approve/reject workflow as the former standalone TransferDetail.jsx
// — reused nearly as-is, shown in a Modal instead of a route so approving
// or rejecting a pending transfer never leaves the Inventory page.
function TransferDetailModal({ transferId, onClose, onResolved }) {
  const canApprove = usePermission('transfers.approve');
  const [transfer, setTransfer] = useState(null);
  const [dialog, setDialog] = useState(null);
  const [actionError, setActionError] = useState('');

  const loadTransfer = useCallback(() => {
    if (!transferId) return;
    transferService.getTransfer(transferId).then(setTransfer);
  }, [transferId]);

  useEffect(() => {
    loadTransfer();
  }, [loadTransfer]);

  const handleApprove = async () => {
    setActionError('');
    try {
      await transferService.approveTransfer(transferId);
      loadTransfer();
      onResolved();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to approve transfer.');
    }
  };

  const handleReject = async () => {
    setActionError('');
    try {
      await transferService.rejectTransfer(transferId);
      loadTransfer();
      onResolved();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to reject transfer.');
    }
  };

  const isPending = transfer?.status === 'pending';

  return (
    <>
      <Modal
        open={Boolean(transferId)}
        onClose={onClose}
        title={transfer?.transfer_number || 'Transfer'}
        size="md"
        footer={
          canApprove && isPending ? (
            <>
              <button type="button" className="btn btn-danger" onClick={() => setDialog('reject')}>
                <FiX aria-hidden="true" /> Reject
              </button>
              <button type="button" className="btn btn-primary" onClick={() => setDialog('approve')}>
                <FiCheck aria-hidden="true" /> Approve
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-secondary" onClick={onClose}>Close</button>
          )
        }
      >
        {!transfer ? (
          <div className="flex items-center justify-center p-6"><span className="spinner" aria-label="Loading" /></div>
        ) : (
          <>
            {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}
            <p className="text-sm mb-4">
              {transfer.source_branch_name} → {transfer.destination_branch_name} · {formatDateTime(transfer.created_at)}
            </p>
            <div className="form-row mb-4">
              <div>
                <span className="text-xs text-secondary">Status</span>
                <div><span className={`badge ${TRANSFER_STATUS_BADGE[transfer.status] || 'badge-neutral'}`}>{transfer.status}</span></div>
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
            <table className="table">
              <thead><tr><th>Product</th><th>Quantity</th></tr></thead>
              <tbody>
                {transfer.items.map((item) => (
                  <tr key={item.id}>
                    <td>{item.product_name}<div className="text-xs text-secondary">{item.product_code}</div></td>
                    <td>{item.quantity}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}
      </Modal>

      <ConfirmDialog
        open={dialog === 'approve'}
        onClose={() => setDialog(null)}
        onConfirm={handleApprove}
        title="Approve Transfer"
        message={transfer ? `Approving will move stock from "${transfer.source_branch_name}" to "${transfer.destination_branch_name}" immediately.` : ''}
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
    </>
  );
}

function InventoryOverview() {
  const canAdjust = usePermission('inventory.adjust');
  const canCreateTransfer = usePermission('transfers.create');

  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [adjustingRow, setAdjustingRow] = useState(null);
  const [modalError, setModalError] = useState('');
  const [transferModalOpen, setTransferModalOpen] = useState(false);
  const [pendingTransfers, setPendingTransfers] = useState([]);
  const [pendingTransfersLoading, setPendingTransfersLoading] = useState(true);
  const [viewingTransferId, setViewingTransferId] = useState(null);

  const fetchInventory = useCallback((params) => inventoryService.listInventory(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchInventory);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { quantityChange: '', reason: 'correction', description: '' } });

  const loadPendingTransfers = useCallback(() => {
    setPendingTransfersLoading(true);
    transferService
      .listTransfers({ status: 'pending', limit: 10 })
      .then((result) => setPendingTransfers(result.items))
      .finally(() => setPendingTransfersLoading(false));
  }, []);

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
    inventoryService.getInventorySummary().then(setSummary);
    // eslint-disable-next-line react-hooks/set-state-in-effect -- same accepted pattern as useTable.js's own load() call
    loadPendingTransfers();
  }, [loadPendingTransfers]);

  const openAdjust = (row) => {
    setAdjustingRow(row);
    reset({ quantityChange: '', reason: 'correction', description: '' });
    setModalError('');
  };

  const onSubmitAdjustment = async (values) => {
    setModalError('');
    try {
      await inventoryService.createAdjustment({
        productId: adjustingRow.product_id,
        branchId: adjustingRow.branch_id,
        quantityChange: Number(values.quantityChange),
        reason: values.reason,
        description: values.description,
      });
      setAdjustingRow(null);
      refetch();
      inventoryService.getInventorySummary().then(setSummary);
    } catch (err) {
      setModalError(err.response?.data?.message || 'Failed to record adjustment.');
    }
  };

  const handleTransferCreated = () => {
    setTransferModalOpen(false);
    loadPendingTransfers();
  };

  const handleTransferResolved = () => {
    refetch();
    inventoryService.getInventorySummary().then(setSummary);
    loadPendingTransfers();
  };

  const columns = [
    { key: 'product_name', label: 'Product', render: (row) => <div>{row.product_name}<div className="text-xs text-secondary">{row.product_code}</div></div> },
    { key: 'branch_name', label: 'Branch' },
    { key: 'quantity', label: 'Current Stock', render: (row) => formatNumber(row.quantity) },
    { key: 'available_quantity', label: 'Available', render: (row) => formatNumber(row.available_quantity) },
    { key: 'min_stock', label: 'Min Stock', render: (row) => formatNumber(row.min_stock) },
    {
      key: 'level',
      label: 'Level',
      render: (row) => {
        if (row.quantity === 0) return <span className="badge badge-danger">Out of Stock</span>;
        if (row.quantity <= row.min_stock) return <span className="badge badge-warning">Low Stock</span>;
        return <span className="badge badge-success">In Stock</span>;
      },
    },
    {
      key: 'actions',
      label: '',
      render: (row) => canAdjust && (
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => openAdjust(row)} aria-label="Adjust stock">
          <FiEdit3 />
        </button>
      ),
    },
  ];

  const transferColumns = [
    { key: 'transfer_number', label: 'Transfer #' },
    { key: 'source_branch_name', label: 'From' },
    { key: 'destination_branch_name', label: 'To' },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${TRANSFER_STATUS_BADGE[row.status] || 'badge-neutral'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <button type="button" className="btn btn-ghost btn-icon" onClick={() => setViewingTransferId(row.id)} aria-label="View transfer">
          <FiEye />
        </button>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Current stock levels across branches</p>
        </div>
        <div className="page-actions">
          {canCreateTransfer && (
            <button type="button" className="btn btn-secondary" onClick={() => setTransferModalOpen(true)}>
              <FiRepeat aria-hidden="true" /> Transfer Stock
            </button>
          )}
          <Link to="/inventory/movements" className="btn btn-secondary">
            <FiClock aria-hidden="true" /> Movement History
          </Link>
        </div>
      </div>

      {summary && (
        <div className="grid grid-cols-4 mb-5">
          <KPICard icon={FiBox} label="Total Products" value={summary.totalProducts} formatter={formatNumber} />
          <KPICard icon={FiDollarSign} label="Inventory Value" value={summary.totalValue} formatter={(v) => formatCurrency(v)} />
          <KPICard icon={FiAlertTriangle} label="Low Stock" value={summary.lowStock} formatter={formatNumber} />
          <KPICard icon={FiXCircle} label="Out of Stock" value={summary.outOfStock} formatter={formatNumber} />
        </div>
      )}

      <div className="card mb-5">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by product name or code..." />
          <div className="flex flex-wrap items-center gap-3">
            <select className="form-control" value={filters.branchId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}>
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <label className="form-checkbox">
              <input type="checkbox" checked={Boolean(filters.lowStock)} onChange={(e) => setFilters((prev) => ({ ...prev, lowStock: e.target.checked || undefined }))} />
              Low Stock
            </label>
            <label className="form-checkbox">
              <input type="checkbox" checked={Boolean(filters.outOfStock)} onChange={(e) => setFilters((prev) => ({ ...prev, outOfStock: e.target.checked || undefined }))} />
              Out of Stock
            </label>
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No inventory records found" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <div className="card">
        <div className="card-header"><span className="card-title">Pending Transfers</span></div>
        <Table columns={transferColumns} rows={pendingTransfers} loading={pendingTransfersLoading} emptyMessage="No pending stock transfers" />
      </div>

      <Modal
        open={Boolean(adjustingRow)}
        onClose={() => setAdjustingRow(null)}
        title="Adjust Stock"
        size="sm"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setAdjustingRow(null)}>Cancel</button>
            <button type="submit" form="adjustment-form" className={`btn btn-primary ${isSubmitting ? 'btn-loading' : ''}`} disabled={isSubmitting}>
              Save Adjustment
            </button>
          </>
        }
      >
        {adjustingRow && (
          <>
            <p className="text-sm mb-4">
              <strong>{adjustingRow.product_name}</strong> at {adjustingRow.branch_name} — current stock: {formatNumber(adjustingRow.quantity)}
            </p>
            {modalError && <div className="alert alert-danger mb-4" role="alert">{modalError}</div>}
            <form id="adjustment-form" onSubmit={handleSubmit(onSubmitAdjustment)} noValidate>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="quantityChange">
                  Quantity Change (use a negative number to remove stock)
                </label>
                <input
                  id="quantityChange"
                  type="number"
                  className={`form-control ${errors.quantityChange ? 'form-control-error' : ''}`}
                  {...register('quantityChange', { required: 'Quantity is required', validate: (v) => Number(v) !== 0 || 'Cannot be zero' })}
                />
                {errors.quantityChange && <span className="form-error">{errors.quantityChange.message}</span>}
              </div>
              <div className="form-group">
                <label className="form-label form-label-required" htmlFor="reason">Reason</label>
                <select id="reason" className="form-control" {...register('reason')}>
                  {REASONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="description">Description</label>
                <textarea id="description" className="form-control" {...register('description')} />
              </div>
            </form>
          </>
        )}
      </Modal>

      <TransferStockModal
        open={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
        onCreated={handleTransferCreated}
      />

      <TransferDetailModal
        transferId={viewingTransferId}
        onClose={() => setViewingTransferId(null)}
        onResolved={handleTransferResolved}
      />
    </div>
  );
}

export default InventoryOverview;
