import apiClient from './apiClient';
import type { User, UserRole } from '../types';

export const userService = {
  getUsers: async (role?: UserRole): Promise<User[]> => {
    const params = role ? { role } : {};
    const response = await apiClient.get<User[]>('/users', { params });
    return response.data;
  },

  getUser: async (userId: string): Promise<User> => {
    const response = await apiClient.get<User>(`/users/${userId}`);
    return response.data;
  },

  updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
    const response = await apiClient.put<User>(`/users/${userId}`, data);
    return response.data;
  },

  deleteUser: async (userId: string): Promise<void> => {
    await apiClient.delete(`/users/${userId}`);
  },
};
