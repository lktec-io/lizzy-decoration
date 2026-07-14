import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

function Forbidden403() {
  return (
    <>
      <div className="error-code">403</div>
      <h1 className="error-title">Access denied</h1>
      <p className="error-message">
        You don&apos;t have permission to view this page. Contact your administrator if you believe this is a mistake.
      </p>
      <Link to={ROUTES.DASHBOARD} className="btn btn-primary error-action">
        Back to Dashboard
      </Link>
    </>
  );
}

export default Forbidden403;
