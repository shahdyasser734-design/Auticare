import apiClient from '../apiClient';
import type { TreatmentPlan } from '../../types';

export const treatmentPlansService = {
  // Create a new treatment plan
  createPlan: async (data: Partial<TreatmentPlan>): Promise<TreatmentPlan> => {
    const response = await apiClient.post<TreatmentPlan>('/treatment-plans', data);
    return response.data;
  },

  // Get specific treatment plan
  getPlan: async (id: string): Promise<TreatmentPlan> => {
    const response = await apiClient.get<TreatmentPlan>(`/treatment-plans/${id}`);
    return response.data;
  },

  // Update treatment plan
  updatePlan: async (id: string, data: Partial<TreatmentPlan>): Promise<TreatmentPlan> => {
    const response = await apiClient.put<TreatmentPlan>(`/treatment-plans/${id}`, data);
    return response.data;
  },

  // Get all treatment plans for a child
  getChildPlans: async (childId: string): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${childId}`);
    return response.data;
  },

  // Get all treatment plans for current specialist
  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
    return response.data;
  },

  // Delete treatment plan
  deletePlan: async (id: string): Promise<void> => {
    await apiClient.delete(`/treatment-plans/${id}`);
  },
};
