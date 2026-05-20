import { useEffect, useMemo, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Alert } from '../../components/common/Alert';
import { NotificationCard } from '../../components/common/NotificationCard';
import { notificationService } from '../../services/notificationService';
import type { Notification } from '../../types';

const filterOptions = [
  { value: 'all', label: 'All' },
  { value: 'unread', label: 'Unread' },
  { value: 'read', label: 'Read' },
] as const;

type NotificationFilter = (typeof filterOptions)[number]['value'];

export const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<NotificationFilter>('all');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationService.getNotifications();
      setNotifications(data);
    } catch (error) {
      console.error(error);
      setError('Unable to load notifications. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadNotifications = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await notificationService.getNotifications();
        setNotifications(data);
      } catch (error) {
        console.error(error);
        setError('Unable to load notifications. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    void loadNotifications();
  }, []);

  const filteredNotifications = useMemo(() => {
    if (filter === 'read') {
      return notifications.filter((notification) => notification.isRead);
    }
    if (filter === 'unread') {
      return notifications.filter((notification) => !notification.isRead);
    }
    return notifications;
  }, [filter, notifications]);

  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  const handleMarkAsRead = async (notificationId: string) => {
    setNotifications((current) =>
      current.map((notification) =>
        notification.id === notificationId ? { ...notification, isRead: true } : notification
      )
    );

    try {
      await notificationService.markAsRead(notificationId);
      setSuccessMessage('Notification marked as read.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Unable to update notification status. Please try again.');
      fetchNotifications();
    }
  };

  const handleClearAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await notificationService.deleteAllNotifications();
      setNotifications([]);
      setSuccessMessage('All notifications have been cleared.');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch {
      setError('Unable to clear notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="space-y-3">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-neutral-900">Notifications</h1>
              <p className="text-neutral-600 max-w-2xl">
                Stay on top of session updates, booking reminders, test alerts, messages, and system notices.
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={fetchNotifications} disabled={loading}>
                Refresh
              </Button>
              <Button variant="danger" onClick={handleClearAll} disabled={loading || notifications.length === 0}>
                Clear All
              </Button>
            </div>
          </div>

          <Card className="grid gap-4 md:grid-cols-[1fr_auto] md:items-center">
            <div className="space-y-3">
              <p className="text-sm font-semibold text-neutral-700">Filter notifications</p>
              <div className="flex flex-wrap gap-2">
                {filterOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFilter(option.value)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      filter === option.value
                        ? 'bg-primary-600 text-white'
                        : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-neutral-100'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-3xl bg-neutral-100 p-4 text-sm text-neutral-700">
              <p className="font-semibold text-neutral-900">Summary</p>
              <div className="mt-2 flex flex-wrap gap-3">
                <span className="rounded-full bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm">Total {notifications.length}</span>
                <span className="rounded-full bg-white px-3 py-1 text-sm text-neutral-700 shadow-sm">Unread {unreadCount}</span>
              </div>
            </div>
          </Card>
        </div>

        {error && <Alert type="error" message={error} onClose={() => setError(null)} />}
        {successMessage && <Alert type="success" message={successMessage} onClose={() => setSuccessMessage(null)} />}

        {loading && notifications.length === 0 ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="animate-pulse rounded-3xl bg-white p-6 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-3xl bg-neutral-200" />
                  <div className="flex-1 space-y-3 py-2">
                    <div className="h-4 w-3/4 rounded bg-neutral-200" />
                    <div className="h-3 w-1/2 rounded bg-neutral-200" />
                    <div className="h-3 w-1/3 rounded bg-neutral-200" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filteredNotifications.length > 0 ? (
          <div className="space-y-4">
            {filteredNotifications.map((notification) => (
              <NotificationCard
                key={notification.id}
                notification={notification}
                onMarkAsRead={handleMarkAsRead}
              />
            ))}
          </div>
        ) : (
          <Card className="text-center py-16">
            <div className="mx-auto max-w-xl space-y-4">
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary-600">No notifications</p>
              <h2 className="text-3xl font-bold text-neutral-900">You’re all caught up</h2>
              <p className="text-neutral-600">
                There are no notifications matching your selection right now. Check back later or refresh to load new activity.
              </p>
              <div className="flex justify-center">
                <Button onClick={fetchNotifications} disabled={loading}>
                  Refresh Notifications
                </Button>
              </div>
            </div>
          </Card>
        )}
      </div>
    </MainLayout>
  );
};
