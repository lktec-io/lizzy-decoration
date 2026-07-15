import { useCallback, useEffect, useMemo, useState } from 'react';
import * as companyService from '../services/companyService';
import { CompanyContext } from './companyContextInstance';

function CompanyProvider({ children }) {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    companyService
      .getCompany()
      .then((profile) => {
        if (!cancelled) setCompany(profile);
      })
      .catch(() => {
        // Company profile may not be configured yet — brand falls back to text mark.
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  // Browsers accept a plain PNG/JPG/WEBP href on <link rel="icon"> directly
  // (no ICO conversion needed) — swaps the static /favicon.svg for the
  // uploaded logo once one exists, and swaps back if it's ever removed.
  useEffect(() => {
    const link = document.querySelector('link[rel="icon"]');
    if (!link) return;
    link.href = company?.logo_path || '/favicon.svg';
  }, [company?.logo_path]);

  // Lets a caller that already has the fresh profile (CompanySettings gets
  // it straight back from its own updateCompany()/uploadLogo() response)
  // push it into every branding consumer (Login, Sidebar, Navbar, Reports)
  // instantly — no second round-trip, no page reload needed.
  const updateCompany = useCallback((profile) => setCompany(profile), []);

  const value = useMemo(() => ({ company, loading, updateCompany }), [company, loading, updateCompany]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export default CompanyProvider;
