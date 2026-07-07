import { useEffect, useState } from 'react';
import { FiMenu, FiSearch, FiBell, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import '../../styles/components/Navbar.css';

function useClock() {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000 * 30);
    return () => clearInterval(timer);
  }, []);

  return now;
}

function Navbar({ onMenuClick }) {
  const now = useClock();
  const { user } = useAuth();
  const { company } = useCompany();
  const dateLabel = now.toLocaleDateString('en-TZ', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
  const timeLabel = now.toLocaleTimeString('en-TZ', { hour: '2-digit', minute: '2-digit' });
  const displayName = user ? `${user.first_name} ${user.last_name}` : 'User';
  const initial = user ? user.first_name.charAt(0).toUpperCase() : 'U';
  const branchLabel = user?.branch_name || 'All Branches';

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

      <div className="navbar-search">
        <FiSearch className="navbar-search-icon" aria-hidden="true" />
        <input
          type="search"
          className="navbar-search-input"
          placeholder="Search products, customers, sales..."
          aria-label="Global search"
        />
      </div>

      <div className="navbar-right">
        <span className="navbar-datetime">
          {dateLabel} &middot; {timeLabel}
        </span>

        <button type="button" className="navbar-icon-btn" aria-label="Notifications">
          <FiBell />
        </button>

        <button type="button" className="navbar-user">
          <span className="navbar-user-avatar">{initial}</span>
          <span className="navbar-user-name">{displayName}</span>
          <FiChevronDown className="navbar-user-caret" />
        </button>
      </div>
    </header>
  );
}

export default Navbar;
