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
  QuestionId: string | number;
  Answer: number;
  OptionId?: string;
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
      ChildId: Number(childId),
      Answers: answers,
    });
    return response.data;
  },

  // New helper: submit answers using a sessionId and typed answer objects
  submitAnswers: async (sessionId: string, answers: BackendScreeningAnswer[]): Promise<ScreeningResult> => {
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      SessionId: sessionId,
      Answers: answers,
    });
    return response.data;
  },

  getResults: async (childId: string): Promise<ScreeningResult[]> => {
    const response = await apiClient.get<ScreeningResult | ScreeningResult[]>(`/screening/results/${childId}`);
    const data = response.data;
    return Array.isArray(data) ? data : [data];
  },

  getAnalytics: async (childId: string): Promise<Record<string, unknown>> => {
    const response = await apiClient.get<Record<string, unknown>>(`/screening/analytics/${childId}`);
    return response.data;
  },
};
