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

const normalizeQuestion = (raw: Record<string, unknown>, index: number): ScreeningQuestion => {
  const questionId = raw.questionId ?? raw.id ?? raw.id ?? index + 1;
  const text = String(raw.questionText ?? raw.question ?? raw.prompt ?? '').trim();

  return {
    id: String(questionId),
    question: text || `Question ${index + 1}`,
    description: String(raw.description ?? ''),
    pageNumber: index + 1,
    options: [
      { id: `q${questionId}_yes`, label: 'Yes', value: 1 },
      { id: `q${questionId}_no`, label: 'No', value: 0 },
    ],
  };
};

const normalizeAnalytics = (raw: Record<string, unknown>): ScreeningAnalytics => {
  const totalScreenings = Number(raw.totalScreenings ?? raw.totalTests ?? raw.total ?? 0);
  const riskDistribution = raw.riskLevelDistribution as Record<string, unknown> | undefined;
  const high = Number(riskDistribution?.high ?? raw.highRiskCount ?? raw.highRisk ?? 0);
  const low = Number(riskDistribution?.low ?? raw.lowRiskCount ?? raw.lowRisk ?? 0);
  const medium = Number(riskDistribution?.medium ?? raw.mediumRiskCount ?? raw.mediumRisk ?? Math.max(0, totalScreenings - high - low));

  return {
    totalScreenings,
    averageScore: Number(raw.averageScore ?? raw.avgScore ?? raw.average ?? 0),
    riskLevelDistribution: {
      low,
      medium,
      high,
    },
    recentScreenings: Array.isArray(raw.recentScreenings) ? (raw.recentScreenings as ScreeningResult[]) : [],
  };
};

export const screeningService = {
  startScreening: async (childId: string): Promise<ScreeningStartResponse> => {
    const response = await apiClient.post<ScreeningStartResponse>('/screening/start', {
      childId,
    });
    return response.data;
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    const response = await apiClient.get<unknown[]>('/screening/questions');
    const rawQuestions = Array.isArray(response.data) ? response.data : [];
    return rawQuestions.map((item, index) => normalizeQuestion(item as Record<string, unknown>, index));
  },

  submitScreening: async (childId: string, answers: Record<string, number>): Promise<ScreeningResult> => {
    const response = await apiClient.post<ScreeningResult>('/screening/submit', {
      ChildId: Number(childId),
      Answers: Object.entries(answers).map(([questionId, value]) => ({
        QuestionId: Number(questionId),
        Answer: value,
      })),
    });
    return response.data;
  },

  getResults: async (childId: string): Promise<ScreeningResult[]> => {
    const response = await apiClient.get<ScreeningResult | ScreeningResult[]>(`/screening/results/${childId}`);
    const data = response.data;
    return Array.isArray(data) ? data : [data];
  },

  getAnalytics: async (childId: string): Promise<ScreeningAnalytics> => {
    const response = await apiClient.get<Record<string, unknown>>(`/screening/analytics/${childId}`);
    return normalizeAnalytics(response.data as Record<string, unknown>);
  },
};
