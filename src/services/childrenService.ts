import apiClient from './apiClient';

export interface Child {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  age: number;
  gender: string;
  dateOfBirth?: string;
  notes?: string;
}

export const childrenService = {
  getChildren: async (): Promise<Child[]> => {
    const response = await apiClient.get<Child[]>('/children');
    return response.data;
  },

  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<Child>(`/children/${id}`);
    return response.data;
  },

  createChild: async (data: Omit<Child, 'id'>): Promise<Child> => {
    const response = await apiClient.post<Child>('/children', data);
    return response.data;
  },

  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.put<Child>(`/children/${id}`, data);
    return response.data;
  },

  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
