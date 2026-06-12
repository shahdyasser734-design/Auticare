import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { notificationService } from '../services/notificationService';
import type { Notification } from '../types';
import { useAuth } from './useAuth';

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  newestUnreadMsg: string | null;
  clearNewestMsg: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newestUnreadMsg, setNewestUnreadMsg] = useState<string | null>(null);
  
  const prevUnreadRef = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const data = await notificationService.getNotifications();
      const list = Array.isArray(data) ? data : [];
      setNotifications(list);
      
      const unreadCount = list.filter(n => !n.isRead).length;
      if (unreadCount > prevUnreadRef.current && unreadCount > 0) {
        const newest = list.find(n => !n.isRead);
        if (newest) {
          setNewestUnreadMsg(newest.message || 'You have a new notification!');
        }
      }
      prevUnreadRef.current = unreadCount;
// eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      // suppress warning per user constraint
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
// eslint-disable-next-line react-hooks/set-state-in-effect
      setNotifications([]);
      prevUnreadRef.current = 0;
      return;
    }
    
    void fetchNotifications();
    const interval = setInterval(() => {
      void fetchNotifications();
    }, 10000);
    
    return () => clearInterval(interval);
// eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const markAsRead = async (id: string) => {
    try {
      await notificationService.markAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      prevUnreadRef.current = Math.max(0, prevUnreadRef.current - 1);
    } catch {
      // Suppress
    }
  };

  const markAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      prevUnreadRef.current = 0;
    } catch {
      // Suppress
    }
  };

  const clearNewestMsg = () => setNewestUnreadMsg(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      loading,
      fetchNotifications,
      markAsRead,
      markAllAsRead,
      newestUnreadMsg,
      clearNewestMsg
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
