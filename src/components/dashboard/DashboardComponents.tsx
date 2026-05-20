import { StatCard } from '../common/StatCard';
import type { Booking } from '../../services/api/bookings';
import { formatDateTime } from '../../utils/dateUtils';

interface DashboardStatsProps {
  totalSessions?: number;
  upcomingSessions?: number;
  completedTests?: number;
  activePatients?: number;
}

export const DashboardStats = ({
  totalSessions = 0,
  upcomingSessions = 0,
  completedTests = 0,
  activePatients = 0,
}: DashboardStatsProps) => {
  return (
    <div className="grid md:grid-cols-4 gap-6">
      <StatCard label="Total Sessions" value={totalSessions} icon="📅" trend="up" trendValue="12%" />
      <StatCard label="Upcoming" value={upcomingSessions} icon="⏳" trend="neutral" trendValue="On track" />
      <StatCard label="Completed Tests" value={completedTests} icon="✓" trend="up" trendValue="8%" />
      <StatCard label="Active Patients" value={activePatients} icon="👥" trend="up" trendValue="5%" />
    </div>
  );
};

interface UpcomingSessionsWidgetProps {
  sessions: Booking[];
}

export const UpcomingSessionsWidget = ({ sessions }: UpcomingSessionsWidgetProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h3 className="text-xl font-bold text-neutral-900 mb-4">Upcoming Sessions</h3>
      <div className="space-y-4">
        {sessions.length === 0 ? (
          <p className="text-neutral-500 text-center py-8">No upcoming sessions</p>
        ) : (
          sessions.slice(0, 5).map((session) => (
            <div
              key={session.id}
              className="flex items-center justify-between p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition"
            >
              <div>
                <p className="font-medium text-neutral-900">Session</p>
                <p className="text-sm text-neutral-600">{formatDateTime(session.dateTime)}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-sm font-medium capitalize
                ${session.status === 'scheduled' ? 'bg-primary-100 text-primary-800' : 'bg-neutral-100 text-neutral-800'}`}>
                {session.status}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
