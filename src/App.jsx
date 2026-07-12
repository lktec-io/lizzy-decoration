import AppRouter from './router/AppRouter';
import AuthProvider from './contexts/AuthContext';
import CompanyProvider from './contexts/CompanyContext';
import ToastProvider from './contexts/ToastContext';

function App() {
  return (
    <CompanyProvider>
      <AuthProvider>
        <ToastProvider>
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </CompanyProvider>
  );
}

export default App;
