import { Users, Calendar, Clock, CheckCircle, AlertCircle, Mail, TrendingUp, TrendingDown } from 'lucide-react';
import { Card } from '../common/Card';
import type { DashboardSpecialistData } from '../../services/api/dashboard';


export interface DashboardStat {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
  bgGradient?: string;
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
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      {stats.map((stat, idx) => {
        const baseColor = stat.color.split(' ')[0] || 'bg-slate-100';
        return (
          <Card
            key={idx}
            className="relative p-5 border border-stone-200/50 dark:border-white/8 standard-card overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group cursor-default"
          >
            {/* Animated gradient blob background */}
            <div className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-15 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 blur-3xl ${baseColor}`} />
            <div className={`absolute -left-4 -top-4 w-16 h-16 rounded-full opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-700 blur-2xl ${baseColor}`} />

            <div className="relative z-10 flex flex-col gap-3">
              {/* Icon */}
              <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${stat.color} transition-transform duration-300 group-hover:scale-110`}>
                {stat.icon}
              </div>

              {/* Value */}
              <div>
                <p className="text-3xl font-black text-stone-800 dark:text-white tracking-tight leading-none">
                  {stat.value}
                </p>
                <p className="text-[10px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5 leading-tight">
                  {stat.label}
                </p>
              </div>

              {/* Trend badge */}
              {stat.trend && (
                <div className={`flex items-center gap-1 text-[10px] font-bold ${
                  stat.trend.direction === 'up'
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400'
                }`}>
                  {stat.trend.direction === 'up'
                    ? <TrendingUp size={11} />
                    : <TrendingDown size={11} />
                  }
                  <span>{stat.trend.percentage}% this month</span>
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const createDoctorStats = (dashboardData: DashboardSpecialistData | null): DashboardStat[] => [
  {
    label: 'Total Patients',
    value: dashboardData?.patientCount ?? dashboardData?.activeCases ?? 0,
    icon: <Users size={20} />,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  },
  {
    label: 'Active Cases',
    value: dashboardData?.activeCases ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
  },
  {
    label: "Today's Sessions",
    value: dashboardData?.todaySessions ?? 0,
    icon: <Calendar size={20} />,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  {
    label: 'Upcoming',
    value: dashboardData?.upcomingSessions ?? 0,
    icon: <Clock size={20} />,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  },
  {
    label: 'Pending',
    value: dashboardData?.pendingRequests ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-yellow-50 text-yellow-600 dark:bg-yellow-950/30 dark:text-yellow-400',
  },
  {
    label: 'Completed',
    value: dashboardData?.completedSessions ?? 0,
    icon: <CheckCircle size={20} />,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  },
];

// eslint-disable-next-line react-refresh/only-export-components
export const createTherapistStats = (dashboardData: DashboardSpecialistData | null): DashboardStat[] => [
  {
    label: 'Assigned Cases',
    value: dashboardData?.activeCases ?? 0,
    icon: <Users size={20} />,
    color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/30 dark:text-blue-400',
  },
  {
    label: 'Active Cases',
    value: dashboardData?.activePatients ?? dashboardData?.activeCases ?? 0,
    icon: <AlertCircle size={20} />,
    color: 'bg-rose-50 text-rose-600 dark:bg-rose-950/30 dark:text-rose-400',
  },
  {
    label: "Today's Sessions",
    value: dashboardData?.todaySessions ?? 0,
    icon: <Calendar size={20} />,
    color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400',
  },
  {
    label: 'Upcoming',
    value: dashboardData?.upcomingSessions ?? 0,
    icon: <Clock size={20} />,
    color: 'bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400',
  },
  {
    label: 'Messages',
    value: dashboardData?.unreadMessages ?? 0,
    icon: <Mail size={20} />,
    color: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-950/30 dark:text-indigo-400',
  },
  {
    label: 'Completed',
    value: dashboardData?.completedSessions ?? 0,
    icon: <CheckCircle size={20} />,
    color: 'bg-violet-50 text-violet-600 dark:bg-violet-950/30 dark:text-violet-400',
  },
];
