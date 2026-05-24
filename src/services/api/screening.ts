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
  startScreening: async (_childId: string): Promise<ScreeningStartResponse> => {
    await new Promise(r => setTimeout(r, 500));
    return { sessionId: 'mock-session-' + Date.now() };
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [
      {
        id: '1',
        question: 'Does your child look at you when you call their name?',
        pageNumber: 1,
        options: [
          { id: '1_a', label: 'Always', value: 0 },
          { id: '1_b', label: 'Sometimes', value: 1 },
          { id: '1_c', label: 'Never', value: 2 },
        ]
      },
      {
        id: '2',
        question: 'Does your child point to indicate that they want something?',
        pageNumber: 1,
        options: [
          { id: '2_a', label: 'Always', value: 0 },
          { id: '2_b', label: 'Sometimes', value: 1 },
          { id: '2_c', label: 'Never', value: 2 },
        ]
      }
    ];
  },

  submitScreening: async (_childId: string, _answers: Array<{ questionId: string | number; answerValue: number }>): Promise<ScreeningResult> => {
    await new Promise(r => setTimeout(r, 500));
    return {
      childId: _childId,
      childName: 'Mock Child',
      predictionClass: 'Low Risk',
      confidenceScore: 0.95,
      aqScore: 1,
      riskLevel: 'Low Risk',
      probability: '95%',
      socialAttention: 0,
      jointAttention: 0,
      socialCommunication: 0,
      language: 0,
      imagination: 0,
      repetitiveBehavior: 0,
      createdAt: new Date().toISOString()
    };
  },

  getResults: async (childId: string): Promise<ScreeningResult[]> => {
    await new Promise(r => setTimeout(r, 500));
    return [{
      childId,
      childName: 'Mock Child',
      predictionClass: 'Low Risk',
      confidenceScore: 0.95,
      aqScore: 1,
      riskLevel: 'Low Risk',
      probability: '95%',
      socialAttention: 0,
      jointAttention: 0,
      socialCommunication: 0,
      language: 0,
      imagination: 0,
      repetitiveBehavior: 0,
      createdAt: new Date().toISOString()
    }];
  },

  getAnalytics: async (_childId: string): Promise<ScreeningAnalytics> => {
    await new Promise(r => setTimeout(r, 500));
    return {
      totalScreenings: 1,
      averageScore: 1,
      riskLevelDistribution: { low: 1, medium: 0, high: 0 },
      recentScreenings: []
    };
  },
};
