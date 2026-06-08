import apiClient from '../apiClient';
import type { TreatmentPlan } from '../../types';
export type { TreatmentPlan };

export interface CreateTreatmentPlanRequest {
  childId: string | number;
  specialistId: string | number;
  startDate: string;
  endDate?: string | null;
  goal: string;
  notes: string;
}

export const normalizeTreatmentPlan = (p: any): any => {
  if (!p) return p;
  const idStr = String(p.treatmentId || p.id || '');
  
  let goalsArray: string[] = [];
  if (Array.isArray(p.goals)) {
    goalsArray = p.goals;
  } else if (p.goal) {
    goalsArray = p.goal.split('\n').map((g: string) => g.trim()).filter(Boolean);
  }

  let descriptionVal = p.description || '';
  let notesVal = p.notes || '';
  if (!descriptionVal && p.notes) {
    descriptionVal = p.notes;
  }

  return {
    ...p,
    id: idStr,
    childId: String(p.childId || ''),
    doctorId: String(p.specialistId || p.doctorId || ''),
    specialistId: String(p.specialistId || p.doctorId || ''),
    specialistName: p.specialistName || '',
    title: p.title || p.notes?.split('\n')[0] || 'Treatment Plan',
    description: descriptionVal,
    goals: goalsArray,
    recommendations: Array.isArray(p.recommendations) ? p.recommendations : (p.recommendations ? [p.recommendations] : []),
    homeActivities: Array.isArray(p.homeActivities) ? p.homeActivities : (p.homeActivities || []),
    assignedTherapists: Array.isArray(p.assignedTherapists) ? p.assignedTherapists : (p.assignedTherapists || []),
    status: p.status || 'active',
    startDate: p.startDate || p.createdAt || '',
    endDate: p.endDate || undefined,
    notes: notesVal,
    createdAt: p.createdAt || '',
    updatedAt: p.updatedAt || p.createdAt || ''
  };
};

export const treatmentPlansService = {
  createPlan: async (data: CreateTreatmentPlanRequest): Promise<TreatmentPlan> => {
    const response = await apiClient.post<TreatmentPlan>('/treatment-plans', data);
    return normalizeTreatmentPlan(response.data);
  },

  getPlan: async (id: string): Promise<TreatmentPlan> => {
    const response = await apiClient.get<TreatmentPlan>(`/treatment-plans/${id}`);
    return normalizeTreatmentPlan(response.data);
  },

  updatePlan: async (id: string, data: Partial<CreateTreatmentPlanRequest>): Promise<TreatmentPlan> => {
    const response = await apiClient.put<TreatmentPlan>(`/treatment-plans/${id}`, data);
    return normalizeTreatmentPlan(response.data);
  },

  getChildPlans: async (childId: string): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${childId}`);
    return (response.data || []).map(normalizeTreatmentPlan);
  },

  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    try {
      const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
      return (response.data || []).map(normalizeTreatmentPlan);
    } catch (err) {
      console.warn('Backend /treatment-plans/my-plans returned error, using fallback to bookings:', err);
      try {
        const bookings = await apiClient.get<any[]>('/bookings/my-bookings');
        const uniqueChildIds = [...new Set((bookings.data || []).map((b: any) => b.childId).filter(Boolean))];
        if (uniqueChildIds.length > 0) {
          const plansPromises = uniqueChildIds.map((cId: any) => 
            apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${cId}`)
              .then(res => res.data || [])
              .catch(() => [])
          );
          const plansArrays = await Promise.all(plansPromises);
          return plansArrays.flat().map(normalizeTreatmentPlan);
        }
      } catch (bookingErr) {
        console.warn('Bookings fallback failed:', bookingErr);
      }
      return [];
    }
  },
};

