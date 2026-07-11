import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiChevronDown, FiCheck, FiUser, FiLogOut } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { useDebounce } from '../../hooks/useDebounce';
import * as searchService from '../../services/searchService';
import * as notificationService from '../../services/notificationService';
import { ROUTES } from '../../constants/routes';
import '../../styles/components/Navbar.css';

const UNREAD_POLL_MS = 60_000;

const NOTIFICATION_TYPE_DOT = {
  info: 'notification-dot-info',
  success: 'notification-dot-success',
  warning: 'notification-dot-warning',
  danger: 'notification-dot-danger',
};

function formatNotificationTime(isoString) {
  return new Date(isoString).toLocaleString('en-TZ', { dateStyle: 'medium', timeStyle: 'short' });
}

function useNotifications() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [recent, setRecent] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const refreshUnreadCount = () => {
    notificationService.getUnreadCount().then(setUnreadCount).catch(() => {});
  };

  useEffect(() => {
    refreshUnreadCount();
    const timer = setInterval(refreshUnreadCount, UNREAD_POLL_MS);
    return () => clearInterval(timer);
  }, []);

  const toggleOpen = () => {
    setOpen((prev) => {
      const next = !prev;
      if (next) {
        setLoading(true);
        notificationService
          .listNotifications({ limit: 8 })
          .then((result) => setRecent(result.items))
          .finally(() => setLoading(false));
      }
      return next;
    });
  };

  const markRead = async (id) => {
    await notificationService.markNotificationRead(id);
    setRecent((prev) => prev.map((n) => (n.id === id ? { ...n, read_at: new Date().toISOString() } : n)));
    refreshUnreadCount();
  };

  const markAllRead = async () => {
    await notificationService.markAllNotificationsRead();
    setRecent((prev) => prev.map((n) => ({ ...n, read_at: n.read_at || new Date().toISOString() })));
    setUnreadCount(0);
  };

  return { unreadCount, recent, open, setOpen, toggleOpen, loading, markRead, markAllRead };
}

function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function useGlobalSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [open, setOpen] = useState(false);
  const debouncedQuery = useDebounce(query, 300);

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResults(null);
      return;
    }

    let cancelled = false;
    searchService.globalSearch(debouncedQuery).then((data) => {
      if (!cancelled) setResults(data);
    });
    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  return { query, setQuery, results, open, setOpen };
}

function Navbar({ onMenuClick }) {
  const now = useClock();
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { company } = useCompany();
  const { query, setQuery, results, open, setOpen } = useGlobalSearch();
  const searchRef = useRef(null);
  const notifications = useNotifications();
  const notificationsRef = useRef(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef(null);

  const dateLabel = now.toLocaleDateString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });
  const displayName = user ? `${user.first_name} ${user.last_name}` : 'User';
  const initial = user ? user.first_name.charAt(0).toUpperCase() : 'U';
  const branchLabel = user?.branch_name || 'All Branches';

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchRef.current && !searchRef.current.contains(event.target)) {
        setOpen(false);
      }
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        notifications.setOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- notifications.setOpen is stable across renders (useState setter)
  }, [setOpen]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const users = results?.users || [];

  return (
    <header className="navbar">
      <button type="button" className="navbar-menu-btn" onClick={onMenuClick} aria-label="Toggle sidebar">
        <FiMenu />
      </button>

      {company?.logo_path && (
        <img src={company.logo_path} alt={company.company_name} className="navbar-logo" />
      )}

      <div className="navbar-branch">
        <span className="navbar-branch-label">Branch</span>
        <span className="navbar-branch-value">{branchLabel}</span>
      </div>

      <div className="navbar-search" ref={searchRef}>
        <FiSearch className="navbar-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="navbar-search-input"
          placeholder="Search products, customers, sales..."
          aria-label="Global search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => setOpen(true)}
        />
        {open && query.trim() && (
          <div className="navbar-search-results">
            {users.length === 0 ? (
              <div className="navbar-search-empty">No matches yet — search currently covers Users only.</div>
            ) : (
              users.map((result) => (
                <button
                  key={result.id}
                  type="button"
                  className="navbar-search-result"
                  onClick={() => {
                    navigate(`/users/${result.id}/edit`);
                    setOpen(false);
                  }}
                >
                  <span className="navbar-search-result-name">{result.first_name} {result.last_name}</span>
                  <span className="navbar-search-result-meta">{result.email}</span>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      <div className="navbar-right">
        <span className="navbar-datetime">
          {dateLabel} &middot; {timeLabel}
        </span>

        <div className="navbar-notifications" ref={notificationsRef}>
          <button type="button" className="navbar-icon-btn" aria-label="Notifications" onClick={notifications.toggleOpen}>
            <FiBell />
            {notifications.unreadCount > 0 && <span className="navbar-notification-badge">{notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}</span>}
          </button>
          {notifications.open && (
            <div className="navbar-notification-panel">
              <div className="navbar-notification-header">
                <span>Notifications</span>
                {notifications.unreadCount > 0 && (
                  <button type="button" className="btn btn-ghost btn-sm" onClick={notifications.markAllRead}>
                    Mark All Read
                  </button>
                )}
              </div>
              <div className="navbar-notification-list">
                {notifications.loading ? (
                  <div className="navbar-notification-empty"><span className="spinner" aria-label="Loading" /></div>
                ) : notifications.recent.length === 0 ? (
                  <div className="navbar-notification-empty">No notifications yet.</div>
                ) : (
                  notifications.recent.map((n) => (
                    <div key={n.id} className={`navbar-notification-item ${!n.read_at ? 'navbar-notification-item-unread' : ''}`}>
                      <span className={`navbar-notification-dot ${NOTIFICATION_TYPE_DOT[n.type] || ''}`} aria-hidden="true" />
                      <div className="navbar-notification-body">
                        <span className="navbar-notification-title">{n.title}</span>
                        <span className="navbar-notification-message">{n.message}</span>
                        <span className="navbar-notification-time">{formatNotificationTime(n.created_at)}</span>
                      </div>
                      {!n.read_at && (
                        <button type="button" className="btn btn-ghost btn-icon" onClick={() => notifications.markRead(n.id)} aria-label="Mark as read">
                          <FiCheck />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        <div className="navbar-user-menu" ref={userMenuRef}>
          <button type="button" className="navbar-user" onClick={() => setUserMenuOpen((prev) => !prev)}>
            <span className="navbar-user-avatar">{initial}</span>
            <span className="navbar-user-name">{displayName}</span>
            <FiChevronDown className="navbar-user-caret" />
          </button>
          {userMenuOpen && (
            <div className="navbar-user-panel">
              <button
                type="button"
                className="navbar-user-panel-item"
                onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
              >
                <FiUser aria-hidden="true" /> Profile
              </button>
              <button type="button" className="navbar-user-panel-item" onClick={handleLogout}>
                <FiLogOut aria-hidden="true" /> Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}

export default Navbar;
