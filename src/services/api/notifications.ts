import apiClient from '../apiClient';
import { mockState } from './mockState';

export interface Notification {
  id: string;
  userId: string;
  type: 'session' | 'booking' | 'screening' | 'message' | 'system' | 'treatment-plan' | 'reminder' | 'notes';
  title: string;
  message: string;
  content?: string;
  isRead: boolean;
  createdAt: string;
  link?: string;
  relatedId?: string;
}

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      const data = response.data || [];
      if (data.length === 0) {
        return mockState.getNotifications();
      }
      return data;
    } catch {
      return mockState.getNotifications();
    }
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.put<Notification>(`/notifications/${id}/read`, {});
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all', {});
  },
};
