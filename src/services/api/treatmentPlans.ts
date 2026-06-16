import apiClient from '../apiClient';
import type { TreatmentPlan } from '../../types';
import { localNotificationManager } from './localNotificationManager';
import { childrenService } from './childrenService';
export type { TreatmentPlan };

export interface CreateTreatmentPlanRequest {
  childId: string | number;
  specialistId: string | number;
  startDate: string;
  endDate?: string | null;
  goal: string;
  notes: string;
}

 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const notesVal = p.notes || '';
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
    goal: p.goal || goalsArray.join('\n') || '',
    progress: p.progress || p.status || 'active',
    createdAt: p.createdAt || '',
    updatedAt: p.updatedAt || p.createdAt || ''
  };
};

export const treatmentPlansService = {
  createPlan: async (data: CreateTreatmentPlanRequest): Promise<TreatmentPlan> => {
    const response = await apiClient.post<TreatmentPlan>('/treatment-plans', data);
    const normalized = normalizeTreatmentPlan(response.data);

    try {
      const childId = String(data.childId);
      const child = await childrenService.getChild(childId);
      if (child?.parentId) {
        localNotificationManager.emitNotification(
          child.parentId,
          'treatment-plan',
          'New Treatment Plan',
          'A new treatment plan has been published for your child.',
          normalized.id
        );
      }
    } catch {
      // Ignored
    }

    if (normalized.specialistId) {
      localNotificationManager.emitNotification(
        normalized.specialistId,
        'treatment-plan',
        'Treatment Plan Published',
        `Treatment Plan for patient published successfully.`,
        normalized.id
      );
    }

    return normalized;
  },

  getPlan: async (id: string): Promise<TreatmentPlan> => {
    try {
      const response = await apiClient.get<TreatmentPlan>(`/treatment-plans/${id}`);
      return normalizeTreatmentPlan(response.data);
    } catch (err) {
      // Fallback for therapist or permissions issue
      try {
        const myPlans = await treatmentPlansService.getMyPlans();
        const found = myPlans.find((p: any) => String(p.id) === String(id) || String(p.treatmentId) === String(id));
        if (found) return found;
      } catch (e) {
        // Ignored
      }
      throw err;
    }
  },

  updatePlan: async (id: string, data: Partial<CreateTreatmentPlanRequest>): Promise<TreatmentPlan> => {
    const response = await apiClient.put<TreatmentPlan>(`/treatment-plans/${id}`, data);
    const normalized = normalizeTreatmentPlan(response.data);

    try {
      if (data.childId) {
        const childId = String(data.childId);
        const child = await childrenService.getChild(childId);
        if (child?.parentId) {
          localNotificationManager.emitNotification(
            child.parentId,
            'treatment-plan',
            'Treatment Plan Updated',
            'A treatment plan for your child has been updated.',
            normalized.id
          );
        }
      }
    } catch {
      // Ignored
    }

    if (normalized.specialistId) {
      localNotificationManager.emitNotification(
        normalized.specialistId,
        'treatment-plan',
        'Treatment Plan Updated',
        `Treatment Plan for patient updated successfully.`,
        normalized.id
      );
    }

    return normalized;
  },

  getChildPlans: async (childId: string): Promise<TreatmentPlan[]> => {
    try {
      const response = await apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${childId}`);
      const plans = (response.data || []).map(normalizeTreatmentPlan);
      if (plans.length > 0) return plans;
    } catch (err) {
      // Ignore error, proceed to fallback
    }

    // Fallback: Try fetching via my-plans to see if it's a role-based visibility issue
    try {
      const myPlans = await treatmentPlansService.getMyPlans();
      return myPlans.filter((p: any) => String(p.childId) === String(childId));
    } catch (e) {
      return [];
    }
  },

  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    try {
      const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
      return (response.data || []).map(normalizeTreatmentPlan);
    } catch (err) {
      console.warn('Backend /treatment-plans/my-plans returned error, using fallback to bookings:', err);
      try {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const bookings = await apiClient.get<any[]>('/bookings/my-bookings');
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        const uniqueChildIds = [...new Set((bookings.data || []).map((b: any) => b.childId).filter(Boolean))];
        if (uniqueChildIds.length > 0) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
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

