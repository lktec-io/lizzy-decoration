import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AuthLayout from '../layouts/AuthLayout';
import MainLayout from '../layouts/MainLayout';
import ErrorLayout from '../layouts/ErrorLayout';
import ProtectedRoute from './ProtectedRoute';
import { ROUTES } from '../constants/routes';

// Route-level code splitting — every page below is its own chunk, fetched
// on navigation instead of bloating the initial bundle. This is the pattern
// every future phase's pages should follow.
const Login = lazy(() => import('../pages/auth/Login'));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword'));
const ResetPassword = lazy(() => import('../pages/auth/ResetPassword'));
const SessionExpired = lazy(() => import('../pages/auth/SessionExpired'));
const Dashboard = lazy(() => import('../pages/dashboard/Dashboard'));
const CompanySettings = lazy(() => import('../pages/company/CompanySettings'));
const UserList = lazy(() => import('../pages/users/UserList'));
const UserForm = lazy(() => import('../pages/users/UserForm'));
const RoleList = lazy(() => import('../pages/roles/RoleList'));
const PermissionMatrix = lazy(() => import('../pages/roles/PermissionMatrix'));
const BranchList = lazy(() => import('../pages/branches/BranchList'));
const BranchForm = lazy(() => import('../pages/branches/BranchForm'));
const CategoryList = lazy(() => import('../pages/categories/CategoryList'));
const BrandList = lazy(() => import('../pages/brands/BrandList'));
const ProductList = lazy(() => import('../pages/products/ProductList'));
const ProductForm = lazy(() => import('../pages/products/ProductForm'));
const InventoryOverview = lazy(() => import('../pages/inventory/InventoryOverview'));
const StockMovements = lazy(() => import('../pages/inventory/StockMovements'));
const SupplierList = lazy(() => import('../pages/suppliers/SupplierList'));
const SupplierDetail = lazy(() => import('../pages/suppliers/SupplierDetail'));
const PurchaseList = lazy(() => import('../pages/purchases/PurchaseList'));
const PurchaseForm = lazy(() => import('../pages/purchases/PurchaseForm'));
const PurchaseDetail = lazy(() => import('../pages/purchases/PurchaseDetail'));
const TransferList = lazy(() => import('../pages/transfers/TransferList'));
const TransferForm = lazy(() => import('../pages/transfers/TransferForm'));
const TransferDetail = lazy(() => import('../pages/transfers/TransferDetail'));
const CustomerList = lazy(() => import('../pages/customers/CustomerList'));
const CustomerDetail = lazy(() => import('../pages/customers/CustomerDetail'));
const POS = lazy(() => import('../pages/pos/POS'));
const SaleList = lazy(() => import('../pages/pos/SaleList'));
const SaleDetail = lazy(() => import('../pages/pos/SaleDetail'));
const NotFound404 = lazy(() => import('../pages/errors/NotFound404'));

function RouteFallback() {
  return (
    <div className="flex items-center justify-center" style={{ minHeight: '60vh' }}>
      <span className="spinner" aria-label="Loading" />
    </div>
  );
}

function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
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
              <Route path="/branches" element={<BranchList />} />
              <Route path="/branches/new" element={<BranchForm />} />
              <Route path="/branches/:id/edit" element={<BranchForm />} />
              <Route path="/categories" element={<CategoryList />} />
              <Route path="/brands" element={<BrandList />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/new" element={<ProductForm />} />
              <Route path="/products/:id/edit" element={<ProductForm />} />
              <Route path="/inventory" element={<InventoryOverview />} />
              <Route path="/inventory/movements" element={<StockMovements />} />
              <Route path="/suppliers" element={<SupplierList />} />
              <Route path="/suppliers/:id" element={<SupplierDetail />} />
              <Route path="/purchases" element={<PurchaseList />} />
              <Route path="/purchases/new" element={<PurchaseForm />} />
              <Route path="/purchases/:id" element={<PurchaseDetail />} />
              <Route path="/transfers" element={<TransferList />} />
              <Route path="/transfers/new" element={<TransferForm />} />
              <Route path="/transfers/:id" element={<TransferDetail />} />
              <Route path="/customers" element={<CustomerList />} />
              <Route path="/customers/:id" element={<CustomerDetail />} />
              <Route path="/pos" element={<POS />} />
              <Route path="/pos/sales" element={<SaleList />} />
              <Route path="/pos/sales/:id" element={<SaleDetail />} />
            </Route>
          </Route>

          <Route element={<ErrorLayout />}>
            <Route path={ROUTES.NOT_FOUND} element={<NotFound404 />} />
            <Route path="*" element={<Navigate to={ROUTES.NOT_FOUND} replace />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default AppRouter;
