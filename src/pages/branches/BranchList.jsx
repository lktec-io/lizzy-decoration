import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation('branches');
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
      toast.success(nextStatus === 'active' ? t('toast.branchActivated') : t('toast.branchDeactivated'));
      refetch();
    } catch (err) {
      setActionError(err.response?.data?.message || t('toast.failedToUpdateStatus'));
    }
  };

  const columns = [
    { key: 'name', label: t('branchName') },
    { key: 'code', label: t('common:code') },
    {
      key: 'manager',
      label: t('manager'),
      render: (row) => (row.manager_first_name ? `${row.manager_first_name} ${row.manager_last_name}` : '—'),
    },
    { key: 'phone', label: t('common:phone'), render: (row) => row.phone || '—' },
    { key: 'region', label: t('region'), render: (row) => row.region || '—' },
    {
      key: 'status',
      label: t('common:status'),
      render: (row) => <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        <div className="table-actions">
          {canEdit && (
            <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/branches/${row.id}/edit`)} aria-label={t('editBranchAria')}>
              <FiEdit2 />
            </button>
          )}
          {canEdit && (
            <button
              type="button"
              className="btn btn-ghost btn-icon"
              onClick={() => handleToggleStatus(row)}
              aria-label={row.status === 'active' ? t('deactivateBranchAria') : t('activateBranchAria')}
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
          <h1 className="page-title">{t('title')}</h1>
          <p className="page-subtitle">{t('subtitle')}</p>
        </div>
        {canCreate && (
          <div className="page-actions">
            <button type="button" className="btn btn-primary" onClick={() => navigate('/settings/branches/new')}>
              <FiPlus aria-hidden="true" /> {t('newBranch')}
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      {actionError && <div className="alert alert-danger mb-4" role="alert">{actionError}</div>}

      <div className="card">
        <div className="table-toolbar">
          <SearchInput value={search} onChange={setSearch} placeholder={t('searchPlaceholder')} />
          <ViewToggle view={view} onChange={setView} />
        </div>

        {view === 'list' ? (
          <Table columns={columns} rows={items} loading={loading} emptyMessage={t('emptyList')} />
        ) : (
          <div className="management-grid">
            {items.map((row) => (
              <div className="card card-hover management-grid-card" key={row.id}>
                <div className="management-grid-card-header">
                  <div className="management-grid-card-media">
                    <FiMapPin aria-hidden="true" />
                  </div>
                  <span className={`badge ${row.status === 'active' ? 'badge-success' : 'badge-neutral'}`}>{row.status === 'active' ? t('common:active') : t('common:inactive')}</span>
                </div>
                <div>
                  <div className="management-grid-card-title">{row.name}</div>
                  <div className="management-grid-card-subtitle">{row.code}</div>
                </div>
                <div className="management-grid-card-body">
                  <span>{row.manager_first_name ? `${row.manager_first_name} ${row.manager_last_name}` : t('noManagerAssigned')}</span>
                  <span>{row.phone || '—'}</span>
                  <span>{row.region || '—'}</span>
                </div>
                {canEdit && (
                  <div className="management-grid-card-footer">
                    <div className="table-actions">
                      <button type="button" className="btn btn-ghost btn-icon" onClick={() => navigate(`/settings/branches/${row.id}/edit`)} aria-label={t('editBranchAria')}>
                        <FiEdit2 />
                      </button>
                      <button
                        type="button"
                        className="btn btn-ghost btn-icon"
                        onClick={() => handleToggleStatus(row)}
                        aria-label={row.status === 'active' ? t('deactivateBranchAria') : t('activateBranchAria')}
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
                {t('emptyList')}
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
