import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiMenu, FiSearch, FiBell, FiChevronDown } from 'react-icons/fi';
import { useAuth } from '../../hooks/useAuth';
import { useCompany } from '../../hooks/useCompany';
import { useDebounce } from '../../hooks/useDebounce';
import * as searchService from '../../services/searchService';
import '../../styles/components/Navbar.css';

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
  const { user } = useAuth();
  const { company } = useCompany();
  const { query, setQuery, results, open, setOpen } = useGlobalSearch();
  const searchRef = useRef(null);

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
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [setOpen]);

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
