import apiClient from '../apiClient';
import type {
  ScreeningQuestion,
  ScreeningResult,
} from '../../types';

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

export interface ScreeningStartResponse {
  sessionId: string;
  questions?: ScreeningQuestion[];
}

export interface BackendScreeningAnswer {
  questionId: number;
  answerValue: number;
}


export const screeningService = {
  startScreening: async (childId: string): Promise<ScreeningStartResponse> => {
    const response = await apiClient.post<ScreeningStartResponse>('/screening/start', {
      childId,
    });
    return response.data;
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    const response = await apiClient.get<ScreeningQuestion[]>('/screening/questions');
    return response.data;
  },

  submitScreening: async (childId: string, answers: BackendScreeningAnswer[] ): Promise<ScreeningResult> => {
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      childId: Number(childId),
      answers: answers,
    });
    return response.data;
  },

  // New helper: submit answers using a sessionId and typed answer objects
  submitAnswers: async (_sessionId: string, answers: BackendScreeningAnswer[], childId?: string): Promise<ScreeningResult> => {
    const activeChildId = childId || localStorage.getItem('latestChildId') || '0';
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      childId: Number(activeChildId),
      answers: answers,
    });
    return response.data;
  },

  getResults: async (childId: string): Promise<ScreeningResult[]> => {
    try {
      // Primary: as requested by the user, using query param
      const response = await apiClient.get<ScreeningResult | ScreeningResult[]>('/screening-results', { params: { childId } });
      const data = response.data;
      return Array.isArray(data) ? data : [data];
    } catch (err) {
      // Fallback to older route format just in case
      console.warn('Fallback to legacy screening results route:', err);
      const response = await apiClient.get<ScreeningResult | ScreeningResult[]>(`/screening/results/${childId}`);
      const data = response.data;
      return Array.isArray(data) ? data : [data];
    }
  },

  getAnalytics: async (childId: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(`/screening/analytics/${childId}`);
    return response.data;
  },
};
