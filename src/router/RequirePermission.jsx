import { Navigate } from 'react-router-dom';
import { usePermission } from '../hooks/usePermission';
import { ROUTES } from '../constants/routes';

// Sibling to ProtectedRoute, not a replacement for it: ProtectedRoute answers
// "are you logged in", this answers "are you allowed on THIS page". The
// actual security boundary is still the backend's authorize() middleware —
// this only spares a permission-less user from landing on a page whose
// action buttons are all hidden with no explanation, redirecting them to a
// real 403 page instead.
function RequirePermission({ permission, children }) {
  const allowed = usePermission(permission);
  if (!allowed) {
    return <Navigate to={ROUTES.FORBIDDEN} replace />;
  }
  return children;
}

export default RequirePermission;
