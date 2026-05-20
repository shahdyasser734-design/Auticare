import apiClient from './apiClient';
import type { User, UserRole } from '../types';

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  token: string;
  user: User;
}

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  signup: async (
    // Support both old signature and new object payload
    emailOrPayload: string | Record<string, unknown>,
    password?: string,
    name?: string,
    role?: UserRole
  ): Promise<SignupResponse> => {
    let payload: Record<string, unknown>;
    if (typeof emailOrPayload === 'string') {
      // old call: (email, password, name, role)
      payload = {
        fullName: name || '',
        email: emailOrPayload,
        password: password || '',
        role: role ? String(role).charAt(0).toUpperCase() + String(role).slice(1) : undefined,
      };
    } else {
      payload = { ...emailOrPayload };
      // ensure role formatting if present
      if (payload.role && typeof payload.role === 'string') {
        payload.role = (payload.role as string).charAt(0).toUpperCase() + (payload.role as string).slice(1);
      }
    }

    const response = await apiClient.post<SignupResponse>('/auth/register', payload);
    return response.data;
  },

  forgotPassword: async (email: string): Promise<void> => {
    await apiClient.post('/auth/forgot-password', { email });
  },

  resetPassword: async (token: string, password: string): Promise<void> => {
    await apiClient.post('/auth/reset-password', { token, password });
  },

  logout: async (): Promise<void> => {
    try {
      await apiClient.post('/auth/logout', {});
    } catch {
      // Ignore logout API errors — clear local state regardless
    }
  },

  verifyEmail: async (_code: string): Promise<void> => {
    // Not implemented in backend — no-op
    await new Promise((resolve) => setTimeout(resolve, 300));
  },

  getCurrentUser: async (): Promise<User> => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
    throw new Error('Not authenticated');
  },

  updateProfile: async (data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>('/profile/update', data);
    return response.data;
  },
};
