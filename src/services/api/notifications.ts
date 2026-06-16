import apiClient from '../apiClient';
import { localNotificationManager } from './localNotificationManager';

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
  getNotifications: async (currentUserId?: string): Promise<Notification[]> => {
    let allNotifications: Notification[] = [];
    try {
      const response = await apiClient.get<Notification[]>('/notifications');
      allNotifications = response.data || [];
    } catch {
      // Proceed with local notifications if API fails
    }

    if (currentUserId) {
      // Fetch local event-driven notifications
      const localNotifications = localNotificationManager.getLocalNotifications(currentUserId);
      
      // Strict role-based isolation: ONLY return notifications belonging to the current user
      const filteredApi = allNotifications.filter(n => n.userId === currentUserId);
      
      // Merge all notifications
      const combined = [...localNotifications, ...filteredApi];
      
      // Deduplicate by relatedId + type + tight time window (to prevent API and local overlapping)
      const deduplicated: Notification[] = [];
      const seenSignatures = new Set<string>();

      // Sort newest first
      combined.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

      for (const n of combined) {
        // Group them by type, relatedId, and the hour they were created to prevent spam
        const timeGroup = new Date(n.createdAt).getTime() / (1000 * 60 * 5); // 5-minute blocks
        const signature = n.relatedId 
          ? `${n.type}-${n.relatedId}-${Math.floor(timeGroup)}` 
          : `${n.type}-${n.title}-${Math.floor(timeGroup)}`;

        if (!seenSignatures.has(signature)) {
          seenSignatures.add(signature);
          deduplicated.push(n);
        }
      }
      
      return deduplicated;
    }
    return allNotifications;
  },

  markAsRead: async (id: string): Promise<Notification | null> => {
    if (id.startsWith('local-')) {
      localNotificationManager.markAsRead(id);
      return null;
    }
    const response = await apiClient.put<Notification>(`/notifications/${id}/read`, {});
    return response.data;
  },

  markAllAsRead: async (currentUserId?: string): Promise<void> => {
    if (currentUserId) {
      localNotificationManager.markAllAsRead(currentUserId);
    }
    await apiClient.put('/notifications/read-all', {});
  },

  deleteNotification: async (notificationId: string): Promise<void> => {
    if (notificationId.startsWith('local-')) {
      localNotificationManager.deleteNotification(notificationId);
      return;
    }
    await apiClient.delete(`/notifications/${notificationId}`);
  },

  deleteAllNotifications: async (currentUserId?: string): Promise<void> => {
    if (currentUserId) {
      localNotificationManager.deleteAllNotifications(currentUserId);
    }
    await apiClient.delete('/notifications/delete-all');
  },
};
