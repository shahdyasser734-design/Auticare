import apiClient from './apiClient';
import type { ScreeningQuestion, ScreeningResult } from '../types';

export interface ScreeningAnalytics {
  totalScreenings: number;
  averageScore: number;
  riskLevelDistribution: {
    low: number;
    medium: number;
    high: number;
  };
  recentScreenings: ScreeningResult[];
}

// Legacy wrapper — prefer importing from services/api/screening directly
export const testService = {
  startScreening: async (childId?: string): Promise<{ sessionId: string }> => {
    const response = await apiClient.post<{ sessionId: string }>('/screening/start', {
      childId: childId ?? '',
    });
    return response.data;
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    const response = await apiClient.get<ScreeningQuestion[]>('/screening/questions');
    return response.data;
  },

  submitAnswers: async (sessionId: string, answers: Record<string, string>): Promise<ScreeningResult> => {
    // Convert flat answers record to array format expected by backend
    const answersArray = Object.entries(answers).map(([questionId, optionId]) => ({
      questionId,
      optionId,
      value: 0,
    }));
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      sessionId,
      answers: answersArray,
    });
    return response.data;
  },

  getResults: async (childId?: string): Promise<ScreeningResult> => {
    const url = childId ? `/screening/results/${childId}` : '/screening/results';
    const response = await apiClient.get<ScreeningResult | ScreeningResult[]>(url);
    const data = response.data;
    // Backend returns array for childId, take first result
    if (Array.isArray(data)) {
      if (data.length === 0) throw new Error('No results found');
      return data[0];
    }
    return data;
  },

  getAnalytics: async (childId?: string): Promise<ScreeningAnalytics> => {
    const url = childId ? `/screening/analytics/${childId}` : '/screening/analytics';
    const response = await apiClient.get<ScreeningAnalytics>(url);
    return response.data;
  },
};

// Also export as screeningService alias
export const screeningService = testService;
