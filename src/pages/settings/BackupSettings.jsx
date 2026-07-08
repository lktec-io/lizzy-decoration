import { useCallback, useState } from 'react';
import { FiDownload, FiDatabase } from 'react-icons/fi';
import SettingsTabs from '../../components/common/SettingsTabs';
import Table from '../../components/common/Table';
import Pagination from '../../components/common/Pagination';
import { useTable } from '../../hooks/useTable';
import { usePermission } from '../../hooks/usePermission';
import * as settingsService from '../../services/settingsService';
import '../../styles/pages/Notifications.css';

function formatBytes(bytes) {
  if (bytes == null) return '—';
  const mb = bytes / (1024 * 1024);
  return mb >= 1 ? `${mb.toFixed(2)} MB` : `${(bytes / 1024).toFixed(1)} KB`;
}

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function BackupSettings() {
  const canManage = usePermission('settings.manage');
  const fetchBackups = useCallback((params) => settingsService.listBackups(params), []);
  const { items, meta, loading, page, setPage, refetch } = useTable(fetchBackups);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');

  const handleRunBackup = async () => {
    setError('');
    setRunning(true);
    try {
      await settingsService.createBackup();
      refetch();
    } catch (err) {
      setError(err.response?.data?.message || 'Backup failed.');
    } finally {
      setRunning(false);
    }
  };

  const columns = [
    { key: 'created_at', label: 'Date', render: (row) => formatDateTime(row.created_at) },
    { key: 'trigger_type', label: 'Trigger', render: (row) => (row.trigger_type === 'manual' ? 'Manual' : 'Scheduled') },
    { key: 'size_bytes', label: 'Size', render: (row) => formatBytes(row.size_bytes) },
    { key: 'triggered_by', label: 'Triggered By', render: (row) => (row.first_name ? `${row.first_name} ${row.last_name}` : 'System') },
    {
      key: 'status',
      label: 'Status',
      render: (row) => <span className={`badge ${row.status === 'success' ? 'badge-success' : 'badge-danger'}`}>{row.status}</span>,
    },
    {
      key: 'actions',
      label: '',
      render: (row) => (
        row.status === 'success' && canManage && (
          <button type="button" className="btn btn-ghost btn-icon" onClick={() => settingsService.downloadBackup(row.id)} aria-label="Download backup">
            <FiDownload />
          </button>
        )
      ),
    },
  ];

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Settings</h1>
          <p className="page-subtitle">Manual database backups — triggered on demand and downloadable by Super Admins</p>
        </div>
        {canManage && (
          <div className="page-actions">
            <button type="button" className={`btn btn-primary ${running ? 'btn-loading' : ''}`} disabled={running} onClick={handleRunBackup}>
              <FiDatabase aria-hidden="true" /> Run Backup Now
            </button>
          </div>
        )}
      </div>

      <SettingsTabs />

      {error && <div className="alert alert-danger mb-4" role="alert">{error}</div>}

      <div className="card">
        <Table columns={columns} rows={items} loading={loading} emptyMessage="No backups have been run yet" />
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default BackupSettings;
