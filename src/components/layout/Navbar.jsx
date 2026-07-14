import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  FiSearch, FiBell, FiChevronDown, FiCheck, FiCheckCircle, FiTrash2, FiUser, FiLogOut, FiInbox, FiSettings,
  FiInfo, FiAlertTriangle, FiAlertCircle,
} from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { useDebounce } from '../../hooks/useDebounce';
import * as searchService from '../../services/searchService';
import * as notificationService from '../../services/notificationService';
import { ROUTES } from '../../constants/routes';
import EmptyState from '../common/EmptyState';
import '../../styles/components/Navbar.css';

const DROPDOWN_MOTION = {
  initial: { opacity: 0, scale: 0.96, y: -6 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: -6 },
  transition: { duration: 0.15 },
};

const UNREAD_POLL_MS = 60_000;

const NOTIFICATION_TYPE_ICON = {
  info: FiInfo,
  success: FiCheckCircle,
  warning: FiAlertTriangle,
  danger: FiAlertCircle,
};

const NOTIFICATION_TYPE_ICON_CLASS = {
  info: 'navbar-notification-icon-info',
  success: 'navbar-notification-icon-success',
  warning: 'navbar-notification-icon-warning',
  danger: 'navbar-notification-icon-danger',
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

  // No DELETE endpoint exists on the backend for notifications, so this only
  // clears the card from the current dropdown session — it is not a
  // persisted delete and the item can reappear on the next fetch. Still a
  // real, working interaction: the unread count is kept in sync immediately.
  const dismiss = (id) => {
    setRecent((prev) => {
      const target = prev.find((n) => n.id === id);
      if (target && !target.read_at) {
        setUnreadCount((count) => Math.max(0, count - 1));
      }
      return prev.filter((n) => n.id !== id);
    });
  };

  const dismissAll = () => {
    setRecent([]);
    setUnreadCount(0);
  };

  return { unreadCount, recent, open, setOpen, toggleOpen, loading, markRead, markAllRead, dismiss, dismissAll };
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

function Navbar({ onMenuClick, isOpen }) {
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

  // Toggles a class on <html> instead of tracking scroll position in state —
  // the navbar's elevated-glass shadow (layout.css) reads that class
  // directly, so scrolling never triggers a React re-render.
  useEffect(() => {
    const handleScroll = () => {
      document.documentElement.classList.toggle('is-scrolled', window.scrollY > 4);
    };
    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => {
      window.removeEventListener('scroll', handleScroll);
      document.documentElement.classList.remove('is-scrolled');
    };
  }, []);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    await logout();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  const users = results?.users || [];

  return (
    <header className="navbar">
      {/*
        Single source of truth: `isOpen` is the exact same isSidebarOpen
        state MainLayout uses for the overlay and the drawer panel — this
        button doesn't own any state of its own, it only reads this prop.
        Three bars are always mounted; only their transform/opacity (driven
        by the single `is-open` class below) changes — top and bottom bars
        rotate into an X, the middle bar fades out. Nothing is ever added or
        removed from the DOM after first render, so there's no mount/unmount
        race.
      */}
      <button type="button" className="navbar-menu-btn" onClick={onMenuClick} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
        <span className={`navbar-hamburger ${isOpen ? 'is-open' : ''}`}>
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
          <span className="navbar-hamburger-bar" />
        </span>
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
        <AnimatePresence>
          {open && query.trim() && (
            <motion.div className="navbar-search-results" {...DROPDOWN_MOTION}>
              {users.length === 0 ? (
                <EmptyState icon={FiSearch} title="No matches yet" description="Search currently covers Users only." />
              ) : (
                users.map((result) => (
                  <button
                    key={result.id}
                    type="button"
                    className="navbar-search-result"
                    onClick={() => {
                      navigate(`/settings/users/${result.id}/edit`);
                      setOpen(false);
                    }}
                  >
                    <span className="navbar-search-result-name">{result.first_name} {result.last_name}</span>
                    <span className="navbar-search-result-meta">{result.email}</span>
                  </button>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="navbar-right">
        <span className="navbar-datetime">
          {dateLabel} &middot; {timeLabel}
        </span>

        <div className="navbar-notifications" ref={notificationsRef}>
          <button type="button" className="navbar-icon-btn" aria-label="Notifications" onClick={notifications.toggleOpen}>
            {/* Ringing only every ~5s (not continuously) and only while there's
                something unread to draw attention to — see the CSS keyframe
                for the idle/ring split. */}
            <span className={`navbar-bell ${notifications.unreadCount > 0 ? 'navbar-bell-active' : ''}`}>
              <FiBell />
            </span>
            <AnimatePresence>
              {notifications.unreadCount > 0 && (
                <motion.span
                  className="navbar-notification-badge"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                >
                  {notifications.unreadCount > 9 ? '9+' : notifications.unreadCount}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
          <AnimatePresence>
            {notifications.open && (
              <motion.div className="navbar-notification-panel" {...DROPDOWN_MOTION}>
                <div className="navbar-notification-header">
                  <span>Notifications</span>
                  <div className="navbar-notification-header-actions">
                    {notifications.unreadCount > 0 && (
                      <button type="button" className="btn btn-ghost btn-sm" aria-label="Mark all as read" onClick={notifications.markAllRead}>
                        <FiCheckCircle aria-hidden="true" /> <span className="navbar-notification-action-label">Mark All Read</span>
                      </button>
                    )}
                    {notifications.recent.length > 0 && (
                      <button type="button" className="btn btn-ghost btn-sm navbar-notification-clear-all" aria-label="Delete all notifications" onClick={notifications.dismissAll}>
                        <FiTrash2 aria-hidden="true" /> <span className="navbar-notification-action-label">Delete All</span>
                      </button>
                    )}
                  </div>
                </div>
                <div className="navbar-notification-list">
                  {notifications.loading ? (
                    <div className="navbar-notification-empty"><span className="spinner" aria-label="Loading" /></div>
                  ) : notifications.recent.length === 0 ? (
                    <EmptyState icon={FiInbox} title="No new notifications" />
                  ) : (
                    <AnimatePresence initial={false}>
                      {notifications.recent.map((n) => {
                        const TypeIcon = NOTIFICATION_TYPE_ICON[n.type] || FiInfo;
                        return (
                          <motion.div
                            key={n.id}
                            layout
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2, ease: 'easeOut' }}
                            className={`navbar-notification-item ${!n.read_at ? 'navbar-notification-item-unread' : ''}`}
                          >
                            <span className={`navbar-notification-icon ${NOTIFICATION_TYPE_ICON_CLASS[n.type] || 'navbar-notification-icon-info'}`} aria-hidden="true">
                              <TypeIcon />
                            </span>
                            <div className="navbar-notification-body">
                              <span className="navbar-notification-title-row">
                                <span className="navbar-notification-title">{n.title}</span>
                                {!n.read_at && <span className="navbar-notification-unread-dot" aria-label="Unread" />}
                              </span>
                              <span className="navbar-notification-message">{n.message}</span>
                              <span className="navbar-notification-time">{formatNotificationTime(n.created_at)}</span>
                            </div>
                            <div className="navbar-notification-actions">
                              {!n.read_at && (
                                <button
                                  type="button"
                                  className="btn btn-ghost btn-icon navbar-notification-action"
                                  onClick={() => notifications.markRead(n.id)}
                                  aria-label="Mark as read"
                                >
                                  <FiCheck />
                                </button>
                              )}
                              <button
                                type="button"
                                className="btn btn-ghost btn-icon navbar-notification-action"
                                onClick={() => notifications.dismiss(n.id)}
                                aria-label="Delete notification"
                              >
                                <FiTrash2 />
                              </button>
                            </div>
                          </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="navbar-user-menu" ref={userMenuRef}>
          <button type="button" className="navbar-user" onClick={() => setUserMenuOpen((prev) => !prev)}>
            <span className="navbar-user-avatar">{initial}</span>
            <span className="navbar-user-name">{displayName}</span>
            <FiChevronDown className="navbar-user-caret" />
          </button>
          <AnimatePresence>
            {userMenuOpen && (
              <motion.div className="navbar-user-panel" {...DROPDOWN_MOTION}>
                <div className="navbar-user-panel-header">
                  <span className="navbar-user-panel-avatar">{initial}</span>
                  <div className="navbar-user-panel-info">
                    <div className="navbar-user-panel-name">{displayName}</div>
                    <div className="navbar-user-panel-role">{user?.role_name || user?.email || ''}</div>
                  </div>
                </div>
                <div className="navbar-user-panel-items">
                  <button
                    type="button"
                    className="navbar-user-panel-item"
                    onClick={() => { setUserMenuOpen(false); navigate('/profile'); }}
                  >
                    <FiUser aria-hidden="true" /> Profile
                  </button>
                  <button
                    type="button"
                    className="navbar-user-panel-item"
                    onClick={() => { setUserMenuOpen(false); navigate('/settings/company'); }}
                  >
                    <FiSettings aria-hidden="true" /> Settings
                  </button>
                  <div className="navbar-user-panel-divider" />
                  <button type="button" className="navbar-user-panel-item navbar-user-panel-item-danger" onClick={handleLogout}>
                    <FiLogOut aria-hidden="true" /> Logout
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
