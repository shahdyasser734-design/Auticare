import apiClient from './apiClient';
import type { Child } from '../types';
import { mockState } from './api/mockState';
export type { Child } from '../types';

const normalizeChild = (raw: any): Child => {
  const id = String(raw.id ?? raw._id ?? raw.childId ?? raw.child_id ?? '');

  return {
    id,
    parentId: raw.parentId ?? raw.parent_id ?? raw.parent ?? 'parent-123',
    name: String(raw.name ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim()),
    age: raw.age ?? raw.ageInYears ?? raw.childAge ?? 0,
    gender: raw.gender ?? raw.sex ?? 'Unknown',
    dateOfBirth: raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob ?? '',
    profileImage: raw.profileImage ?? raw.profile_image ?? raw.profile_image_url ?? '',
    medicalHistory: raw.medicalHistory ?? raw.medical_history ?? '',
    familyAutismHistory: raw.familyAutismHistory ?? raw.family_autism_history ?? false,
    jaundiceHistory: raw.jaundiceHistory ?? raw.jaundice_history ?? false,
    notes: raw.notes ?? '',
    createdAt: raw.createdAt ?? raw.created_at ?? new Date().toISOString(),
  };
};

export const childrenService = {
  getChildren: async (): Promise<Child[]> => {
    try {
      const response = await apiClient.get<any[]>('/children');
      const data = response.data.map(normalizeChild);
      return data.length > 0 ? data : mockState.getChildren();
    } catch (error) {
      console.warn('Children API unavailable, using mock children.', error);
      return mockState.getChildren();
    }
  },

  getChild: async (id: string): Promise<Child> => {
    try {
      const response = await apiClient.get<any>(`/children/${id}`);
      return normalizeChild(response.data);
    } catch (error) {
      const child = mockState.getChildren().find((item) => item.id === id);
      if (!child) throw error;
      return child;
    }
  },

  createChild: async (
    data: Omit<Child, 'id' | 'createdAt' | 'parentId'> & { firstName?: string; lastName?: string }
  ): Promise<Child> => {
    try {
      const response = await apiClient.post<any>('/children', data);
      const child = normalizeChild(response.data);
      mockState.addChild(child);
      return child;
    } catch (error) {
      const child: Child = {
        id: `mock-child-${Date.now()}`,
        parentId: 'parent-123',
        name: `${data.name ?? `${data.firstName ?? 'Child'} ${data.lastName ?? ''}`.trim()}`.trim(),
        age: data.age ?? 0,
        gender: data.gender,
        dateOfBirth: data.dateOfBirth ?? '',
        profileImage: data.profileImage,
        medicalHistory: data.medicalHistory,
        createdAt: new Date().toISOString(),
      };
      mockState.addChild(child);
      return child;
    }
  },

  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    try {
      const response = await apiClient.put<any>(`/children/${id}`, data);
      const child = normalizeChild(response.data);
      mockState.updateChild(id, data);
      return child;
    } catch (error) {
      const children = mockState.updateChild(id, data);
      const child = children.find((item) => item.id === id);
      if (!child) throw error;
      return child;
    }
  },

  deleteChild: async (id: string): Promise<void> => {
    try {
      await apiClient.delete(`/children/${id}`);
    } catch {
      // no-op in mock mode
    }
  },
};
