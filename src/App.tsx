import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { LanguageProvider } from './context/LanguageContext';
import { BookingsProvider } from './context/BookingsContext';
import { NotificationProvider } from './context/NotificationContext';
import { AppRoutes } from './routes/AppRoutes';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ModalProvider>
            <BookingsProvider>
              <NotificationProvider>
                <ErrorBoundary>
                  <AppRoutes />
                </ErrorBoundary>
              </NotificationProvider>
            </BookingsProvider>
          </ModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;