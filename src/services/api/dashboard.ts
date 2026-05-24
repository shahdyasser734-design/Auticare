import apiClient from '../apiClient';

export interface DashboardParentData {
  childrenCount: number;
  upcomingScreenings: number;
  upcomingSessions: number;
  recentScreeningResults: Array<Record<string, unknown>>;
  sessions: Array<Record<string, unknown>>;
}

export interface DashboardSpecialistData {
  patientCount?: number;
  upcomingSessions?: number;
  totalSessions?: number;
  activePatients?: number;
  recentNotes?: Array<Record<string, unknown>>;
  sessions?: Array<Record<string, unknown>>;
}

export const dashboardService = {
  getParentDashboard: async (): Promise<DashboardParentData> => {
    const response = await apiClient.get<DashboardParentData>('/dashboard/parent');
    return response.data;
  },

  getSpecialistDashboard: async (): Promise<DashboardSpecialistData> => {
    const response = await apiClient.get<DashboardSpecialistData>('/dashboard/specialist');
    return response.data;
  },
};
