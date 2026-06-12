import apiClient from './apiClient';
import type { Notification } from '../types';

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: 'mock-1', userId: '', title: 'Session Approved', message: 'Your upcoming session has been approved.', type: 'session', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: 'mock-2', userId: '', title: 'Treatment Plan Published', message: 'A new treatment plan has been published for your child.', type: 'system', isRead: false, createdAt: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
  { id: 'mock-3', userId: '', title: 'New Message', message: 'You have received a new message from your therapist.', type: 'message', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString() },
  { id: 'mock-4', userId: '', title: 'Session Completed', message: 'Your session has been marked as completed.', type: 'session', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString() },
  { id: 'mock-5', userId: '', title: 'New Note Added', message: 'A new clinical note has been added to the profile.', type: 'system', isRead: true, createdAt: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString() },
];

export const notificationService = {
  getNotifications: async (): Promise<Notification[]> => {
    let apiNotifications: Notification[] = [];
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      apiNotifications = response.data ?? [];
    } catch (error) {
      console.warn('Notification API unavailable. Using fallback.', error);
    }
    
    // Merge real and mock notifications, real overriding mock by ID (if they happened to share an ID, but here mock IDs are prefixed)
    // Actually, user wants mock notifications to show if API returns empty.
    // If API returns some, we still merge? "Merge mock + real notifications without duplicates. Real notifications should always override mock."
    const mergedMap = new Map<string, Notification>();
    
    // Add mocks first
    if (apiNotifications.length === 0) {
      MOCK_NOTIFICATIONS.forEach(n => mergedMap.set(n.id, n));
    } else {
      MOCK_NOTIFICATIONS.forEach(n => mergedMap.set(n.id, n));
      apiNotifications.forEach(n => mergedMap.set(n.id, n));
    }

    return Array.from(mergedMap.values()).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
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
