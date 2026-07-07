import { Outlet } from 'react-router-dom';
import '../styles/pages/ErrorLayout.css';

function ErrorLayout() {
  return (
    <div className="error-shell">
      <Outlet />
    </div>
  );
}

export default ErrorLayout;
