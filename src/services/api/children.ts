import apiClient from '../apiClient';

export interface Child {
  id: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  age?: number;
  dateOfBirth: string;
  gender: string;
  familyAutismHistory?: boolean;
  jaundiceHistory?: boolean;
  medicalHistory?: string;
  parentId?: string;
  createdAt?: string;
}

export interface CreateChildRequest {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender: string;
  familyAutismHistory?: boolean;
  jaundiceHistory?: boolean;
  medicalHistory?: string;
}

export const childrenService = {
  getChildren: async (): Promise<Child[]> => {
    const response = await apiClient.get<Child[]>('/children');
    return response.data;
  },

  createChild: async (data: CreateChildRequest): Promise<Child> => {
    const response = await apiClient.post<Child>('/children', data);
    return response.data;
  },

  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<Child>(`/children/${id}`);
    return response.data;
  },

  updateChild: async (id: string, data: Partial<CreateChildRequest>): Promise<Child> => {
    const response = await apiClient.put<Child>(`/children/${id}`, data);
    return response.data;
  },

  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
