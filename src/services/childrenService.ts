import apiClient from './apiClient';
import type { Child } from '../types';
export type { Child } from '../types';

const normalizeChild = (raw: Record<string, unknown>): Child => {
  const id = String(raw.id ?? raw._id ?? raw.childId ?? raw.child_id ?? '');

  return {
    id,
    parentId: (raw.parentId ?? raw.parent_id ?? raw.parent ?? 'parent-123') as string,
    name: String(raw.name ?? `${raw.firstName ?? ''} ${raw.lastName ?? ''}`.trim()),
    age: (raw.age ?? raw.ageInYears ?? raw.childAge ?? 0) as number,
    gender: (raw.gender ?? raw.sex ?? 'Unknown') as string,
    dateOfBirth: (raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob ?? '') as string,
    profileImage: (raw.profileImage ?? raw.profile_image ?? raw.profile_image_url ?? '') as string,
    medicalHistory: (raw.medicalHistory ?? raw.medical_history ?? '') as string,
    familyAutismHistory: (raw.familyAutismHistory ?? raw.family_autism_history ?? false) as boolean,
    jaundiceHistory: (raw.jaundiceHistory ?? raw.jaundice_history ?? false) as boolean,
    notes: (raw.notes ?? '') as string,
    createdAt: (raw.createdAt ?? raw.created_at ?? new Date().toISOString()) as string,
  };
};

export const childrenService = {
  getChildren: async (): Promise<Child[]> => {
    try {
      const response = await apiClient.get<Record<string, unknown>[]>('/children');
      return response.data.map(normalizeChild);
    } catch (error) {
      console.warn('Children API unavailable.', error);
      return [];
    }
  },

  getChild: async (id: string): Promise<Child> => {
    const response = await apiClient.get<Record<string, unknown>>(`/children/${id}`);
    return normalizeChild(response.data);
  },

  createChild: async (
    data: Omit<Child, 'id' | 'createdAt' | 'parentId'> & { firstName?: string; lastName?: string }
  ): Promise<Child> => {
    const response = await apiClient.post<Record<string, unknown>>('/children', data);
    return normalizeChild(response.data);
  },

  updateChild: async (id: string, data: Partial<Child>): Promise<Child> => {
    const response = await apiClient.put<Record<string, unknown>>(`/children/${id}`, data);
    return normalizeChild(response.data);
  },

  deleteChild: async (id: string): Promise<void> => {
    await apiClient.delete(`/children/${id}`);
  },
};
