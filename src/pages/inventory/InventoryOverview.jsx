import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { FiEdit3, FiClock, FiBox, FiDollarSign, FiAlertTriangle, FiXCircle } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import Modal from '../../components/common/Modal';
import KPICard from '../../components/dashboard/KPICard';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as inventoryService from '../../services/inventoryService';
import * as branchService from '../../services/branchService';
import { formatCurrency, formatNumber } from '../../utils/formatCurrency';

const REASONS = [
  { value: 'damaged', label: 'Damaged' },
  { value: 'expired', label: 'Expired' },
  { value: 'lost', label: 'Lost' },
  { value: 'correction', label: 'Correction' },
  { value: 'initial_count', label: 'Initial Count' },
  { value: 'system_error', label: 'System Error' },
];

function InventoryOverview() {
  const canAdjust = usePermission('inventory.adjust');

  const [branches, setBranches] = useState([]);
  const [summary, setSummary] = useState(null);
  const [adjustingRow, setAdjustingRow] = useState(null);
  const [modalError, setModalError] = useState('');

  const fetchInventory = useCallback((params) => inventoryService.listInventory(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters, refetch } = useTable(fetchInventory);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({ defaultValues: { quantityChange: '', reason: 'correction', description: '' } });

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
    inventoryService.getInventorySummary().then(setSummary);
  }, []);

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

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">Current stock levels across branches</p>
        </div>
        <div className="page-actions">
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

      <div className="card">
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
    </div>
  );
}

export default InventoryOverview;
