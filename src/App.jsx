import { I18nextProvider } from 'react-i18next';
import AppRouter from './router/AppRouter';
import AuthProvider from './contexts/AuthContext';
import CompanyProvider from './contexts/CompanyContext';
import ToastProvider from './contexts/ToastContext';
import ThemeProvider from './contexts/ThemeContext';
import CustomCursor from './components/common/CustomCursor';
import i18n from './i18n/i18n';

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider>
        <CompanyProvider>
          <AuthProvider>
            <ToastProvider>
              <CustomCursor />
              <AppRouter />
            </ToastProvider>
          </AuthProvider>
        </CompanyProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
}

export default App;
