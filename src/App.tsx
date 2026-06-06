import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { LanguageProvider } from './context/LanguageContext';
import { BookingsProvider } from './context/BookingsContext';
import { AppRoutes } from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <LanguageProvider>
      <ThemeProvider>
        <AuthProvider>
          <ModalProvider>
            <BookingsProvider>
              <AppRoutes />
            </BookingsProvider>
          </ModalProvider>
        </AuthProvider>
      </ThemeProvider>
    </LanguageProvider>
  );
}

export default App;