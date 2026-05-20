import apiClient from '../apiClient';

// Screening API Types
export interface ScreeningQuestion {
  id: string;
  question: string;
  description?: string;
  pageNumber: number;
  options: ScreeningOption[];
}

export interface ScreeningOption {
  id: string;
  label: string;
  value: number;
}

export interface ScreeningAnswer {
  questionId: string;
  optionId: string;
  value: number;
}

export interface ScreeningStartRequest {
  childId: string;
}

export interface ScreeningStartResponse {
  sessionId: string;
  questions?: ScreeningQuestion[];
}

export interface ScreeningSubmitRequest {
  sessionId: string;
  answers: ScreeningAnswer[];
}

export interface ScreeningResult {
  sessionId?: string;
  childId?: string;
  childName: string;
  predictionClass: string;
  confidenceScore: number;
  aqScore: number;
  riskLevel: string;
  probability: string;
  socialAttention: number;
  jointAttention: number;
  socialCommunication: number;
  language: number;
  imagination: number;
  repetitiveBehavior: number;
  createdAt: string;
}

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

export const screeningService = {
  startScreening: async (childId: string): Promise<ScreeningStartResponse> => {
    const response = await apiClient.post<ScreeningStartResponse>('/screening/start', { childId });
    return response.data;
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    const response = await apiClient.get<ScreeningQuestion[]>('/screening/questions');
    return response.data;
  },

  // Submit screening for a child. Backend expects { childId, answers: [{ questionId, answerValue }] }
  submitScreening: async (childId: string, answers: Array<{ questionId: string | number; answerValue: number }>): Promise<ScreeningResult> => {
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      childId,
      answers,
    });
    return response.data;
  },

  getResults: async (childId: string): Promise<ScreeningResult[]> => {
    const response = await apiClient.get<ScreeningResult[]>(`/screening/results/${childId}`);
    return response.data;
  },

  getAnalytics: async (childId: string): Promise<ScreeningAnalytics> => {
    const response = await apiClient.get<ScreeningAnalytics>(`/screening/analytics/${childId}`);
    return response.data;
  },
};
