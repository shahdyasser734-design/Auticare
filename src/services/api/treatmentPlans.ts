import apiClient from '../apiClient';

export interface TreatmentPlan {
  id: string;
  childId: string;
  specialistId: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  goals: string[];
  status: 'active' | 'completed' | 'paused';
  createdAt: string;
  updatedAt: string;
}

export interface CreateTreatmentPlanRequest {
  childId: string;
  specialistId: string;
  title: string;
  description: string;
  startDate: string;
  endDate?: string;
  goals: string[];
}

export const treatmentPlansService = {
  createPlan: async (data: CreateTreatmentPlanRequest): Promise<TreatmentPlan> => {
    const response = await apiClient.post<TreatmentPlan>('/treatment-plans', data);
    return response.data;
  },

  getPlan: async (id: string): Promise<TreatmentPlan> => {
    const response = await apiClient.get<TreatmentPlan>(`/treatment-plans/${id}`);
    return response.data;
  },

  updatePlan: async (id: string, data: Partial<CreateTreatmentPlanRequest>): Promise<TreatmentPlan> => {
    const response = await apiClient.put<TreatmentPlan>(`/treatment-plans/${id}`, data);
    return response.data;
  },

  getChildPlans: async (childId: string): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${childId}`);
    return response.data;
  },

  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
    return response.data;
  },
};
