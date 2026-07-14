import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiToggleLeft, FiToggleRight, FiMapPin } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import ViewToggle from '../../components/common/ViewToggle';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import SettingsTabs from '../../components/common/SettingsTabs';
import * as branchService from '../../services/branchService';
import '../../styles/pages/Notifications.css';
import '../../styles/components/ViewToggle.css';

function BranchList() {
  const navigate = useNavigate();
  const canCreate = usePermission('branches.create');
  const canEdit = usePermission('branches.edit');
  const toast = useToast();

  const [actionError, setActionError] = useState('');
  const [view, setView] = useState('list');
  const fetchBranches = useCallback((params) => branchService.listBranches(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchBranches);

  const handleToggleStatus = async (branch) => {
    setActionError('');
    const nextStatus = branch.status === 'active' ? 'inactive' : 'active';
    try {
      await branchService.changeBranchStatus(branch.id, nextStatus);
      toast.success(nextStatus === 'active' ? 'Branch activated.' : 'Branch deactivated.');
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update branch status.');
    }
  };

  const columns = [
    { key: 'name', label: 'Branch Name' },
    { key: 'code', label: 'Code' },
    {
      key: 'manager',
      label: 'Manager',
      render: (row) => (row.manager_first_name ? `${row.manager_first_name} ${row.manager_last_name}` : '—'),
    },
    { key: 'phone', label: 'Phone', render: (row) => row.phone || '—' },
    { key: 'region', label: 'Region', render: (row) => row.region || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/branches/${row.id}/edit`)} aria-label="Edit branch">
              <FiEdit2 />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => handleToggleStatus(row)}
              aria-label={row.status === 'active' ? 'Deactivate branch' : 'Activate branch'}
            >
              {row.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Branches</h1>
          <p className="page-subtitle">Manage store locations, managers and contact details</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/settings/branches/new')}>
              <FiPlus aria-hidden="true" /> New Branch
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, code, region..." />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage="No branches found" />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <div className="management-grid-card-media">
                    <FiMapPin aria-hidden="true" />
                  </div>
                  <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.name}</div>
                  <div className="management-grid-card-subtitle">{row.code}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.manager_first_name ? `${row.manager_first_name} ${row.manager_last_name}` : 'No manager assigned'}</span>
                  <span>{row.phone || '—'}</span>
                  <span>{row.region || '—'}</span>
                </div>
                {canEdit && (
                  <div className="management-grid-card-footer">
                    <div className="table-actions">
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/branches/${row.id}/edit`)} aria-label="Edit branch">
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleStatus(row)}
                        aria-label={row.status === 'active' ? 'Deactivate branch' : 'Activate branch'}
                      >
                        {row.status === 'active' ? <FiToggleRight /> : <FiToggleLeft />}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                No branches found
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default BranchList;
