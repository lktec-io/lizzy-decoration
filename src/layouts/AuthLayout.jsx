import { Outlet } from 'react-router-dom';
import { useCompany } from '../hooks/useCompany';
import '../styles/pages/AuthLayout.css';

function AuthLayout() {
  const { company } = useCompany();
  const companyName = company?.company_name || 'JOZZY';

  return (
    <div className="auth-shell">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          {company?.logo_path ? (
            <img src={company.logo_path} alt={companyName} className="auth-brand-logo" />
          ) : (
            <span className="auth-brand-mark">{companyName}</span>
          )}
          <span className="auth-brand-sub">Decoration &amp; Accessories</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
