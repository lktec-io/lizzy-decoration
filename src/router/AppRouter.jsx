import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ErrorLayout from '../layouts/ErrorLayout';
import ProtectedRoute from './ProtectedRoute';
import Login from '../pages/auth/Login';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';
import SessionExpired from '../pages/auth/SessionExpired';
import Dashboard from '../pages/dashboard/Dashboard';
import CompanySettings from '../pages/company/CompanySettings';
import UserList from '../pages/users/UserList';
import UserForm from '../pages/users/UserForm';
import RoleList from '../pages/roles/RoleList';
import PermissionMatrix from '../pages/roles/PermissionMatrix';
import NotFound404 from '../pages/errors/NotFound404';
import { ROUTES } from '../constants/routes';

function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.LOGIN} element={<Login />} />
          <Route path={ROUTES.FORGOT_PASSWORD} element={<ForgotPassword />} />
          <Route path={ROUTES.RESET_PASSWORD} element={<ResetPassword />} />
          <Route path={ROUTES.SESSION_EXPIRED} element={<SessionExpired />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route element={<MainLayout />}>
            <Route path={ROUTES.DASHBOARD} element={<Dashboard />} />
            <Route path={ROUTES.SETTINGS_COMPANY} element={<CompanySettings />} />
            <Route path="/users" element={<UserList />} />
            <Route path="/users/new" element={<UserForm />} />
            <Route path="/users/:id/edit" element={<UserForm />} />
            <Route path="/roles" element={<RoleList />} />
            <Route path="/roles/:id/permissions" element={<PermissionMatrix />} />
          </Route>
        </Route>

        <Route element={<ErrorLayout />}>
          <Route path={ROUTES.NOT_FOUND} element={<NotFound404 />} />
          <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default AppRouter;
