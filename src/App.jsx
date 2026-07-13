import AppRouter from './router/AppRouter';
import AuthProvider from './contexts/AuthContext';
import CompanyProvider from './contexts/CompanyContext';
import ToastProvider from './contexts/ToastContext';
import CustomCursor from './components/common/CustomCursor';

function App() {
  return (
    <CompanyProvider>
      <AuthProvider>
        <ToastProvider>
          <CustomCursor />
          <AppRouter />
        </ToastProvider>
      </AuthProvider>
    </CompanyProvider>
  );
}

export default App;
