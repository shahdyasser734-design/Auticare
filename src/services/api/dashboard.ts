import apiClient from '../apiClient';

export interface ScreeningDetail {
  id: string;
  date: string;
  riskLevel: 'low' | 'medium' | 'high';
  score?: number;
  aqScore?: number;
  predictionClass?: string;
}

export interface TreatmentPlanDetail {
  id: string;
  title: string;
  status: 'active' | 'completed' | 'on-hold';
  startDate?: string;
  endDate?: string;
  goalsCompleted?: number;
  totalGoals?: number;
  progressPercentage?: number;
}

export interface UpcomingSession {
  id: string;
  date: string;
  time: string;
  type: 'doctor' | 'therapist';
  status: 'scheduled' | 'pending' | 'confirmed';
}

export interface PatientCard {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  profileImage?: string;
  status: 'active' | 'in-treatment' | 'pending';
  lastScreening?: ScreeningDetail;
  treatmentPlan?: TreatmentPlanDetail;
  upcomingSession?: UpcomingSession;
  lastActivityDate?: string;
  lastActivityType?: 'session' | 'screening' | 'note' | 'session-completed';
  parentName?: string;
  parentPhone?: string;
  assignedDoctor?: string;
}

export interface DashboardParentData {
  childrenCount: number;
  upcomingScreenings: number;
  upcomingSessions: number;
  recentScreeningResults: Array<Record<string, unknown>>;
  sessions: Array<Record<string, unknown>>;
}

export interface AssignedChild {
  id: string;
  name: string;
  age?: number;
  gender?: string;
  status: 'active' | 'in-treatment' | 'pending';
  assignedDoctor?: string;
}

export interface DashboardSpecialistData {
  patientCount?: number;
  activeCases?: number;
  upcomingSessions?: number;
  todaySessions?: number;
  totalSessions?: number;
  activePatients?: number;
  pendingPlans?: number;
  completedSessions?: number;
  pendingRequests?: number;
  unreadMessages?: number;
  recentNotes?: Array<Record<string, unknown>>;
  sessions?: Array<Record<string, unknown>>;
  assignedChildren?: AssignedChild[];
  patients?: PatientCard[];
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  patientCards?: any[];
}

const mockSpecialistDashboard: DashboardSpecialistData = {
  activeCases: 0,
  todaySessions: 0,
  upcomingSessions: 0,
  completedSessions: 0,
  pendingPlans: 0,
  pendingRequests: 0,
  unreadMessages: 0,
  assignedChildren: [],
  patients: [],
};

export const dashboardService = {
  getParentDashboard: async (): Promise<DashboardParentData> => {
    const response = await apiClient.get<DashboardParentData>('/dashboard/parent');
    return response.data;
  },

  getSpecialistDashboard: async (): Promise<DashboardSpecialistData> => {
    try {
      const response = await apiClient.get<DashboardSpecialistData>('/dashboard/specialist');
      return response.data;
    } catch {
      return mockSpecialistDashboard;
    }
  },
};
