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
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('user');
      return stored && stored !== 'undefined' ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('isAuthenticated') === 'true';
  });

  const normalizeAndSetUser = (currentUser: User | null) => {
    if (!currentUser) return;
    const normalizedRole = ((currentUser.role || '') as string).toLowerCase();
    const mappedRole = normalizedRole === 'specialist' ? 'doctor' : normalizedRole;
    const userWithRole = { ...currentUser, role: mappedRole } as User;
    setUser(userWithRole);
    localStorage.setItem('user', JSON.stringify(userWithRole));
    localStorage.setItem('userId', String(userWithRole.id));
    localStorage.setItem('role', userWithRole.role || '');
  };

  useEffect(() => {
    const init = async () => {
      const token = localStorage.getItem('token');
      const isAuthStr = localStorage.getItem('isAuthenticated');
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      // We already synchronously read the state.
      // If we don't have a user but we are authenticated, we might need to fetch.
      // But since user is also stored, we don't strictly need to fetch.
      if (!user && isAuthStr === 'true') {
        try {
          const currentUser = await authService.getCurrentUser();
          normalizeAndSetUser(currentUser);
        } catch {
          // If fetch fails, we don't clear everything immediately to avoid harsh redirects
          // But we could clear if token is invalid.
        }
      }
    };

    void init();
  }, []);

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const data: any = await authService.login(email, password);
      
      console.log("LOGIN RESPONSE:", data);
      console.log("TOKEN:", data?.token);
      console.log("ROLE:", data?.user?.role || data?.role);
      console.log("USER:", data?.user);
      
      localStorage.setItem('token', data?.token);
      if (data?.role) localStorage.setItem('role', data.role);
      
      const userToStore = data?.user || { email, role: data?.role };
      localStorage.setItem('user', JSON.stringify(userToStore));
      localStorage.setItem('isAuthenticated', 'true');
      
      setIsAuthenticated(true);
      normalizeAndSetUser(userToStore);
      return data;
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
        localStorage.setItem('isAuthenticated', 'true');
        setIsAuthenticated(true);
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
    setIsAuthenticated(false);
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
    isAuthenticated,
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