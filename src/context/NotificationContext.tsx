import { createContext, useContext, useState, useEffect, useRef } from 'react';
import type { ReactNode } from 'react';
import { notificationService } from '../services/api/notifications';
import { localNotificationManager } from '../services/api/localNotificationManager';
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
  chatUnreadCount: number;
  clearChatUnread: (countToClear: number) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

import { chatServiceAPI } from '../services/api/chatService';

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [newestUnreadMsg, setNewestUnreadMsg] = useState<string | null>(null);
  const [chatUnreadCount, setChatUnreadCount] = useState(() => Number(localStorage.getItem('chatUnreadCount') || '0'));
  
  const clearChatUnread = (countToClear: number) => {
    setChatUnreadCount(prev => {
      const newCount = Math.max(0, prev - countToClear);
      localStorage.setItem('chatUnreadCount', String(newCount));
      return newCount;
    });
  };

  const prevUnreadRef = useRef<number>(0);

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      // Seed mock notifications if none exist so the page isn't empty
      localNotificationManager.seedInitialRoleNotifications(user.id, user.role);

      const data = await notificationService.getNotifications(user.id);
      const rawList = Array.isArray(data) ? data : [];
      let list = rawList;

      if (user.role === 'doctor') {
        list = rawList.filter(n => ['treatment-plan', 'message', 'notes', 'system', 'session'].includes(n.type));
      } else if (user.role === 'therapist') {
        list = rawList.filter(n => ['session', 'message', 'notes', 'system'].includes(n.type));
      } else if (user.role === 'parent') {
        list = rawList.filter(n => ['booking', 'treatment-plan', 'message', 'notes', 'system', 'screening', 'session', 'reminder'].includes(n.type));
      }

      setNotifications(list);
      
      const unreadCount = list.filter(n => !n.isRead).length;
      if (unreadCount > 0) {
        const newest = list.find(n => !n.isRead);
        if (newest && newest.id) {
          const seenStr = localStorage.getItem('auticare_seenAlertIds') || '[]';
          let seenAlertIds: string[] = [];
          try { seenAlertIds = JSON.parse(seenStr); } catch { /* ignore */ }
          
          if (!seenAlertIds.includes(newest.id)) {
            setNewestUnreadMsg(newest.message || newest.title || 'You have a new notification!');
            seenAlertIds.push(newest.id);
            // Keep array small
            if (seenAlertIds.length > 50) seenAlertIds.shift();
            localStorage.setItem('auticare_seenAlertIds', JSON.stringify(seenAlertIds));
          }
        }
      }
      prevUnreadRef.current = unreadCount;

      try {
        const chats = await chatServiceAPI.getMyChats();
        const cUnread = chats.reduce((acc, c) => acc + (c.unreadCount || 0), 0);
        
        setChatUnreadCount(prev => {
          if (cUnread > prev) {
            // Find which chats have new messages
            const unreadChats = chats.filter(c => c.unreadCount > 0);
            unreadChats.forEach(chat => {
              if (chat.lastMessage && String(chat.lastMessage.senderId) !== String(user.id)) {
                let msgText = 'Sent a new message';
                if (chat.lastMessage.messageType === 'image') msgText = 'Sent an image';
                else if (chat.lastMessage.messageType === 'file') msgText = 'Sent a file';
                else if (chat.lastMessage.messageType === 'voice') msgText = 'Sent a voice message';
                else if (chat.lastMessage.replyToMessageId) msgText = 'Replied to your message';
                else if (chat.lastMessage.content) msgText = chat.lastMessage.content;
                
                localNotificationManager.emitNotification(
                  user.id,
                  'message',
                  `New Message from ${chat.lastMessage.senderName || 'Chat'}`,
                  msgText,
                  `chat-${chat.id}`
                );
              }
            });
          }
          localStorage.setItem('chatUnreadCount', String(cUnread));
          return cUnread;
        });
      } catch {
        // ignore chat fetch errors
      }
    } catch {
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
    
    const instantUpdateHandler = () => {
      void fetchNotifications();
    };
    window.addEventListener('auticare_notifications_updated', instantUpdateHandler);
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('auticare_notifications_updated', instantUpdateHandler);
    };
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
      if (user) {
        await notificationService.markAllAsRead(user.id);
      } else {
        await notificationService.markAllAsRead();
      }
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
      clearNewestMsg,
      chatUnreadCount,
      clearChatUnread
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
