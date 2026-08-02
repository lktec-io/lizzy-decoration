import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('users');
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

  const statusLabel = (status) => {
    if (status === 'active') return t('common:active');
    if (status === 'suspended') return t('suspended');
    if (status === 'locked') return t('locked');
    return status;
  };

  const handleToggleStatus = async (user) => {
    setActionError('');
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await userService.changeUserStatus(user.id, nextStatus);
      toast.success(nextStatus === 'active' ? t('userActivated') : t('userSuspended'));
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('failedToUpdateStatus'));
    }
  };

  const handleDelete = async () => {
    await userService.deleteUser(pendingDelete.id);
    toast.success(t('userDeleted'));
    refetch();
  };

  const columns = [
    {
      key: 'name',
      label: t('common:name'),
      render: (row) => (
        <div className="flex items-center gap-2">
          <span className="navbar-user-avatar" style={{ width: 28, height: 28, fontSize: 'var(--font-size-xs)' }}>
            {row.first_name.charAt(0).toUpperCase()}
          </span>
          <span>{row.first_name} {row.last_name}</span>
        </div>
      ),
    },
    { key: 'username', label: t('username') },
    { key: 'email', label: t('common:email') },
    { key: 'phone', label: t('common:phone') },
    { key: 'role_name', label: t('role') },
    { key: 'branch_name', label: t('common:branch'), render: (row) => row.branch_name || '—' },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => <span className={`badge ${STATUS_BADGE[row.status]}`}>{statusLabel(row.status)}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/users/${row.id}/edit`)} aria-label={t('editUserAria')}>
              <FiEdit2 />
            </button>
          )}
          {canEdit && row.status !== 'locked' && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => handleToggleStatus(row)}
              aria-label={row.status === 'active' ? t('suspendUserAria') : t('activateUserAria')}
            >
              {row.status === 'active' ? <FiUserX /> : <FiUserCheck />}
            </button>
          )}
          {canDelete && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteUserAria')}>
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
          <h1 className="page-title">{t('listTitle')}</h1>
          <p className="page-subtitle">{t('listSubtitle')}</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/settings/users/new')}>
              <FiPlus aria-hidden="true" /> {t('newUser')}
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
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchUsers')} />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage={t('noUsersFound')} />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <span className="navbar-user-avatar" style={{ width: 44, height: 44, fontSize: 'var(--font-size-md)' }}>
                    {row.first_name.charAt(0).toUpperCase()}
                  </span>
                  <span className={`badge ${STATUS_BADGE[row.status]}`}>{statusLabel(row.status)}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.first_name} {row.last_name}</div>
                  <div className="management-grid-card-subtitle">{row.email}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.role_name}</span>
                  <span>{row.branch_name || t('noBranchAssigned')}</span>
                </div>
                <div className="management-grid-card-footer">
                  <div className="table-actions">
                    {canEdit && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/users/${row.id}/edit`)} aria-label={t('editUserAria')}>
                        <FiEdit2 />
                      </button>
                    )}
                    {canEdit && row.status !== 'locked' && (
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleStatus(row)}
                        aria-label={row.status === 'active' ? t('suspendUserAria') : t('activateUserAria')}
                      >
                        {row.status === 'active' ? <FiUserX /> : <FiUserCheck />}
                      </button>
                    )}
                    {canDelete && (
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => setPendingDelete(row)} aria-label={t('deleteUserAria')}>
                        <FiTrash2 />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
            {!loading && items.length === 0 && (
              <div className="text-sm text-secondary" style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 'var(--space-8)' }}>
                {t('noUsersFound')}
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
        title={t('deleteUserTitle')}
        message={pendingDelete ? t('deleteUserMessage', { name: `${pendingDelete.first_name} ${pendingDelete.last_name}` }) : ''}
        confirmLabel={t('common:delete')}
      />
    </div>
  );
}

export default UserList;
