import type { Notification } from '../../types';

const LOCAL_NOTIFICATIONS_KEY = 'auticare_local_notifications';

const loadLocal = (): Notification[] => {
  try {
    const data = localStorage.getItem(LOCAL_NOTIFICATIONS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
};

const saveLocal = (notifications: Notification[]) => {
  try {
    localStorage.setItem(LOCAL_NOTIFICATIONS_KEY, JSON.stringify(notifications));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('auticare_notifications_updated'));
    }
  } catch {
    // Ignore storage errors
  }
};

export const localNotificationManager = {
  emitNotification: (
    userId: string,
    type: Notification['type'],
    title: string,
    message: string,
    relatedId?: string,
    exactTimestamp?: string
  ): void => {
    if (!userId) return;
    const notifications = loadLocal();
    
    // Deduplication logic: If we have an exact matching title/message/relatedId within the last 5 seconds, drop it.
    // Or if relatedId exists and matches exactly with the same type in the last 1 minute, skip.
    const now = Date.now();
    const isDuplicate = notifications.some(n => {
      if (n.userId !== userId) return false;
      const age = now - new Date(n.createdAt).getTime();
      
      // Exact match guard (same message, title, type within 10 seconds)
      if (n.title === title && n.message === message && age < 10000) return true;
      
      // Source/Action guard (same related source and type within 1 minute, prevents spam)
      if (relatedId && n.relatedId === relatedId && n.type === type && age < 60000) return true;
      
      return false;
    });

    if (isDuplicate) return;

    const newNotification: Notification = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
      createdAt: exactTimestamp || new Date().toISOString()
    };
    notifications.push(newNotification);
    saveLocal(notifications);
  },

  getLocalNotifications: (userId: string): Notification[] => {
    return loadLocal().filter(n => n.userId === String(userId));
  },

  markAsRead: (notificationId: string): void => {
    const notifications = loadLocal();
    const updated = notifications.map(n => 
      n.id === notificationId ? { ...n, isRead: true } : n
    );
    saveLocal(updated);
  },

  markAllAsRead: (userId: string): void => {
    const notifications = loadLocal();
    const updated = notifications.map(n => 
      n.userId === String(userId) ? { ...n, isRead: true } : n
    );
    saveLocal(updated);
  },

  deleteNotification: (notificationId: string): void => {
    const notifications = loadLocal();
    const updated = notifications.filter(n => n.id !== notificationId);
    saveLocal(updated);
  },

  deleteAllNotifications: (userId: string): void => {
    const notifications = loadLocal();
    const updated = notifications.filter(n => n.userId !== String(userId));
    saveLocal(updated);
  },

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  seedInitialRoleNotifications: (_userId: string, _role: string): void => {
    // Disabled: Notifications must use real database names, not mock/static values.
  }
};
