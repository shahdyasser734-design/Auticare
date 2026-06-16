import apiClient from '../apiClient';
import type { TreatmentPlan } from '../../types';
import { authService } from '../authService';
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
    status: p.status || 'active',
    startDate: p.startDate || p.createdAt || '',
    endDate: p.endDate || undefined,
    notes: notesVal,
    goal: p.goal || goalsArray.join('\n') || '',
    progress: p.progress || p.status || 'active',
    createdAt: p.createdAt || '',
    updatedAt: p.updatedAt || p.createdAt || '',
    visibleTo: Array.isArray(p.visibleTo) ? p.visibleTo : (p.visibleTo || []),
  };
};

export const treatmentPlansService = {
  createPlan: async (data: CreateTreatmentPlanRequest): Promise<TreatmentPlan> => {
    const user = await authService.getCurrentUser();
    if (user.role?.toLowerCase() !== 'doctor') {
      throw new Error('Access Denied: Only Doctor can modify Treatment Plans');
    }

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
        const found = myPlans.find(p => String(p.id) === String(id) || String((p as TreatmentPlan & { treatmentId?: string }).treatmentId) === String(id));
        if (found) return found;
      } catch {
        // Ignored
      }
      throw err;
    }
  },

  updatePlan: async (id: string, data: Partial<CreateTreatmentPlanRequest>): Promise<TreatmentPlan> => {
    const user = await authService.getCurrentUser();
    if (user.role?.toLowerCase() !== 'doctor') {
      throw new Error('Access Denied: Only Doctor can modify Treatment Plans');
    }

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
      const user = await authService.getCurrentUser();
      let plans = (response.data || []).map(normalizeTreatmentPlan);
      plans = plans.filter(p => {
        const hasAccess = p.visibleTo?.includes(String(user.id)) || p.doctorId === String(user.id);
        if (!hasAccess) return false;
        if (user.role?.toLowerCase() === 'doctor') return true;
        return p.status === 'PUBLISHED';
      });
      if (plans.length > 0) return plans;
    } catch {
      // Ignore error, proceed to fallback
    }

    // Fallback: Try fetching via my-plans to see if it's a role-based visibility issue
    try {
      const myPlans = await treatmentPlansService.getMyPlans();
      return myPlans.filter(p => String(p.childId) === String(childId));
    } catch {
      return [];
    }
  },

  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    let myPlans: TreatmentPlan[] = [];
    try {
      const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
      myPlans = (response.data || []).map(normalizeTreatmentPlan);
    } catch (err) {
      console.warn('Backend /treatment-plans/my-plans returned error, using fallback to bookings:', err);
    }

    // Always fallback to bookings to guarantee Therapist visibility for Doctor-published plans
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
        const childPlans = plansArrays.flat().map(normalizeTreatmentPlan);
        
        const allPlans = [...myPlans, ...childPlans];
        const deduplicated = Array.from(new Map(allPlans.map(p => [String(p.id), p])).values());
        
        try {
          const user = await authService.getCurrentUser();
          return deduplicated.filter(p => {
            const hasAccess = p.visibleTo?.includes(String(user.id)) || p.doctorId === String(user.id);
            if (!hasAccess) return false;
            if (user.role?.toLowerCase() === 'doctor') return true;
            return p.status === 'PUBLISHED';
          });
        } catch {
          return deduplicated;
        }
      }
    } catch (bookingErr) {
      console.warn('Bookings fallback failed:', bookingErr);
    }
    
    try {
      const user = await authService.getCurrentUser();
      return myPlans.filter(p => {
        const hasAccess = p.visibleTo?.includes(String(user.id)) || p.doctorId === String(user.id);
        if (!hasAccess) return false;
        if (user.role?.toLowerCase() === 'doctor') return true;
        return p.status === 'PUBLISHED';
      });
    } catch {
      return myPlans;
    }
  },
};

