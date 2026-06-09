import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { notificationsService } from '../../services/api/notificationsService';
import type { Notification } from '../../types';
import { Bell, CheckCheck, Check, RefreshCw } from 'lucide-react';

// ─── Mock notifications (shown ONLY when backend returns empty) ───────────────
const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: 'demo-1',
    userId: 'demo',
    type: 'session',
    title: '🗓 Session Approved',
    message: 'Your consultation request has been approved. Please check your booking for the meeting details.',
    isRead: false,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    userId: 'demo',
    type: 'message',
    title: '💬 New Message',
    message: 'Your specialist has sent you a message. Open the chat to view it.',
    isRead: false,
    createdAt: new Date(Date.now() - 3_600_000).toISOString(),
  },
  {
    id: 'demo-3',
    userId: 'demo',
    type: 'booking',
    title: '📋 Booking Reminder',
    message: 'You have an upcoming appointment scheduled. Make sure to prepare your child\'s information.',
    isRead: true,
    createdAt: new Date(Date.now() - 86_400_000).toISOString(),
  },
];

const TYPE_ICON: Record<string, string> = {
  session: '🗓',
  booking: '📋',
  message: '💬',
  'treatment-plan': '📄',
  screening: '🔬',
  reminder: '⏰',
  system: '🔔',
  notes: '📝',
};

const formatDate = (d: string) => {
  try {
    return new Date(d).toLocaleString('en-US', {
      month: 'short', day: 'numeric', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return d; }
};

type FilterOption = 'all' | 'unread' | 'read';

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [usingMock, setUsingMock]         = useState(false);
  const [filter, setFilter]               = useState<FilterOption>('all');
  const [loading, setLoading]             = useState(false);
  const [markingAll, setMarkingAll]       = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsService.getNotifications();
      const list = Array.isArray(data) ? data : [];
      if (list.length === 0) {
        // Backend returned empty — show mock data for UI preview
        setNotifications(MOCK_NOTIFICATIONS);
        setUsingMock(true);
      } else {
        setNotifications(list);
        setUsingMock(false);
      }
    } catch {
      setError('Could not load notifications. Showing preview data instead.');
      setNotifications(MOCK_NOTIFICATIONS);
      setUsingMock(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void fetchNotifications(); }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'read')   return n.isRead;
    if (filter === 'unread') return !n.isRead;
    return true;
  });

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));

    if (usingMock) return; // Don't call API for mock data

    try {
      await notificationsService.markAsRead(id);
    } catch {
      // Revert on failure
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: false } : n));
      setError('Failed to mark notification as read.');
    }
  };

  const handleMarkAllAsRead = async () => {
    setMarkingAll(true);
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));

    if (usingMock) { setMarkingAll(false); return; }

    try {
      await notificationsService.markAllAsRead();
      setSuccess('All notifications marked as read.');
      setTimeout(() => setSuccess(null), 3000);
    } catch {
      setError('Failed to mark all as read. Please try again.');
      void fetchNotifications(); // Revert
    } finally {
      setMarkingAll(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">Notifications</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`
                : 'All caught up!'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => void fetchNotifications()}
              disabled={loading}
              className="p-2 rounded-xl border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={16} className={`text-slate-500 ${loading ? 'animate-spin' : ''}`} />
            </button>
            {unreadCount > 0 && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => void handleMarkAllAsRead()}
                disabled={markingAll}
                className="rounded-xl font-bold flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCheck size={14} />
                {markingAll ? 'Marking…' : 'Mark All Read'}
              </Button>
            )}
          </div>
        </div>

        {/* Mock notice */}
        {usingMock && (
          <div className="rounded-2xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/40 p-4 text-amber-800 dark:text-amber-300 text-sm font-medium flex items-center gap-2">
            <Bell size={15} />
            Showing demo notifications — no real notifications found yet.
          </div>
        )}

        {/* Error / Success */}
        {error && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-4 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-4 text-rose-400 hover:text-rose-600">✕</button>
          </div>
        )}
        {success && (
          <div className="rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800/40 p-4 text-emerald-700 dark:text-emerald-300 text-sm font-medium">
            {success}
          </div>
        )}

        {/* Filter Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
          {(['all', 'unread', 'read'] as FilterOption[]).map(tab => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-colors capitalize ${
                filter === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab}
              {tab === 'unread' && unreadCount > 0 && (
                <span className="ml-1.5 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-indigo-600 text-white text-[9px] font-black px-1">
                  {unreadCount}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Loading skeleton */}
        {loading && notifications.length === 0 ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="animate-pulse rounded-2xl bg-slate-100 dark:bg-slate-800 h-20" />
            ))}
          </div>
        ) : filteredNotifications.length === 0 ? (
          <Card className="text-center py-16">
            <Bell size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-black text-lg text-slate-700 dark:text-slate-300">
              {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {filter === 'all' ? 'You\'re all caught up!' : 'Try switching to "All" to see everything.'}
            </p>
          </Card>
        ) : (
          <div className="space-y-3">
            {filteredNotifications.map(notification => (
              <div
                key={notification.id}
                className={`rounded-2xl border p-4 transition-all ${
                  notification.isRead
                    ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-white/8'
                    : 'bg-indigo-50/50 dark:bg-indigo-950/20 border-indigo-200 dark:border-indigo-800/30'
                }`}
              >
                <div className="flex items-start gap-4">
                  {/* Icon */}
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0 ${
                    notification.isRead
                      ? 'bg-slate-100 dark:bg-slate-700'
                      : 'bg-indigo-100 dark:bg-indigo-900/40'
                  }`}>
                    {TYPE_ICON[notification.type] ?? '🔔'}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <p className={`font-bold text-sm ${notification.isRead ? 'text-slate-700 dark:text-slate-300' : 'text-slate-900 dark:text-white'}`}>
                        {notification.title}
                        {!notification.isRead && (
                          <span className="inline-block ml-2 w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                        )}
                      </p>
                      {!notification.isRead && (
                        <button
                          onClick={() => void handleMarkAsRead(notification.id)}
                          className="shrink-0 flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:opacity-70 transition-opacity"
                          title="Mark as read"
                        >
                          <Check size={12} /> Read
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium leading-relaxed">
                      {notification.message}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-2 font-medium">
                      {formatDate(notification.createdAt)}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
