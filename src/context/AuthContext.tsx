import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User, AuthResponse, UserRole } from '../types';
import { authService } from '../services/authService';
import apiClient from '../services/apiClient';

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
      
      if (!token) {
        setIsAuthenticated(false);
        setUser(null);
        return;
      }
      
      try {
        const response = await apiClient.get<Record<string, unknown>>('/profile');
        const rawUser = response.data;
        const email = String(rawUser.email ?? '');
        const phone = String(
          rawUser.phone ??
          rawUser.phoneNumber ??
          (email ? localStorage.getItem(`auticare.user.phone.${email}`) : '') ??
          ''
        );
        const nationalId = String(
          rawUser.nationalId ??
          rawUser.national_id ??
          (rawUser as any).nationalID ??
          (email ? localStorage.getItem(`auticare.user.nationalId.${email}`) : '') ??
          ''
        );
        const profileImage = String(
          rawUser.profileImage ??
          rawUser.profile_image ??
          (rawUser as any).profilePictureUrl ??
          (rawUser as any).profile_picture_url ??
          (rawUser as any).photoUrl ??
          (rawUser as any).photo_url ??
          (rawUser as any).imageUrl ??
          (rawUser as any).image_url ??
          (rawUser as any).avatarUrl ??
          (rawUser as any).avatar_url ??
          ''
        );

        const updatedUser: User = {
          id: String(rawUser.id ?? rawUser.userId ?? ''),
          email,
          name: String(rawUser.name ?? ''),
          role: String(rawUser.role ?? 'parent').toLowerCase() as UserRole,
          phone,
          nationalId,
          profileImage,
          createdAt: String(rawUser.createdAt ?? new Date().toISOString()),
        };
        normalizeAndSetUser(updatedUser);
      } catch (err) {
        console.warn('[AuthContext] Failed to sync profile from backend:', err);
        const stored = localStorage.getItem('user');
        if (stored && stored !== 'undefined') {
          try {
            const parsed = JSON.parse(stored) as User;
            if (parsed && parsed.email) {
              const enriched = { ...parsed };
              if (!enriched.phone) {
                enriched.phone = localStorage.getItem(`auticare.user.phone.${parsed.email}`) || '';
              }
              if (!enriched.nationalId) {
                enriched.nationalId = localStorage.getItem(`auticare.user.nationalId.${parsed.email}`) || '';
              }
              setUser(enriched);
              localStorage.setItem('user', JSON.stringify(enriched));
            }
          } catch {}
        }
      }
    };

    void init();
  }, []);

  const normalizeAuthResponse = (data: AuthResponse) => {
    const rawUser = (data.user ?? data) as any;
    const email = String(rawUser.email ?? '');
    const phone = String(
      rawUser.phone ??
      rawUser.phoneNumber ??
      (email ? localStorage.getItem(`auticare.user.phone.${email}`) : '') ??
      ''
    );
    const nationalId = String(
      rawUser.nationalId ??
      rawUser.national_id ??
      (rawUser as any).nationalID ??
      (email ? localStorage.getItem(`auticare.user.nationalId.${email}`) : '') ??
      ''
    );
    const profileImage = String(
      rawUser.profileImage ??
      rawUser.profile_image ??
      (rawUser as any).profilePictureUrl ??
      (rawUser as any).profile_picture_url ??
      (rawUser as any).photoUrl ??
      (rawUser as any).photo_url ??
      (rawUser as any).imageUrl ??
      (rawUser as any).image_url ??
      (rawUser as any).avatarUrl ??
      (rawUser as any).avatar_url ??
      ''
    );

    const user: User = {
      id: String(rawUser.id ?? data.userId ?? ''),
      email,
      name: String(rawUser.name ?? data.fullName ?? ''),
      role: String(rawUser.role ?? 'parent').toLowerCase() as UserRole,
      phone,
      nationalId,
      profileImage,
      createdAt: String(rawUser.createdAt ?? new Date().toISOString()),
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
      
      if (payload.phone) {
        data.user.phone = String(payload.phone);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.phone.${data.user.email}`, String(payload.phone));
        }
      }
      if (payload.nationalId) {
        data.user.nationalId = String(payload.nationalId);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.nationalId.${data.user.email}`, String(payload.nationalId));
        }
      }

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
    if (fields.phone && newUser.email) {
      localStorage.setItem(`auticare.user.phone.${newUser.email}`, String(fields.phone));
    }
    if (fields.nationalId && newUser.email) {
      localStorage.setItem(`auticare.user.nationalId.${newUser.email}`, String(fields.nationalId));
    }
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