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
    relatedId?: string
  ): void => {
    if (!userId) return;
    const notifications = loadLocal();
    const newNotification: Notification = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      userId,
      type,
      title,
      message,
      relatedId,
      isRead: false,
      createdAt: new Date().toISOString()
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

  seedInitialRoleNotifications: (userId: string, role: string): void => {
    const seedKey = `seeded_notifications_${userId}`;
    if (localStorage.getItem(seedKey)) return; // Already seeded

    const now = new Date().getTime();
    const generateId = () => `mock-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const generateTime = (minsAgo: number) => new Date(now - minsAgo * 60000).toISOString();

    let initialMocks: Notification[] = [];

    if (role === 'parent') {
      initialMocks = [
        { id: generateId(), userId, type: 'session', title: 'Session Approved', message: 'Your upcoming session request with Dr. Smith has been approved.', isRead: false, createdAt: generateTime(5) },
        { id: generateId(), userId, type: 'booking', title: 'Session Booked', message: 'You have successfully booked a new session for tomorrow.', isRead: true, createdAt: generateTime(120) },
        { id: generateId(), userId, type: 'treatment-plan', title: 'Treatment Plan Updated', message: 'A new treatment plan has been published for your child.', isRead: false, createdAt: generateTime(1440) },
        { id: generateId(), userId, type: 'notes', title: 'New Clinical Note', message: 'Your therapist added a new observation note.', isRead: true, createdAt: generateTime(2880) }
      ];
    } else if (role === 'doctor') {
      initialMocks = [
        { id: generateId(), userId, type: 'booking', title: 'New Booking Request', message: 'New clinical session request for patient Alex. Please review clinical availability.', isRead: false, createdAt: generateTime(10) },
        { id: generateId(), userId, type: 'screening', title: 'Screening Submitted', message: 'Patient Sarah has submitted a new autism screening assessment.', isRead: false, createdAt: generateTime(60) },
        { id: generateId(), userId, type: 'treatment-plan', title: 'Treatment Plan Viewed', message: 'Parent has viewed the recently published treatment plan.', isRead: true, createdAt: generateTime(500) },
        { id: generateId(), userId, type: 'session', title: 'Session Cancelled', message: 'Clinical session with patient John has been cancelled. Update patient records.', isRead: true, createdAt: generateTime(1200) }
      ];
    } else if (role === 'therapist') {
      initialMocks = [
        { id: generateId(), userId, type: 'session', title: 'New Assigned Session', message: 'You have been assigned to a new therapy session for Emma.', isRead: false, createdAt: generateTime(15) },
        { id: generateId(), userId, type: 'treatment-plan', title: 'Treatment Plan Updated', message: 'The primary doctor updated the treatment plan goals for Emma.', isRead: true, createdAt: generateTime(300) },
        { id: generateId(), userId, type: 'message', title: 'New Message', message: 'Emma\'s parent sent you a new direct message regarding homework.', isRead: false, createdAt: generateTime(450) },
        { id: generateId(), userId, type: 'session', title: 'Session Completed', message: 'Therapy session with Emma complete. Log session progress.', isRead: true, createdAt: generateTime(1440) }
      ];
    }

    if (initialMocks.length > 0) {
      const current = loadLocal();
      saveLocal([...current, ...initialMocks]);
      localStorage.setItem(seedKey, 'true');
    }
  }
};
