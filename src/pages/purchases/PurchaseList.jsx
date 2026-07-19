import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as purchaseService from '../../services/purchaseService';
import { formatCurrency } from '../../utils/formatCurrency';

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

const STATUS_BADGE = { received: 'badge-success', pending: 'badge-warning', cancelled: 'badge-danger' };

function PurchaseList() {
  const navigate = useNavigate();
  const canCreate = usePermission('purchases.create');

  const fetchPurchases = useCallback((params) => purchaseService.listPurchases(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchPurchases);

  const columns = [
    { key: 'purchase_number', label: 'Purchase #' },
    { key: 'supplier_name', label: 'Supplier' },
    { key: 'branch_name', label: 'Branch' },
    { key: 'total_amount', label: 'Amount', render: (row) => formatCurrency(row.total_amount) },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    { key: 'status', label: 'Status', render: (row) => <span className={`badge ${STATUS_BADGE[row.status] || 'badge-neutral'}`}>{row.status}</span> },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/purchases/${row.id}`)} aria-label="View purchase">
            <FiEye />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Purchases</h1>
          <p className="page-subtitle">Purchase orders received from suppliers</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/purchases/new')}>
              <FiPlus aria-hidden="true" /> New Purchase
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by purchase number..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No purchases recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default PurchaseList;
