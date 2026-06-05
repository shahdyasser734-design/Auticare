import apiClient from './apiClient';
import type { Patient, PatientDetails } from '../types';

export const patientService = {
  getPatients: async (): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients');
    return response.data;
  },

  searchPatients: async (query: string): Promise<Patient[]> => {
    const response = await apiClient.get<Patient[]>('/patients/search', {
      params: { q: query },
    });
    return response.data;
  },

  getPatient: async (patientId: string): Promise<PatientDetails> => {
    const response = await apiClient.get<PatientDetails>(`/patients/${patientId}`);
    return response.data;
  },

  updatePatientNotes: async (patientId: string, notes: string): Promise<void> => {
    await apiClient.put(`/patients/${patientId}/notes`, { notes });
  },

  getPatientSessions: async (patientId: string) => {
    const response = await apiClient.get(`/patients/${patientId}/sessions`);
    return response.data;
  },

  getPatientTestResults: async (patientId: string) => {
    const response = await apiClient.get(`/patients/${patientId}/test-results`);
    return response.data;
  },
};
