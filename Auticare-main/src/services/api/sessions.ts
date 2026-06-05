import apiClient from '../apiClient';

export interface Session {
  id: string;
  userId: string;
  specialistId: string;
  specialistType: 'doctor' | 'therapist';
  startTime: string;
  endTime: string;
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
  notes?: string;
  joinLink?: string;
  treatmentId?: string;
}

export interface CreateSessionRequest {
  specialistId: string;
  childId: string;
  startTime: string;
  endTime: string;
  notes?: string;
}

export const sessionsService = {
  createSession: async (data: CreateSessionRequest): Promise<Session> => {
    const response = await apiClient.post<Session>('/sessions', data);
    return response.data;
  },

  getSessionsByTreatment: async (treatmentId: string): Promise<Session[]> => {
    const response = await apiClient.get<Session[]>(`/sessions/treatment/${treatmentId}`);
    return response.data;
  },

  updateSession: async (id: string, data: Partial<CreateSessionRequest>): Promise<Session> => {
    const response = await apiClient.put<Session>(`/sessions/${id}`, data);
    return response.data;
  },
};
