import { useEffect, useState } from 'react';
import { FiDatabase, FiCloud, FiServer, FiArchive, FiUsers } from 'react-icons/fi';
import Skeleton from '../common/Skeleton';
import * as dashboardService from '../../services/dashboardService';

function formatBackupTime(isoString) {
  if (!isoString) return 'No backups yet';
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function SystemStatusCard() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    dashboardService.getSystemStatus().then((result) => {
      if (!cancelled) {
        setStatus(result);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pills = status ? [
    { key: 'db', icon: FiDatabase, label: 'Database', ok: status.databaseConnected, value: status.databaseConnected ? 'Connected' : 'Disconnected' },
    { key: 'cloudinary', icon: FiCloud, label: 'Cloudinary', ok: status.cloudinaryConnected, value: status.cloudinaryConnected ? 'Connected' : 'Not Configured' },
    { key: 'server', icon: FiServer, label: 'Server', ok: status.serverOnline, value: status.serverOnline ? 'Online' : 'Offline' },
    { key: 'backup', icon: FiArchive, label: 'Last Backup', ok: Boolean(status.lastBackupAt), value: formatBackupTime(status.lastBackupAt) },
    { key: 'users', icon: FiUsers, label: 'Online Users', ok: true, value: `${status.onlineUsers}` },
  ] : [];

  return (
    <div className="card">
      <div className="card-header"><span className="card-title">System Status</span></div>
      <div className="card-body">
        {loading ? (
          <Skeleton height={80} />
        ) : (
          <div className="system-status-grid">
            {pills.map(({ key, icon: Icon, label, ok, value }) => (
              <div key={key} className={`system-status-pill ${ok ? 'system-status-pill-ok' : 'system-status-pill-down'}`}>
                <span className="system-status-dot" aria-hidden="true" />
                <Icon className="system-status-icon" aria-hidden="true" />
                <div className="system-status-text">
                  <span className="system-status-label">{label}</span>
                  <span className="system-status-value">{value}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default SystemStatusCard;
