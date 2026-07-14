import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiPlus, FiEdit2, FiTrash2, FiUserCheck, FiUserX } from 'react-icons/fi';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import ConfirmDialog from '../../components/common/ConfirmDialog';
import ViewToggle from '../../components/common/ViewToggle';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import { useToast } from '../../hooks/useToast';
import SettingsTabs from '../../components/common/SettingsTabs';
import * as userService from '../../services/userService';
import '../../styles/pages/Notifications.css';
import '../../styles/components/ViewToggle.css';

const STATUS_BADGE = {
  active: 'badge-success',
  suspended: 'badge-warning',
  locked: 'badge-danger',
};

function UserList() {
  const navigate = useNavigate();
  const canCreate = usePermission('users.create');
  const canEdit = usePermission('users.edit');
  const canDelete = usePermission('users.delete');
  const toast = useToast();

  const [pendingDelete, setPendingDelete] = useState(null);
  const [actionError, setActionError] = useState('');
  const [view, setView] = useState('list');

  const fetchUsers = useCallback((params) => userService.listUsers(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, refetch } = useTable(fetchUsers);

  const handleToggleStatus = async (user) => {
    setActionError('');
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await userService.changeUserStatus(user.id, nextStatus);
      toast.success(nextStatus === 'active' ? 'User activated.' : 'User suspended.');
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || 'Failed to update status.');
    }
  };

  const handleDelete = async () => {
    await userService.deleteUser(pendingDelete.id);
    toast.success('User deleted.');
    refetch();
  };

  const columns = [
    {
      key: 'name',
      label: 'Name',
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="navbar-user-avatar" style={{ width: 28, height: 28, fontSize: 'var(--font-size-xs)' }}>
            {row.first_name.charAt(0).toUpperCase()}
          </span>
          <span>{row.first_name} {row.last_name}</span>
        </div>
      ),
    },
    { key: 'username', label: 'Username' },
    { key: 'email', label: 'Email' },
    { key: 'phone', label: 'Phone' },
    { key: 'role_name', label: 'Role' },
    { key: 'branch_name', label: 'Branch', render: (row) => row.branch_name || '—' },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/users/${row.id}/edit`)} aria-label="Edit user">
              <FiEdit2 />
            </button>
          )}
          {canEdit && row.status !== 'locked' && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => handleToggleStatus(row)}
              aria-label={row.status === 'active' ? 'Suspend user' : 'Activate user'}
            >
              {row.status === 'active' ? <FiUserX /> : <FiUserCheck />}
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete user">
              <FiTrash2 />
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
          <h1 className="page-title">Users</h1>
          <p className="page-subtitle">Manage staff accounts, roles and branch assignments</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/settings/users/new')}>
              <FiPlus aria-hidden="true" /> New User
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      {actionError && (
        <div className="alert alert-danger mb-4" role="alert">
          {actionError}
        </div>
      )}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder="Search by name, email, username..." />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage="No users found" />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <span className="navbar-user-avatar" style={{ width: 44, height: 44, fontSize: 'var(--font-size-md)' }}>
                    {row.first_name.charAt(0).toUpperCase()}
                  </span>
                  <span className={`badge ${STATUS_BADGE[row.status]}`}>{row.status}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.first_name} {row.last_name}</div>
                  <div className="management-grid-card-subtitle">{row.email}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.role_name}</span>
                  <span>{row.branch_name || 'No branch assigned'}</span>
                </div>
                <div className="management-grid-card-footer">
                  <div className="table-actions">
                    {canEdit && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/users/${row.id}/edit`)} aria-label="Edit user">
                        <FiEdit2 />
                      </button>
                    )}
                    {canEdit && row.status !== 'locked' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleStatus(row)}
                        aria-label={row.status === 'active' ? 'Suspend user' : 'Activate user'}
                      >
                        {row.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label="Delete user">
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                No users found
              </div>
            )}
          </div>
        )}

        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>

      <ConfirmDialog
        open={Boolean(pendingDelete)}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleDelete}
        title="Delete user"
        message={pendingDelete ? `Delete "${pendingDelete.first_name} ${pendingDelete.last_name}"? This cannot be undone.` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}

export default UserList;
