import apiClient from '../apiClient';

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
    const response = await apiClient.get<Notification[]>('/notifications');
    return response.data;
  },

  markAsRead: async (id: string): Promise<Notification> => {
    const response = await apiClient.put<Notification>(`/notifications/${id}/read`, {});
    return response.data;
  },

  markAllAsRead: async (): Promise<void> => {
    await apiClient.put('/notifications/read-all', {});
  },
};
