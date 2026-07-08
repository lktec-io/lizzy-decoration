import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEye } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as transferService from '../../services/transferService';

const STATUS_BADGE = {
  pending: 'badge-warning',
  approved: 'badge-success',
  rejected: 'badge-danger',
  completed: 'badge-success',
};

function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-TZ', { dateStyle: 'medium' });
}

function TransferList() {
  const navigate = useNavigate();
  const canCreate = usePermission('transfers.create');

  const fetchTransfers = useCallback((params) => transferService.listTransfers(params), []);
  const { items, meta, loading, page, setPage, search, setSearch } = useTable(fetchTransfers);

  const columns = [
    { key: 'transfer_number', label: 'Transfer #' },
    { key: 'source_branch_name', label: 'From' },
    { key: 'destination_branch_name', label: 'To' },
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
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/transfers/${row.id}`)} aria-label="View transfer">
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
          <h1 className="page-title">Stock Transfers</h1>
          <p className="page-subtitle">Move stock between branches — approval updates inventory automatically</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/transfers/new')}>
              <FiPlus aria-hidden="true" /> New Transfer
            </button>
          </div>
        )}
      </div>

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by transfer number..." />
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No stock transfers recorded yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default TransferList;
