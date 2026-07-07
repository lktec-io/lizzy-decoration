import { useEffect, useMemo, useState } from 'react';
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

  const value = useMemo(() => ({ company, loading }), [company, loading]);

  return <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>;
}

export default CompanyProvider;
