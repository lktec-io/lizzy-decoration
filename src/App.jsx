import AppRouter from './router/AppRouter';
import AuthProvider from './contexts/AuthContext';
import CompanyProvider from './contexts/CompanyContext';

function App() {
  return (
    <CompanyProvider>
      <AuthProvider>
        <AppRouter />
      </AuthProvider>
    </CompanyProvider>
  );
}

export default App;
