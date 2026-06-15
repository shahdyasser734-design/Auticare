import apiClient from './apiClient';
import type { LoginResponse, SignupResponse, User } from '../types';

export const authService = {
  login: async (email: string, password: string): Promise<LoginResponse> => {
    const response = await apiClient.post<LoginResponse>('/auth/login', {
      email,
      password,
    });
    return response.data;
  },

  signup: async (payload: Record<string, unknown>): Promise<SignupResponse> => {
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
    await apiClient.post('/auth/logout');
  },

  verifyEmail: async (_code: string): Promise<void> => {
    void _code;
    // No verification endpoint available in current UI, preserve interface
    return Promise.resolve();
  },

  getCurrentUser: async (): Promise<User> => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      return JSON.parse(storedUser) as User;
    }
    throw new Error('Not authenticated');
  },
};
