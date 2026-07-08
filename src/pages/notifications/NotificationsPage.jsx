import { useCallback } from 'react';
import { FiCheck, FiCheckCircle } from 'react-icons/fi';
import Pagination from '../../components/common/Pagination';
import { useTable } from '../../hooks/useTable';
import * as notificationService from '../../services/notificationService';
import '../../styles/pages/Notifications.css';

const TYPE_DOT = {
  info: 'notification-dot-info',
  success: 'notification-dot-success',
  warning: 'notification-dot-warning',
  danger: 'notification-dot-danger',
};

const STATUS_TABS = [
  { value: '', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
];

function formatDateTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function NotificationsPage() {
  const fetchNotifications = useCallback((params) => notificationService.listNotifications(params), []);
  const { items, meta, loading, page, setPage, filters, setFilters, refetch } = useTable(fetchNotifications);

  const handleMarkRead = async (id) => {
    await notificationService.markNotificationRead(id);
    refetch();
  };

  const handleMarkAllRead = async () => {
    await notificationService.markAllNotificationsRead();
    refetch();
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <h1 className="page-title">Notifications</h1>
          <p className="page-subtitle">Low stock alerts, completed transactions, and system events</p>
        </div>
        <div className="page-actions">
          <button type="button" className="btn btn-secondary" onClick={handleMarkAllRead}>
            <FiCheckCircle aria-hidden="true" /> Mark All Read
          </button>
        </div>
      </div>

      <div className="notifications-tabs">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            className={`notifications-tab ${(filters.status || '') === tab.value ? 'notifications-tab-active' : ''}`}
            onClick={() => setFilters((prev) => ({ ...prev, status: tab.value || undefined }))}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="card">
        {loading ? (
          <div className="flex items-center justify-center p-6"><span className="spinner" aria-label="Loading" /></div>
        ) : items.length === 0 ? (
          <div className="notifications-empty">No notifications to show.</div>
        ) : (
          <div className="notifications-list">
            {items.map((n) => (
              <div key={n.id} className={`notifications-list-item ${!n.read_at ? 'notifications-list-item-unread' : ''}`}>
                <span className={`navbar-notification-dot ${TYPE_DOT[n.type] || ''}`} aria-hidden="true" />
                <div className="notifications-list-body">
                  <span className="notifications-list-title">{n.title}</span>
                  <span className="notifications-list-message">{n.message}</span>
                  <span className="notifications-list-time">{formatDateTime(n.created_at)}</span>
                </div>
                {!n.read_at && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => handleMarkRead(n.id)}>
                    <FiCheck aria-hidden="true" /> Mark Read
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
        <Pagination page={page} totalPages={meta.totalPages} total={meta.total} limit={meta.limit} onPageChange={setPage} />
      </div>
    </div>
  );
}

export default NotificationsPage;
