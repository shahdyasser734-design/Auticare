import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthContextType, User, AuthResponse, UserRole } from '../types';
import { authService } from '../services/authService';
import { childrenService } from '../services/api/childrenService';

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
  const [authInitialized, setAuthInitialized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [childrenLoaded, setChildrenLoaded] = useState(false);
  const [parentChildren, setParentChildren] = useState<any[]>([]);
  const [activeChildId, setActiveChildId] = useState<string | null>(() => localStorage.getItem('latestChildId') || null);
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
        setChildrenLoaded(false);
        setParentChildren([]);
        setLoading(false);
        setAuthInitialized(true);
        return;
      }
      
      setLoading(true);
      
      try {
        const storedUser = localStorage.getItem('user') || '{}';
        const parsedUser = JSON.parse(storedUser) as User;
        const role = parsedUser.role.toLowerCase();

        if (role === 'parent') {
          try {
            const kids = await childrenService.getMyChildren();
            setParentChildren(kids);
            if (kids.length > 0 && !localStorage.getItem('latestChildId')) {
              setActiveChildId(kids[0].id);
              localStorage.setItem('latestChildId', kids[0].id);
              localStorage.setItem('latestChildName', kids[0].name);
            }
          } catch (e) {
            console.warn('[AuthContext] Failed to fetch children:', e);
          }
        }
        setChildrenLoaded(true);
      } catch (err) {
        console.warn('[AuthContext] Failed to sync user state:', err);
      } finally {
        setChildrenLoaded(true);
        setLoading(false);
        setAuthInitialized(true);
      }
    };

    void init();
  }, []);

  useEffect(() => {
    const handleUnauthorized = (e: Event) => {
      const customEvent = e as CustomEvent;
      const url = customEvent.detail?.url || '';
      
      // If it's a login or register endpoint, ignore
      if (url.includes('/auth/login') || url.includes('/auth/register')) return;
      
      // Ignore /profile paths if they existed
      if (url.includes('/profile')) {
        return;
      }
      
      console.warn('[AuthContext] Session expired or invalid. Logging out.');
      logout();
    };
    
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  const normalizeAuthResponse = (data: AuthResponse) => {
    const rawUser = (data.user ?? data) as any;
    const email = String(rawUser.email ?? '').toLowerCase();
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

    const specialization = String(
      rawUser.specialization ??
      rawUser.specialty ??
      (email ? localStorage.getItem(`auticare.user.specialization.${email}`) : '') ??
      ''
    );
    const yearsOfExperience = rawUser.yearsOfExperience ?? (email ? (localStorage.getItem(`auticare.user.yearsOfExperience.${email}`) || undefined) : undefined);
    const licenseNumber = String(
      rawUser.licenseNumber ??
      (email ? localStorage.getItem(`auticare.user.licenseNumber.${email}`) : '') ??
      ''
    );
    const bio = String(
      rawUser.bio ??
      (email ? localStorage.getItem(`auticare.user.bio.${email}`) : '') ??
      ''
    );
    const gender = String(
      rawUser.gender ??
      (email ? localStorage.getItem(`auticare.user.gender.${email}`) : '') ??
      ''
    );

    const user: User = {
      id: String(rawUser.id ?? rawUser.userId ?? data.userId ?? ''),
      email,
      name: String(rawUser.name ?? data.fullName ?? rawUser.fullName ?? (rawUser.firstName ? `${rawUser.firstName} ${rawUser.lastName ?? ''}`.trim() : '')),
      role: String(rawUser.role ?? data.role ?? localStorage.getItem('role') ?? 'parent').trim().toLowerCase() as UserRole,
      phone,
      nationalId,
      profileImage,
      createdAt: String(rawUser.createdAt ?? new Date().toISOString()),
      specialization,
      specialty: specialization,
      yearsOfExperience,
      licenseNumber,
      bio,
      gender,
    };

    return { token: data.token, user };
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const rawData: AuthResponse = await authService.login(email, password);
      console.log('[AuthContext] login rawData:', JSON.stringify(rawData));
      
      const tempToken = rawData.token || (rawData as any).accessToken;
      if (tempToken) {
        localStorage.setItem('token', tempToken);
      }

      const profileData = rawData.user ?? rawData;
      const mergedData = { token: tempToken, user: profileData };
      const data = normalizeAuthResponse(mergedData as unknown as AuthResponse);

      if (data.user.role === 'parent') {
        try {
          const kids = await childrenService.getMyChildren();
          setParentChildren(kids);
          
          if (kids && kids.length > 0 && kids[0].id) {
            localStorage.setItem('latestChildId', kids[0].id);
            localStorage.setItem('latestChildName', kids[0].name || '');
          }
        } catch (e) {
          console.warn('[AuthContext] Failed to fetch children on login:', e);
        }
      }
      setChildrenLoaded(true);

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
      
      const tempToken = rawData.token || (rawData as any).accessToken;
      if (tempToken) {
        localStorage.setItem('token', tempToken);
      }

      let profileData = { ...payload, ...(rawData.user ?? rawData) };
      const mergedData = { token: tempToken, user: profileData };
      const data = normalizeAuthResponse(mergedData as unknown as AuthResponse);
      
      if (payload.phone) {
        data.user.phone = String(payload.phone);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.phone.${String(data.user.email).toLowerCase()}`, String(payload.phone));
        }
      }
      if (payload.nationalId) {
        data.user.nationalId = String(payload.nationalId);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.nationalId.${String(data.user.email).toLowerCase()}`, String(payload.nationalId));
        }
      }
      if (payload.specialization) {
        data.user.specialization = String(payload.specialization);
        data.user.specialty = String(payload.specialization);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.specialization.${String(data.user.email).toLowerCase()}`, String(payload.specialization));
        }
      }
      if (payload.yearsOfExperience) {
        data.user.yearsOfExperience = Number(payload.yearsOfExperience);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.yearsOfExperience.${String(data.user.email).toLowerCase()}`, String(payload.yearsOfExperience));
        }
      }
      if (payload.licenseNumber) {
        data.user.licenseNumber = String(payload.licenseNumber);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.licenseNumber.${String(data.user.email).toLowerCase()}`, String(payload.licenseNumber));
        }
      }
      if (payload.bio) {
        data.user.bio = String(payload.bio);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.bio.${String(data.user.email).toLowerCase()}`, String(payload.bio));
        }
      }
      if (payload.gender) {
        data.user.gender = String(payload.gender);
        if (data.user.email) {
          localStorage.setItem(`auticare.user.gender.${String(data.user.email).toLowerCase()}`, String(payload.gender));
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

  const logout = async () => {
    if (localStorage.getItem('token')) {
      try {
        await authService.logout();
      } catch (e) {
        // Suppress logout 401 errors
      }
    }
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
    const safeEmail = String(newUser.email).toLowerCase();
    
    if (fields.phone && newUser.email) {
      localStorage.setItem(`auticare.user.phone.${safeEmail}`, String(fields.phone));
    }
    if (fields.nationalId && newUser.email) {
      localStorage.setItem(`auticare.user.nationalId.${safeEmail}`, String(fields.nationalId));
    }
    if (fields.specialization && newUser.email) {
      localStorage.setItem(`auticare.user.specialization.${safeEmail}`, String(fields.specialization));
    }
    if (fields.yearsOfExperience !== undefined && newUser.email) {
      localStorage.setItem(`auticare.user.yearsOfExperience.${safeEmail}`, String(fields.yearsOfExperience));
    }
    if (fields.licenseNumber && newUser.email) {
      localStorage.setItem(`auticare.user.licenseNumber.${safeEmail}`, String(fields.licenseNumber));
    }
    if (fields.bio && newUser.email) {
      localStorage.setItem(`auticare.user.bio.${safeEmail}`, String(fields.bio));
    }
    if (fields.gender && newUser.email) {
      localStorage.setItem(`auticare.user.gender.${safeEmail}`, String(fields.gender));
    }
  };

  const value: AuthContextType = {
    authInitialized,
    user,
    loading,
    childrenLoaded,
    parentChildren,
    activeChildId,
    setActiveChildId: (id: string | null) => {
      setActiveChildId(id);
      if (id) {
        localStorage.setItem('latestChildId', id);
        const child = parentChildren.find(c => c.id === id);
        if (child) localStorage.setItem('latestChildName', child.name);
      } else {
        localStorage.removeItem('latestChildId');
        localStorage.removeItem('latestChildName');
      }
    },
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