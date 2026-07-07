import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { useTable } from '../../hooks/useTable';
import * as inventoryService from '../../services/inventoryService';
import * as branchService from '../../services/branchService';
import { formatNumber } from '../../utils/formatCurrency';

const MOVEMENT_TYPES = [
  'purchase', 'sale', 'return', 'transfer_out', 'transfer_in', 'adjustment', 'opening_balance', 'manual_correction',
];

const MOVEMENT_BADGE = {
  purchase: 'badge-success',
  sale: 'badge-info',
  return: 'badge-warning',
  transfer_out: 'badge-neutral',
  transfer_in: 'badge-neutral',
  adjustment: 'badge-warning',
  opening_balance: 'badge-neutral',
  manual_correction: 'badge-danger',
};

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function StockMovements() {
  const [branches, setBranches] = useState([]);

  const fetchMovements = useCallback((params) => inventoryService.listMovements(params), []);
  const { items, meta, loading, page, setPage, filters, setFilters } = useTable(fetchMovements);

  useEffect(() => {
    branchService.listActiveBranches().then(setBranches);
  }, []);

  const columns = [
    { key: 'created_at', label: 'Date', render: (row) => formatDateTime(row.created_at) },
    { key: 'product_name', label: 'Product', render: (row) => <div>{row.product_name}<div className="text-xs text-secondary">{row.product_code}</div></div> },
    { key: 'branch_name', label: 'Branch' },
    {
      key: 'movement_type',
      label: 'Type',
      render: (row) => <span className={`badge ${MOVEMENT_BADGE[row.movement_type] || 'badge-neutral'}`}>{row.movement_type.replace('_', ' ')}</span>,
    },
    {
      key: 'quantity_change',
      label: 'Change',
      render: (row) => (
        <span className={row.quantity_change >= 0 ? 'text-success' : 'text-danger'}>
          {row.quantity_change >= 0 ? '+' : ''}{formatNumber(row.quantity_change)}
        </span>
      ),
    },
    { key: 'new_stock', label: 'Resulting Stock', render: (row) => formatNumber(row.new_stock) },
    { key: 'user', label: 'By', render: (row) => `${row.user_first_name} ${row.user_last_name}` },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <Link to="/inventory" className="btn btn-ghost btn-sm mb-2">
            <FiArrowLeft aria-hidden="true" /> Back to Inventory
          </Link>
          <h1 className="page-title">Stock Movements</h1>
          <p className="page-subtitle">Full audit trail of every stock change</p>
        </div>
      </div>

      <div className="card">
        <div className="table-toolbar">
          <div className="flex items-center gap-3">
            <select className="form-control" value={filters.branchId || ''} onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}>
              <option value="">All Branches</option>
              {branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select className="form-control" value={filters.movementType || ''} onChange={(e) => setFilters((prev) => ({ ...prev, movementType: e.target.value || undefined }))}>
              <option value="">All Movement Types</option>
              {MOVEMENT_TYPES.map((t) => <option key={t} value={t}>{t.replace('_', ' ')}</option>)}
            </select>
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No stock movements recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default StockMovements;
