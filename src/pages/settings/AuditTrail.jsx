import { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FiFileText, FiPrinter } from 'react-icons/fi';
import SettingsTabs from '../../components/common/SettingsTabs';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import SearchInput from '../../components/common/SearchInput';
import { useTable } from '../../hooks/useTable';
import * as auditLogService from '../../services/auditLogService';

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function firstOfMonthIso() {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
}

function AuditTrail() {
  const { t } = useTranslation('settings');
  const [filterOptions, setFilterOptions] = useState({ modules: [], actions: [], users: [], branches: [] });
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [error, setError] = useState('');

  const fetchAuditLogs = useCallback((params) => auditLogService.listAuditLogs(params), []);
  const { items, meta, loading, page, setPage, search, setSearch, filters, setFilters } = useTable(fetchAuditLogs, {
    initialFilters: { dateFrom: firstOfMonthIso(), dateTo: todayIso() },
  });

  useEffect(() => {
    auditLogService.getAuditLogFilterOptions().then(setFilterOptions).catch(() => {});
  }, []);

  const buildExportParams = () => ({ ...filters, search: search || undefined });

  const handleExportPdf = async () => {
    setExportingPdf(true);
    try {
      await auditLogService.exportAuditLogPdf(buildExportParams());
    } catch {
      setError(t('auditTrail.failedToExportPdf'));
    } finally {
      setExportingPdf(false);
    }
  };

  const handleExportExcel = async () => {
    setExportingExcel(true);
    try {
      await auditLogService.exportAuditLogExcel(buildExportParams());
    } catch {
      setError(t('auditTrail.failedToExportExcel'));
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCsv = async () => {
    setExportingCsv(true);
    try {
      await auditLogService.exportAuditLogCsv(buildExportParams());
    } catch {
      setError(t('auditTrail.failedToExportCsv'));
    } finally {
      setExportingCsv(false);
    }
  };

  const columns = [
    { key: 'created_at', label: t('auditTrail.colTime'), render: (row) => formatDateTime(row.created_at) },
    { key: 'user_name', label: t('auditTrail.colUser'), render: (row) => row.user_name || t('auditTrail.systemUser') },
    { key: 'role_name', label: t('auditTrail.colRole'), render: (row) => row.role_name || '—' },
    { key: 'module', label: t('auditTrail.colModule') },
    { key: 'action', label: t('auditTrail.colAction') },
    { key: 'description', label: t('auditTrail.colDescription'), render: (row) => row.description || '—' },
    { key: 'branch_name', label: t('auditTrail.colBranch'), render: (row) => row.branch_name || t('common:allBranches') },
    {
      key: 'status',
      label: t('auditTrail.colStatus'),
      render: (row) => (
        <span className={`badge ${row.status === 'failed' ? 'badge-danger' : 'badge-success'}`}>
          {row.status === 'failed' ? t('auditTrail.statusFailed') : t('auditTrail.statusSuccess')}
        </span>
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t('auditTrail.title')}</h1>
          <p className="page-subtitle">{t('auditTrail.subtitle')}</p>
        </div>
        <div className="page-actions no-print">
          <button type="button" className={`btn btn-secondary ${exportingPdf ? 'btn-loading' : ''}`} onClick={handleExportPdf} disabled={exportingPdf}>
            <FiFileText aria-hidden="true" /> {t('auditTrail.exportPdf')}
          </button>
          <button type="button" className={`btn btn-secondary ${exportingExcel ? 'btn-loading' : ''}`} onClick={handleExportExcel} disabled={exportingExcel}>
            <FiFileText aria-hidden="true" /> {t('auditTrail.exportExcel')}
          </button>
          <button type="button" className={`btn btn-secondary ${exportingCsv ? 'btn-loading' : ''}`} onClick={handleExportCsv} disabled={exportingCsv}>
            <FiFileText aria-hidden="true" /> {t('auditTrail.exportCsv')}
          </button>
          <button type="button" className="btn btn-secondary" onClick={() => window.print()}>
            <FiPrinter aria-hidden="true" /> {t('auditTrail.print')}
          </button>
        </div>
      </div>

      <SettingsTabs />

      {error && <div className="alert alert-danger no-print mb-3">{error}</div>}

      <div className="card">
        <div className="table-toolbar no-print">
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateFrom: e.target.value }))}
            />
            <input
              type="date"
              className="form-control"
              value={filters.dateTo || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, dateTo: e.target.value }))}
            />
            <select
              className="form-control"
              value={filters.branchId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, branchId: e.target.value || undefined }))}
            >
              <option value="">{t('common:allBranches')}</option>
              {filterOptions.branches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.module || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, module: e.target.value || undefined }))}
            >
              <option value="">{t('auditTrail.allModules')}</option>
              {filterOptions.modules.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.action || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, action: e.target.value || undefined }))}
            >
              <option value="">{t('auditTrail.allActions')}</option>
              {filterOptions.actions.map((a) => <option key={a} value={a}>{a}</option>)}
            </select>
            <select
              className="form-control"
              value={filters.userId || ''}
              onChange={(e) => setFilters((prev) => ({ ...prev, userId: e.target.value || undefined }))}
            >
              <option value="">{t('auditTrail.allUsers')}</option>
              {filterOptions.users.map((u) => <option key={u.id} value={u.id}>{u.name}</option>)}
            </select>
            <SearchInput value={search} onChange={setSearch} placeholder={t('auditTrail.searchPlaceholder')} />
          </div>
        </div>
        <Table columns={columns} rows={items} loading={loading} emptyMessage={t('auditTrail.noRecordsFound')} />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default AuditTrail;
