import apiClient from '../apiClient';
import type { ScreeningResult, ScreeningAnalytics } from '../../types';

export const screeningService = {
  // Get screening results for a child
  getResults: async (childId: string): Promise<ScreeningResult> => {
    const response = await apiClient.get<ScreeningResult>(`/screening/results/${childId}`);
    return response.data;
  },

  // Get screening analytics for a child
  getAnalytics: async (childId: string): Promise<ScreeningAnalytics> => {
    const response = await apiClient.get<ScreeningAnalytics>(`/screening/analytics/${childId}`);
    return response.data;
  },

  // Get all screening results for a child (history)
  getHistory: async (childId: string): Promise<ScreeningResult[]> => {
    const response = await apiClient.get<ScreeningResult[]>(`/screening/history/${childId}`);
    return response.data;
  },

  // Submit screening answers
  submitScreening: async (
    childId: string,
    answers: Record<string, any>
  ): Promise<ScreeningResult> => {
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      childId,
      answers,
    });
    return response.data;
  },
};
