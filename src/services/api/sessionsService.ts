import apiClient from '../apiClient';
import type { TherapySession } from '../../types';

export const sessionsService = {
  // Create a new session
  createSession: async (data: Partial<TherapySession>): Promise<TherapySession> => {
    const response = await apiClient.post<TherapySession>('/sessions', data);
    return response.data;
  },

  // Get session details
  getSession: async (id: string): Promise<TherapySession> => {
    const response = await apiClient.get<TherapySession>(`/sessions/${id}`);
    return response.data;
  },

  // Update session
  updateSession: async (id: string, data: Partial<TherapySession>): Promise<TherapySession> => {
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

  // Cancel session
  cancelSession: async (id: string, reason?: string): Promise<TherapySession> => {
    const response = await apiClient.patch<TherapySession>(`/sessions/${id}/cancel`, {
      reason,
    });
    return response.data;
  },

  // Mark session as completed
  completeSession: async (
    id: string,
    notes?: string,
    recording?: string
  ): Promise<TherapySession> => {
    const response = await apiClient.patch<TherapySession>(`/sessions/${id}/complete`, {
      notes,
      recordingUrl: recording,
    });
    return response.data;
  },
};
