import { Users, Calendar, Clock, CheckCircle, AlertCircle, Mail } from 'lucide-react';
import { Card } from '../common/Card';
import type { DashboardSpecialistData } from '../../services/api/dashboard';


export interface DashboardStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  trend?: {
    direction: 'up' | 'down';
    percentage: number;
  };
}

interface DashboardStatsProps {
  stats: DashboardStat[];
}

export const DashboardStats: React.FC<DashboardStatsProps> = ({ stats }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
      {stats.map((stat, idx) => (
        <Card
          key={idx}
          className="p-4 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-shadow rounded-2xl"
        >
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            </div>

            <div className="space-y-1">
              <p className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              {stat.trend && (
                <div className={`text-xs font-semibold flex items-center gap-1 ${stat.trend.direction === 'up' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                  <span>{stat.trend.direction === 'up' ? '↑' : '↓'}</span>
                  <span>{stat.trend.percentage}% this month</span>
                </div>
              )}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const createDoctorStats = (dashboardData: DashboardSpecialistData | null): DashboardStat[] => [
  {
    label: 'Total Patients',
    value: dashboardData?.patientCount ?? dashboardData?.activeCases ?? 0,
    icon: <Users size={20} />,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
  },
  {
    label: 'Active Cases',
    value: dashboardData?.activeCases ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
  },
  {
    label: "Today's Sessions",
    value: dashboardData?.todaySessions ?? 0,
    icon: <Calendar size={20} />,
    color: 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400',
  },
  {
    label: 'Upcoming Sessions',
    value: dashboardData?.upcomingSessions ?? 0,
    icon: <Clock size={20} />,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400',
  },
  {
    label: 'Pending Requests',
    value: dashboardData?.pendingRequests ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/20 dark:text-yellow-400',
  },
  {
    label: 'Completed Sessions',
    value: dashboardData?.completedSessions ?? 0,
    icon: <CheckCircle size={20} />,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400',
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const createTherapistStats = (dashboardData: DashboardSpecialistData | null): DashboardStat[] => [
  {
    label: 'Assigned Cases',
    value: dashboardData?.activeCases ?? 0,
    icon: <Users size={20} />,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400',
  },
  {
    label: 'Active Cases',
    value: dashboardData?.activePatients ?? dashboardData?.activeCases ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-red-50 text-red-600 dark:bg-red-950/20 dark:text-red-400',
  },
  {
    label: "Today's Sessions",
    value: dashboardData?.todaySessions ?? 0,
    icon: <Calendar size={20} />,
    color: 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400',
  },
  {
    label: 'Upcoming Sessions',
    value: dashboardData?.upcomingSessions ?? 0,
    icon: <Clock size={20} />,
    color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400',
  },
  {
    label: 'Unread Messages',
    value: dashboardData?.unreadMessages ?? 0,
    icon: <Mail size={20} />,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/20 dark:text-indigo-400',
  },
  {
    label: 'Completed Sessions',
    value: dashboardData?.completedSessions ?? 0,
    icon: <CheckCircle size={20} />,
    color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400',
  },
];
