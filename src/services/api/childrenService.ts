import apiClient from '../apiClient';
import type { Child } from '../../types';

export const childrenService = {
  // Create a new child profile
  createChild: async (data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.post<Child>('/children', data);
    return response.data;
  },

  // Get specific child details
  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<Child>(`/children/${id}`);
    return response.data;
  },

  // Get all children for current parent
  getMyChildren: async (): Promise<Child[]> => {
    const response = await apiClient.get<Child[]>('/children/my-children');
    return response.data;
  },

  // Update child profile
  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.put<Child>(`/children/${id}`, data);
    return response.data;
  },

  // Delete child profile
  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
