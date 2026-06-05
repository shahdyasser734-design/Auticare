import apiClient from './apiClient';
import type { Notification } from '../types';
import { mockState } from './api/mockState';

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      const data = response.data ?? [];
      return data.length > 0 ? data : mockState.getNotifications();
    } catch (error) {
      console.warn('Notification API unavailable, using mock notifications.', error);
      return mockState.getNotifications();
    }
  },

  markAsRead: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.put(`/notifications/${notificationId}/read`, {});
    } catch {
      mockState.markNotificationRead(notificationId);
    }
  },

  markAllAsRead: async (): Promise<void> => {
    try {
      await apiClient.put('/notifications/read-all', {});
    } catch {
      mockState.getNotifications().forEach((notification) => {
        if (!notification.isRead) mockState.markNotificationRead(notification.id);
      });
    }
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    try {
      await apiClient.delete(`/notifications/${notificationId}`);
    } catch {
      // No-op in mock mode
    }
  },

  deleteAllNotifications: async (): Promise<void> => {
    try {
      await apiClient.delete('/notifications/delete-all');
    } catch {
      // No-op in mock mode
    }
  },
};
