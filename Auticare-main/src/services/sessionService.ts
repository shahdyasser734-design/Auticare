import apiClient from './apiClient';
import type { Session, Specialist, AvailableSlot } from '../types';

export const sessionService = {
  getUpcomingSessions: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/sessions/upcoming');
    return response.data;
  },

  getSessionHistory: async (): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>('/sessions/history');
    return response.data;
  },

  getSession: async (sessionId: string): Promise<Session> => {
    const response = await apiClient.get<Session>(`/sessions/${sessionId}`);
    return response.data;
  },

  createSession: async (specialistId: string, slotId: string): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', {
      specialistId,
      slotId,
    });
    return response.data;
  },

  cancelSession: async (sessionId: string): Promise<void> => {
    await apiClient.delete(`/sessions/${sessionId}`);
  },

  updateSessionNotes: async (sessionId: string, notes: string): Promise<Session> => {
    const response = await apiClient.put<Session>(`/sessions/${sessionId}/notes`, {
      notes,
    });
    return response.data;
  },

  joinSession: async (sessionId: string): Promise<{ joinLink: string }> => {
    const response = await apiClient.post<{ joinLink: string }>(
      `/sessions/${sessionId}/join`,
      {}
    );
    return response.data;
  },

  getSpecialists: async (type?: 'doctor' | 'therapist'): Promise<Specialist[]> => {
    const params = type ? { type } : {};
    const response = await apiClient.get<Specialist[]>('/specialists', { params });
    return response.data;
  },

  getSpecialist: async (specialistId: string): Promise<Specialist> => {
    const response = await apiClient.get<Specialist>(`/specialists/${specialistId}`);
    return response.data;
  },

  searchSpecialists: async (
    query: string,
    type?: 'doctor' | 'therapist'
  ): Promise<Specialist[]> => {
    const params = { q: query, ...(type && { type }) };
    const response = await apiClient.get<Specialist[]>('/specialists/search', { params });
    return response.data;
  },

  createAvailableSlot: async (
    date: string,
    startTime: string,
    endTime: string
  ): Promise<AvailableSlot> => {
    const response = await apiClient.post<AvailableSlot>('/specialists/slots', {
      date,
      startTime,
      endTime,
    });
    return response.data;
  },

  getAvailableSlots: async (specialistId: string): Promise<AvailableSlot[]> => {
    const response = await apiClient.get<AvailableSlot[]>(
      `/specialists/${specialistId}/slots`
    );
    return response.data;
  },

  deleteAvailableSlot: async (slotId: string): Promise<void> => {
    await apiClient.delete(`/specialists/slots/${slotId}`);
  },
};
