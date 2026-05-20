import apiClient from './apiClient';
import type { Notification } from '../types';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
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
