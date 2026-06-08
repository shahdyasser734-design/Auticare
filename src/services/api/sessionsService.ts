import apiClient from '../apiClient';
import type { TherapySession } from '../../types';

export const sessionsService = {
  // Create a new session
  createSession: async (data: any): Promise<TherapySession> => {
    const response = await apiClient.post<TherapySession>('/sessions', data);
    return response.data;
  },

  // Get session details
  getSession: async (id: string): Promise<TherapySession> => {
    const response = await apiClient.get<TherapySession>(`/sessions/${id}`);
    return response.data;
  },

  // Update session
  updateSession: async (id: string, data: any): Promise<TherapySession> => {
    const response = await apiClient.put<TherapySession>(`/sessions/${id}`, data);
    return response.data;
  },

  // Get sessions for a treatment plan
  getTreatmentSessions: async (treatmentPlanId: string): Promise<TherapySession[]> => {
    const response = await apiClient.get<TherapySession[]>(
      `/sessions/treatment/${treatmentPlanId}`
    );
    return response.data;
  },

  // Get upcoming sessions
  getUpcomingSessions: async (): Promise<TherapySession[]> => {
    const response = await apiClient.get<TherapySession[]>('/sessions/upcoming');
    return response.data;
  },

  // Mark session as completed (mapped to PUT /api/sessions/{id} per requirements)
  completeSession: async (
    id: string,
    notes?: string,
    activityNotes?: string,
    report?: string
  ): Promise<TherapySession> => {
    const response = await apiClient.put<TherapySession>(`/sessions/${id}`, {
      sessionNotes: notes || '',
      activityNotes: activityNotes || '',
      report: report || '',
      status: 'Completed'
    });
    return response.data;
  },
};
