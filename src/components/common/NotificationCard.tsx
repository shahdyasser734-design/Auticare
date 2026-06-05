import clsx from 'clsx';
import { Badge } from './Badge';
import { Button } from './Button';
import { Card } from './Card';
import type { Notification as NotificationType } from '../../types';

interface NotificationCardProps {
  notification: NotificationType;
  onMarkAsRead: (notificationId: string) => void;
}

const notificationTypeMap = {
  session: {
    label: 'Session',
    icon: '📅',
    accent: 'bg-primary-100 text-primary-700',
  },
  booking: {
    label: 'Booking',
    icon: '🗓️',
    accent: 'bg-secondary-100 text-secondary-700',
  },
  screening: {
    label: 'Screening Reminder',
    icon: '🧠',
    accent: 'bg-warning-100 text-warning-700',
  },
  'treatment-plan': {
    label: 'Treatment Plan',
    icon: '📋',
    accent: 'bg-info-100 text-info-700',
  },
  message: {
    label: 'Message',
    icon: '✉️',
    accent: 'bg-success-100 text-success-700',
  },
  reminder: {
    label: 'Reminder',
    icon: '🔔',
    accent: 'bg-warning-100 text-warning-700',
  },
  notes: {
    label: 'Notes',
    icon: '📝',
    accent: 'bg-info-100 text-info-700',
  },
  system: {
    label: 'System',
    icon: '⚠️',
    accent: 'bg-danger-100 text-danger-700',
  },
} as const;

export const NotificationCard = ({ notification, onMarkAsRead }: NotificationCardProps) => {
  const typeMeta = notificationTypeMap[notification.type] ?? notificationTypeMap.system;

  return (
    <Card
      className={clsx(
        'border transition duration-200',
        !notification.isRead && 'border-primary-300 bg-primary-50/50'
      )}
      hoverable
    >
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          <div className={clsx('grid place-items-center w-14 h-14 rounded-3xl', typeMeta.accent)}>
            <span className="text-2xl">{typeMeta.icon}</span>
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h3 className="text-xl font-semibold text-neutral-900 truncate">{notification.title}</h3>
              <Badge variant={notification.isRead ? 'secondary' : 'primary'} size="sm">
                {notification.isRead ? 'Read' : 'Unread'}
              </Badge>
            </div>
            <p className="text-neutral-700 leading-7">{notification.message}</p>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm text-neutral-500">
              <span>{new Date(notification.createdAt).toLocaleString([], {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}</span>
              <Badge variant="secondary" size="sm">{typeMeta.label}</Badge>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant={notification.isRead ? 'outline' : 'primary'}
            size="sm"
            onClick={() => onMarkAsRead(notification.id)}
            disabled={notification.isRead}
          >
            {notification.isRead ? 'Already read' : 'Mark as read'}
          </Button>
        </div>
      </div>
    </Card>
  );
};
