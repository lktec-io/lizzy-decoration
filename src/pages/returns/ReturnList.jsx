import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
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
  changed_mind: 'Changed Mind',
  expired: 'Expired Product',
  other: 'Other',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function ReturnList() {
  const navigate = useNavigate();
  const canCreate = usePermission('returns.create');

  const fetchReturns = useCallback((params) => returnService.listReturns(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchReturns);

  const columns = [
    { key: 'return_number', label: 'Return #' },
    { key: 'sale_number', label: 'Original Sale' },
    {
      key: 'customer',
      label: 'Customer',
      render: (row) => (row.customer_first_name ? `${row.customer_first_name} ${row.customer_last_name}` : 'Walk-in'),
    },
    { key: 'reason', label: 'Reason', render: (row) => REASON_LABELS[row.reason] || row.reason },
    { key: 'refund_amount', label: 'Refund', render: (row) => (row.refund_amount != null ? formatCurrency(row.refund_amount) : '—') },
    { key: 'created_at', label: 'Date', render: (row) => formatDate(row.created_at) },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${STATUS_BADGE[row.status] || 'badge-neutral'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/returns/${row.id}`)} aria-label="View return">
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
          <h1 className="page-title">Returns</h1>
          <p className="page-subtitle">Customer returns and refunds against completed sales</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/returns/new')}>
              <FiPlus aria-hidden="true" /> New Return
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by return or sale number..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No returns recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default ReturnList;
