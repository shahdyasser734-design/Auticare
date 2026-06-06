import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User, AuthResponse, UserRole } from '../types';
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
  }, [user]);

  const normalizeAuthResponse = (data: AuthResponse) => {
    const userFromResponse = data.user;
    if (userFromResponse) {
      return {
        token: data.token,
        user: userFromResponse,
      };
    }

    const user: User = {
      id: String(data.userId ?? data.user?.id ?? ''),
      email: String(data.email ?? data.user?.email ?? ''),
      name: String(data.fullName ?? data.name ?? data.user?.name ?? ''),
      role: String(data.role ?? data.user?.role ?? 'parent').toLowerCase() as UserRole,
      phone: String(data.phone ?? data.user?.phone ?? ''),
      profileImage: String(data.profileImage ?? data.user?.profileImage ?? ''),
      createdAt: String(data.createdAt ?? data.user?.createdAt ?? new Date().toISOString()),
    };

    return { token: data.token, user };
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const rawData: AuthResponse = await authService.login(email, password);
      const data = normalizeAuthResponse(rawData);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.user.role);
      localStorage.setItem('user', JSON.stringify(data.user));
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      normalizeAndSetUser(data.user);
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
      const rawData: AuthResponse = await authService.signup(payload);
      const data = normalizeAuthResponse(rawData);
      if (data.token) {
        localStorage.setItem('token', data.token);
      }
      normalizeAndSetUser(data.user);
      localStorage.setItem('isAuthenticated', 'true');
      setIsAuthenticated(true);
      return data;
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
    // Remove auth-specific keys only — deliberately preserve onboarding state
    // (latestChildId, screeningSubmitted_*, screeningResult_*, latestChildName)
    // so that returning parents are not treated as new users after re-login.
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('userId');
    localStorage.removeItem('role');
    localStorage.removeItem('isAuthenticated');
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

  const updateUserFields = (fields: Partial<User>) => {
    if (!user) return;
    const newUser = { ...user, ...fields };
    setUser(newUser);
    localStorage.setItem('user', JSON.stringify(newUser));
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
    updateUserFields,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;