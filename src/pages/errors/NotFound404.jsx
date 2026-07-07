import { Link } from 'react-router-dom';
import { ROUTES } from '../../constants/routes';

function NotFound404() {
  return (
    <>
      <div className="error-code">404</div>
      <h1 className="error-title">Page not found</h1>
      <p className="error-message">
        The page you are looking for doesn&apos;t exist or has been moved.
      </p>
      <Link to={ROUTES.DASHBOARD} className="btn btn-primary error-action">
        Back to Dashboard
      </Link>
    </>
  );
}

export default NotFound404;
