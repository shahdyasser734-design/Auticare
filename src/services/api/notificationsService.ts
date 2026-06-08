import apiClient from '../apiClient';
import type { Notification } from '../../types';

export const notificationsService = {
  getNotifications: async (limit?: number): Promise<Notification[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<Notification[]>('/notifications', { params });
      return response.data ?? [];
    } catch (error) {
      console.warn('Notification API unavailable.', error);
      return [];
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return response.data.count;
    } catch {
      return 0;
    }
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`, {});
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all', {});
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  deleteAllRead: async (): Promise<void> => {
    await apiClient.delete('/notifications/delete-all-read');
  },
};
