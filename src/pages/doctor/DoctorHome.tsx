import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { DashboardStats, UpcomingSessionsWidget } from '../../components/dashboard/DashboardComponents';
import { useState, useEffect } from 'react';
import { dashboardService, type DashboardSpecialistData } from '../../services/api/dashboard';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../services/api/bookings';

export const DoctorHome = () => {
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [stats, setStats] = useState<DashboardSpecialistData | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const upcoming = await bookingService.getUpcomingBookings();
        setSessions(upcoming);
        const dashboardStats = await dashboardService.getSpecialistDashboard();
        setStats(dashboardStats);
      } catch (err) {
        console.error('Error:', err);
      }
    };
    fetchSessions();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="bg-gradient-to-r from-primary-600 to-secondary-600 rounded-2xl shadow-lg p-8 text-white">
          <h1 className="text-4xl font-bold mb-2">Welcome Back, Doctor! 👋</h1>
          <p className="text-lg opacity-90">
            Manage your sessions and connect with your patients
          </p>
        </div>

        <DashboardStats
          totalSessions={stats?.totalSessions ?? (stats?.sessions?.length ?? 0)}
          upcomingSessions={stats?.upcomingSessions ?? 0}
          completedTests={0}
          activePatients={stats?.activePatients ?? 0}
        />

        <div className="grid md:grid-cols-2 gap-6">
          <UpcomingSessionsWidget sessions={sessions} />
          
          <Card>
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Recent Patients</h3>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="flex items-center justify-between p-3 rounded-lg bg-neutral-50"
                >
                  <div>
                    <p className="font-medium text-neutral-900">Patient {i}</p>
                    <p className="text-sm text-neutral-500">Last seen 2 days ago</p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};
