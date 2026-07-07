import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { ROUTES } from '../../constants/routes';

function SessionExpired() {
  const { acknowledgeSessionExpired } = useAuth();
  const navigate = useNavigate();

  const handleLoginAgain = () => {
    acknowledgeSessionExpired();
    navigate(ROUTES.LOGIN, { replace: true });
  };

  return (
    <div>
      <h1 className="text-lg font-semibold">Session expired</h1>
      <p className="text-secondary text-sm mt-1 mb-4">
        For your security, you&apos;ve been signed out due to inactivity. Please sign in again to continue.
      </p>
      <button type="button" className="btn btn-primary btn-block" onClick={handleLoginAgain}>
        Log In Again
      </button>
    </div>
  );
}

export default SessionExpired;
