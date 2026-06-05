import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { useAuth } from '../../context/useAuth';
import { dashboardService, type DashboardSpecialistData, type AssignedChild } from '../../services/api/dashboard';
import { bookingService, type Booking } from '../../services/api/bookings';
import { notificationService, type Notification } from '../../services/api/notifications';
import { childrenService, type Child } from '../../services/api/children';
import { formatDateTime } from '../../utils/dateUtils';
import { Loader2, Calendar, Users, Bell, ClipboardList, CheckCircle, Clock, Activity } from 'lucide-react';

const isToday = (dateStr?: string): boolean => {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const now = new Date();
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  );
};

export const DoctorHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';

  const [dashboardData, setDashboardData] = useState<DashboardSpecialistData | null>(null);
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSpecialistData = async () => {
    try {
      setLoading(true);
      const [db, upcoming, childList, notifList] = await Promise.all([
        dashboardService.getSpecialistDashboard().catch(() => null),
        bookingService.getUpcomingBookings().catch(() => []),
        childrenService.getChildren().catch(() => []),
        notificationService.getNotifications().catch(() => []),
      ]);

      setDashboardData(db);
      setSessions(upcoming);
      setChildren(childList);
      setNotifications(notifList.slice(0, 5));
    } catch (err) {
      console.error('Error fetching specialist dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchSpecialistData();
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Booking['status']) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      void fetchSpecialistData();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  const pendingBookings = sessions.filter((s) => s.status === 'pending');
  const confirmedSessions = sessions.filter((s) => s.status === 'confirmed' || s.status === 'scheduled');
  const todaySessions = confirmedSessions.filter((s) => isToday(s.appointmentDate) || isToday(s.dateTime));
  const completedSessions = sessions.filter((s) => s.status === 'completed');

  // Use API data if available, fallback to derived counts
  const activeCasesCount = dashboardData?.activeCases ?? dashboardData?.activePatients ?? dashboardData?.patientCount ?? children.length;
  const todaySessionsCount = dashboardData?.todaySessions ?? todaySessions.length;
  const pendingPlansCount = dashboardData?.pendingPlans ?? pendingBookings.length;
  const completedCount = dashboardData?.completedSessions ?? completedSessions.length;

  // Merge API assigned children with local children list
  const assignedChildrenFromAPI: AssignedChild[] = dashboardData?.assignedChildren ?? [];
  const displayChildren: Array<Child & { status?: string; assignedDoctor?: string; assignedTherapist?: string }> =
    assignedChildrenFromAPI.length > 0
      ? assignedChildrenFromAPI.map((ac) => ({
          id: ac.id,
          parentId: '',
          name: ac.name,
          age: ac.age ?? 0,
          gender: ac.gender ?? 'Unknown',
          dateOfBirth: '',
          createdAt: '',
          status: ac.status,
          assignedDoctor: ac.assignedDoctor,
          assignedTherapist: ac.assignedTherapist,
        }))
      : children.map((c) => ({ ...c, status: 'active' as const }));

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-slate-500 animate-pulse font-medium">Configuring specialist workspace...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-primary-600 via-primary-500 to-secondary-500 p-8 md:p-12 text-white shadow-xl">
          <div className="relative z-10 space-y-3 max-w-2xl">
            <Badge variant="secondary">{isDoctor ? 'Doctor' : 'Therapist'} Dashboard</Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">
              Welcome Back, {user?.name?.split(' ')[0] || user?.name || (isDoctor ? 'Doctor' : 'Therapist')}! 👋
            </h1>
            <p className="text-lg opacity-90 leading-relaxed font-medium">
              {isDoctor
                ? 'Manage clinical sessions, design treatment plans, approve patient bookings, and stay connected with parents.'
                : 'View assigned cases, participate in sessions, update progress notes, and communicate with your team.'}
            </p>
          </div>
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-56 h-56 bg-primary-400/20 rounded-full translate-y-1/3 blur-xl" />
        </div>

        {/* Quick Stats Panel — from API */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Active Cases', value: activeCasesCount, icon: <Users size={22} />, color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20 dark:text-blue-400' },
            { label: "Today's Sessions", value: todaySessionsCount, icon: <Calendar size={22} />, color: 'bg-green-50 text-green-600 dark:bg-green-950/20 dark:text-green-400' },
            { label: isDoctor ? 'Pending Bookings' : 'Upcoming Sessions', value: pendingPlansCount, icon: <Clock size={22} />, color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20 dark:text-orange-400' },
            { label: 'Completed Sessions', value: completedCount, icon: <CheckCircle size={22} />, color: 'bg-purple-50 text-purple-600 dark:bg-purple-950/20 dark:text-purple-400' },
          ].map((stat, idx) => (
            <Card key={idx} className="p-5 border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center ${stat.color}`}>{stat.icon}</span>
            </Card>
          ))}
        </div>

        {/* Main Dashboard Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1: Today Sessions + Pending / Upcoming */}
          <div className="lg:col-span-2 space-y-6">

            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
              <Card className="border border-green-200 dark:border-green-800/30 shadow-md rounded-3xl p-6 bg-green-50/20 dark:bg-green-950/10">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <Activity className="text-green-500" /> Today's Sessions
                </h3>
                <div className="space-y-4">
                  {todaySessions.map((session) => {
                    const zoomLink = session.joinLink || 'https://zoom.us/j/9876543210';
                    return (
                      <div key={session.id} className="p-4 bg-white dark:bg-slate-900/60 border border-green-100 dark:border-green-900/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-900 dark:text-white">Development Session</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Time: {session.appointmentTime || (session.dateTime ? formatDateTime(session.dateTime) : 'Scheduled')}
                          </p>
                          {session.childId && (
                            <button
                              onClick={() => navigate(`/${user?.role}/patients/${session.childId}`)}
                              className="mt-1 text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer block text-left"
                            >
                              🔎 View Child Profile
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success">Today</Badge>
                          <Button
                            size="sm"
                            onClick={() => window.open(zoomLink, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            🎥 Join Zoom
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Pending Booking Approvals (Doctor only) */}
            {isDoctor && (
              <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                  <span>⏳</span> Pending Booking Requests
                </h3>

                {pendingBookings.length === 0 ? (
                  <p className="text-slate-500 text-sm py-4 text-center">No pending booking requests.</p>
                ) : (
                  <div className="space-y-4">
                    {pendingBookings.map((booking) => (
                      <div key={booking.id} className="p-5 bg-orange-50/20 dark:bg-orange-950/10 border border-orange-200/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">Appointment Request</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Date: {booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString() : 'TBD'} at {booking.appointmentTime || 'TBD'}
                          </p>
                          {booking.reason && <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 italic">Reason: "{booking.reason}"</p>}
                          {booking.childId && (
                            <button
                              onClick={() => navigate(`/doctor/patients/${booking.childId}`)}
                              className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer block text-left"
                            >
                              🔎 Review Child Development Profile
                            </button>
                          )}
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <Button
                            size="sm"
                            onClick={() => handleUpdateStatus(booking.id, 'confirmed')}
                            className="bg-green-600 hover:bg-green-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleUpdateStatus(booking.id, 'cancelled')}
                            className="rounded-lg cursor-pointer"
                          >
                            Reject
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            )}

            {/* Upcoming Confirmed Sessions */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Calendar className="text-green-500" /> Upcoming {isDoctor ? 'Approved Consultations' : 'Sessions'}
              </h3>

              {confirmedSessions.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No confirmed consultations scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {confirmedSessions.map((session) => {
                    const zoomLink = session.joinLink || 'https://zoom.us/j/9876543210';
                    return (
                      <div key={session.id} className="p-5 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white text-base">Development Session</p>
                          <p className="text-xs text-slate-500 mt-1">
                            Time: {session.dateTime ? formatDateTime(session.dateTime) : `${session.appointmentDate || ''} at ${session.appointmentTime || 'TBD'}`}
                          </p>
                          {session.notes && <p className="text-xs text-slate-500 mt-1">Notes: {session.notes}</p>}
                          {session.childId && (
                            <button
                              onClick={() => navigate(`/${user?.role}/patients/${session.childId}`)}
                              className="mt-2 text-xs font-bold text-primary-600 hover:text-primary-700 underline cursor-pointer block text-left"
                            >
                              🔎 View Patient Charts &amp; Screening Results
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success">Confirmed</Badge>
                          <Button
                            size="sm"
                            onClick={() => window.open(zoomLink, '_blank')}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            🎥 Start Zoom Room
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Column 2: Assigned Cases + Notifications */}
          <div className="space-y-6 lg:col-span-1">

            {/* Assigned Children / Cases */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="text-primary-600" size={18} /> Assigned Cases
                </h3>
                <Badge variant="secondary">{activeCasesCount} Active</Badge>
              </div>

              <div className="space-y-3">
                {displayChildren.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No assigned cases yet.</p>
                ) : (
                  displayChildren.map((c) => (
                    <div key={c.id} className="p-3 bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 rounded-xl text-xs">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1">
                          <p className="font-bold text-slate-900 dark:text-white">{c.name}</p>
                          <p className="text-slate-500 mt-0.5 capitalize">
                            {c.age ? `Age: ${c.age} yrs` : ''}{c.gender ? ` · ${c.gender}` : ''}
                          </p>
                          {/* Role-based: Doctor sees therapist, Therapist sees doctor */}
                          {isDoctor && (c as any).assignedTherapist && (
                            <p className="text-purple-500 mt-0.5 font-medium">🧑‍🏫 Therapist: {(c as any).assignedTherapist}</p>
                          )}
                          {!isDoctor && (c as any).assignedDoctor && (
                            <p className="text-blue-500 mt-0.5 font-medium">👨‍⚕️ Doctor: {(c as any).assignedDoctor}</p>
                          )}
                          {(c as any).status && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              (c as any).status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : (c as any).status === 'in-treatment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {(c as any).status === 'in-treatment' ? 'In Treatment' : (c as any).status}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/${user?.role}/patients/${c.id}`)}
                          className="text-primary-600 font-bold hover:underline cursor-pointer shrink-0"
                        >
                          Open
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {isDoctor && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <Button
                    size="sm"
                    fullWidth
                    variant="outline"
                    onClick={() => navigate('/doctor/patients')}
                    className="rounded-xl cursor-pointer"
                  >
                    <ClipboardList size={14} className="mr-1.5" /> View All Cases
                  </Button>
                </div>
              )}
              {!isDoctor && (
                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                  <Button
                    size="sm"
                    fullWidth
                    variant="outline"
                    onClick={() => navigate('/therapist/patients')}
                    className="rounded-xl cursor-pointer"
                  >
                    <ClipboardList size={14} className="mr-1.5" /> View All Cases
                  </Button>
                </div>
              )}
            </Card>

            {/* Action Alerts / Notifications */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <Bell className="text-orange-500" size={18} /> Action Alerts
              </h3>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No alerts currently.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                      n.isRead
                        ? 'bg-slate-50/50 border-slate-100 text-slate-600'
                        : 'bg-primary-50/40 border-primary-100 text-slate-800 font-medium'
                    }`}>
                      <p className="font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                      <p className="text-slate-600 dark:text-slate-400">{n.content}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Button
                  size="sm"
                  fullWidth
                  variant="outline"
                  onClick={() => navigate('/notifications')}
                  className="rounded-xl cursor-pointer"
                >
                  <Bell size={14} className="mr-1.5" /> All Notifications
                </Button>
              </div>
            </Card>

          </div>
        </div>
      </div>
    </MainLayout>
  );
};
