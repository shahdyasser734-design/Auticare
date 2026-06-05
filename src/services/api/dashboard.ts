import apiClient from '../apiClient';

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
  assignedTherapist?: string;
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
  recentNotes?: Array<Record<string, unknown>>;
  sessions?: Array<Record<string, unknown>>;
  assignedChildren?: AssignedChild[];
}

const mockSpecialistDashboard: DashboardSpecialistData = {
  activeCases: 0,
  todaySessions: 0,
  upcomingSessions: 0,
  completedSessions: 0,
  pendingPlans: 0,
  assignedChildren: [],
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
