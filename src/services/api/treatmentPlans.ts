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

  let titleVal = p.title || '';
  if (!titleVal && p.notes) {
    const firstLine = p.notes.split('\n')[0];
    if (firstLine && !firstLine.trim().startsWith('{')) {
      titleVal = firstLine;
    }
  }
  titleVal = titleVal || 'Treatment Plan';

  return {
    ...p,
    id: idStr,
    childId: String(p.childId || ''),
    doctorId: String(p.specialistId || p.doctorId || ''),
    specialistId: String(p.specialistId || p.doctorId || ''),
    specialistName: p.specialistName || '',
    title: titleVal,
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
    const response = await apiClient.get<TreatmentPlan>(`/treatment-plans/${id}`);
    return normalizeTreatmentPlan(response.data);
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

  deletePlan: async (id: string): Promise<void> => {
    const user = await authService.getCurrentUser();
    if (user.role?.toLowerCase() !== 'doctor') {
      throw new Error('Access Denied: Only Doctor can delete Treatment Plans');
    }
    // Also fallback to standard REST if needed, but per instructions we pass treatmentPlanId
    try {
      await apiClient.delete(`/TreatmentPlan/DeleteTreatmentPlan?treatmentPlanId=${id}`);
    } catch {
      await apiClient.delete(`/treatment-plans/${id}`);
    }
  },

  getChildPlans: async (childId: string): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>(`/treatment-plans/child/${childId}`);
    return (response.data || []).map(normalizeTreatmentPlan);
  },

  getMyPlans: async (): Promise<TreatmentPlan[]> => {
    const response = await apiClient.get<TreatmentPlan[]>('/treatment-plans/my-plans');
    return (response.data || []).map(normalizeTreatmentPlan);
  },
};

