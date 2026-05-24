import type { ScreeningQuestion, ScreeningResult } from '../types';
import type { ScreeningAnalytics } from './testService';

const mockQuestions: ScreeningQuestion[] = [
  {
    id: 'q1',
    question: 'Does your child look at you when you call his/her name?',
    pageNumber: 1,
    options: [
      { id: 'q1_yes', label: 'Yes', value: 1 },
      { id: 'q1_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q2',
    question: 'How easy is it for you to get eye contact with your child?',
    pageNumber: 1,
    options: [
      { id: 'q2_easy', label: 'Easy', value: 1 },
      { id: 'q2_difficult', label: 'Difficult', value: 0 }
    ]
  },
  {
    id: 'q3',
    question: 'Does your child point to indicate that s/he wants something? (e.g. a toy that is out of reach)',
    pageNumber: 2,
    options: [
      { id: 'q3_yes', label: 'Yes', value: 1 },
      { id: 'q3_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q4',
    question: 'Does your child point to share interest with you? (e.g. pointing at an interesting sight)',
    pageNumber: 2,
    options: [
      { id: 'q4_yes', label: 'Yes', value: 1 },
      { id: 'q4_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q5',
    question: 'Does your child pretend? (e.g. care for dolls, talk on a toy phone)',
    pageNumber: 2,
    options: [
      { id: 'q5_yes', label: 'Yes', value: 1 },
      { id: 'q5_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q6',
    question: 'Does your child follow where you are looking?',
    pageNumber: 3,
    options: [
      { id: 'q6_yes', label: 'Yes', value: 1 },
      { id: 'q6_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q7',
    question: 'If you or someone else in the family is visibly upset, does your child show signs of wanting to comfort them? (e.g. stroking hair, hugging them)',
    pageNumber: 3,
    options: [
      { id: 'q7_yes', label: 'Yes', value: 1 },
      { id: 'q7_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q8',
    question: 'Would you describe your child\'s first words as:',
    pageNumber: 3,
    options: [
      { id: 'q8_simple', label: 'YES (simple words like mama, bye)', value: 1 },
      { id: 'q8_complex', label: 'NO (more complex words or phrases)', value: 0 }
    ]
  },
  {
    id: 'q9',
    question: 'Does your child use simple gestures? (e.g. wave goodbye)',
    pageNumber: 4,
    options: [
      { id: 'q9_yes', label: 'Yes', value: 1 },
      { id: 'q9_no', label: 'No', value: 0 }
    ]
  },
  {
    id: 'q10',
    question: 'Does your child stare at nothing with no apparent purpose?',
    pageNumber: 4,
    options: [
      { id: 'q10_yes', label: 'Yes', value: 1 },
      { id: 'q10_no', label: 'No', value: 0 }
    ]
  }
];

export const mockTestService = {
  startScreening: async (childId?: string): Promise<{ sessionId: string }> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return { sessionId: `mock-session-${childId ?? 'anon'}-${Date.now()}` };
  },

  getQuestions: async (): Promise<ScreeningQuestion[]> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return mockQuestions;
  },

  submitAnswers: async (sessionId: string, answers: Record<string, string>): Promise<ScreeningResult> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    void sessionId;
    const score = Object.values(answers).length;
    return {
      childName: 'Mock Child',
      predictionClass: 'Low Risk',
      confidenceScore: 0.95,
      aqScore: score,
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

  getResults: async (childId?: string): Promise<ScreeningResult> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    void childId;
    return {
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

  getAnalytics: async (childId?: string): Promise<ScreeningAnalytics> => {
    await new Promise((resolve) => setTimeout(resolve, 500));
    return {
      totalScreenings: childId ? 1 : 0,
      averageScore: 1,
      riskLevelDistribution: { low: 1, medium: 0, high: 0 },
      recentScreenings: []
    };
  },
};
