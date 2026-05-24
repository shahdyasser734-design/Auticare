import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User } from '../types';
import { authService } from '../services/authService';

const getErrorMessage = (error: unknown, fallback = 'An error occurred') => {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return fallback;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const normalizeAndSetUser = (currentUser: User) => {
    const normalizedRole = (currentUser.role || '').toLowerCase();
    const mappedRole = normalizedRole === 'specialist' ? 'doctor' : normalizedRole;
    const userWithRole = { ...currentUser, role: mappedRole } as User;
    setUser(userWithRole);
    localStorage.setItem('user', JSON.stringify(userWithRole));
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');

      if (!token) {
        setLoading(false);
        return;
      }

      try {
        const currentUser = await authService.getCurrentUser();
        normalizeAndSetUser(currentUser);
      } catch {
        localStorage.clear();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    void init();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.login(email, password);
      localStorage.setItem('token', data.token);
      normalizeAndSetUser(data.user);
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Login failed');
      setError(errMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (payload: Record<string, unknown>) => {
    setError(null);
    setLoading(true);
    try {
      const data = await authService.signup(payload);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      if (data.user) {
        normalizeAndSetUser(data.user);
      }
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Signup failed');
      setError(errMsg);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    void authService.logout();
    localStorage.clear();
    setUser(null);
  };

  const forgotPassword = async (email: string) => {
    setError(null);
    try {
      await authService.forgotPassword(email);
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Failed to send reset link');
      setError(errMsg);
      throw error;
    }
  };

  const verifyEmail = async (code: string) => {
    setError(null);
    try {
      await authService.verifyEmail(code);
    } catch (error) {
      const errMsg = getErrorMessage(error, 'Verification failed');
      setError(errMsg);
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    error,
    isAuthenticated: !!user,
    login,
    signup,
    logout,
    forgotPassword,
    verifyEmail,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;