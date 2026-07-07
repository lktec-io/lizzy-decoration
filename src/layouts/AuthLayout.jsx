import { Outlet } from 'react-router-dom';
import '../styles/pages/AuthLayout.css';

function AuthLayout() {
  return (
    <div className="auth-shell">
      <div className="auth-card fade-in">
        <div className="auth-brand">
          <span className="auth-brand-mark">JOZZY</span>
          <span className="auth-brand-sub">Decoration &amp; Accessories</span>
        </div>
        <Outlet />
      </div>
    </div>
  );
}

export default AuthLayout;
