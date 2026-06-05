import apiClient from '../apiClient';
import type { Dashboard } from '../../types';

export const dashboardService = {
  // Get parent dashboard
  getParentDashboard: async (): Promise<Dashboard> => {
    const response = await apiClient.get<Dashboard>('/dashboard/parent');
    return response.data;
  },

  // Get specialist dashboard
  getSpecialistDashboard: async (): Promise<Dashboard> => {
    const response = await apiClient.get<Dashboard>('/dashboard/specialist');
    return response.data;
  },
};
