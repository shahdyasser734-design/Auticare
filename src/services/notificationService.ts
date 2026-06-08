import apiClient from './apiClient';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      return response.data ?? [];
    } catch (error) {
      console.warn('Notification API unavailable.', error);
      return [];
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    await apiClient.put(`/notifications/${notificationId}/read`, {});
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all', {});
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  deleteAllNotifications: async (): Promise<void> => {
    await apiClient.delete('/notifications/delete-all');
  },
};
