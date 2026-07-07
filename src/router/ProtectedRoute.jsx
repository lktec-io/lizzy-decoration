import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { ROUTES } from '../constants/routes';

function ProtectedRoute() {
  const { isAuthenticated, initializing, sessionExpired } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex items-center justify-center" style={{ minHeight: '100vh' }}>
        <span className="spinner" aria-label="Loading" />
      </div>
    );
  }

  if (sessionExpired) {
    return <Navigate to={ROUTES.SESSION_EXPIRED} replace />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  return <Outlet />;
}

export default ProtectedRoute;
