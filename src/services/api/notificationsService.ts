import apiClient from '../apiClient';
import type { Notification } from '../../types';
import { mockState } from './mockState';

export const notificationsService = {
  getNotifications: async (limit?: number): Promise<Notification[]> => {
    try {
      const params = limit ? { limit } : {};
      const response = await apiClient.get<Notification[]>('/notifications', { params });
      const data = response.data ?? [];
      if (data.length === 0) {
        return mockState.getNotifications();
      }
      return data;
    } catch (error) {
      console.warn('Notification API unavailable, using mock notifications.', error);
      return mockState.getNotifications();
    }
  },

  getUnreadCount: async (): Promise<number> => {
    try {
      const response = await apiClient.get<{ count: number }>('/notifications/unread-count');
      return response.data.count;
    } catch {
      return mockState.getNotifications().filter((notification) => !notification.isRead).length;
    }
  },

  markAsRead: async (notificationId: string): Promise<Notification> => {
    try {
      const response = await apiClient.put<Notification>(`/notifications/${notificationId}/read`, {});
      return response.data;
    } catch {
      const notifications = mockState.markNotificationRead(notificationId);
      return notifications.find((item) => item.id === notificationId)!;
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
      // Do not block if mock mode is in use
    }
  },

  deleteAllRead: async (): Promise<void> => {
    try {
      await apiClient.delete('/notifications/delete-all-read');
    } catch {
      mockState.deleteReadNotifications();
    }
  },
};
