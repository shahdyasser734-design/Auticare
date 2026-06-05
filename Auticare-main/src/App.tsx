import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { ModalProvider } from './context/ModalContext';
import { AppRoutes } from './routes/AppRoutes';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ModalProvider>
          <AppRoutes />
        </ModalProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;