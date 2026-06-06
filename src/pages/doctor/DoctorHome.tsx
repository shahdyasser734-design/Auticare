import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { PatientCarousel } from '../../components/dashboard/PatientCarousel';
import { DashboardStats, createDoctorStats, createTherapistStats } from '../../components/dashboard/DashboardStats';
import { useAuth } from '../../context/useAuth';
import { dashboardService, type DashboardSpecialistData, type PatientCard } from '../../services/api/dashboard';
import { bookingService, type Booking } from '../../services/api/bookings';
import { notificationService, type Notification } from '../../services/api/notifications';
import { childrenService, type Child } from '../../services/api/children';
import { formatDateTime } from '../../utils/dateUtils';
import { Loader2, Calendar, Users, Bell, ClipboardList, ArrowRight, Activity } from 'lucide-react';

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
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialistData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[DASHBOARD] Fetching specialist dashboard data for ${user?.role}:`, user?.id);

      const [dashData, bookingData, childList, notifData] = await Promise.all([
        dashboardService.getSpecialistDashboard().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch specialist dashboard:', err);
          return null;
        }),
        bookingService.getUpcomingBookings().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch bookings:', err);
          return [];
        }),
        childrenService.getChildren().catch(() => []),
        notificationService.getNotifications().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch notifications:', err);
          return [];
        }),
      ]);

      setDashboardData(dashData);

      // Extract patients from dashboard data
      const patientsFromAPI: PatientCard[] = dashData?.patients ?? [];
      console.log('[DASHBOARD] Loaded patients from API:', patientsFromAPI.length);
      setPatients(patientsFromAPI);

      setSessions(bookingData);
      setChildren(childList);
      setNotifications(notifData.slice(0, 5));

      console.log(
        `[DASHBOARD] Dashboard ready - ${patientsFromAPI.length} patients, ${bookingData.length} bookings, ${notifData.length} notifications`
      );
    } catch (err) {
      console.error('[DASHBOARD] Error fetching dashboard data:', err);
      setError('Failed to load dashboard. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchSpecialistData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUpdateStatus = async (id: string, newStatus: Booking['status']) => {
    try {
      console.log(`[DASHBOARD] Updating booking ${id} to status: ${newStatus}`);
      await bookingService.updateBookingStatus(id, newStatus);
      console.log(`[DASHBOARD] Successfully updated booking ${id}`);
      void fetchSpecialistData();
    } catch (err) {
      console.error(`[DASHBOARD] Error updating booking ${id}:`, err);
    }
  };

  const pendingBookings = sessions.filter((s) => s.status === 'pending');
  const confirmedSessions = sessions.filter((s) => s.status === 'confirmed' || s.status === 'scheduled');
  const todaySessions = confirmedSessions.filter((s) => isToday(s.appointmentDate) || isToday(s.dateTime));

  // Build stats from API data
  const stats = isDoctor ? createDoctorStats(dashboardData) : createTherapistStats(dashboardData);

  // Merge API assigned children with local children list
  const assignedChildrenFromAPI = dashboardData?.assignedChildren ?? [];
  const displayChildren =
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

  // State alert for Zoom room availability
  const [zoomAlert, setZoomAlert] = useState<string | null>(null);

  const handleJoinZoom = (link?: string) => {
    if (!link || link.trim() === '' || link.includes('9876543210')) {
      setZoomAlert('No Zoom meeting link available.');
      setTimeout(() => setZoomAlert(null), 4000);
      return;
    }
    window.open(link, '_blank');
  };

  const getGreeting = () => {
    const fullName = user?.name || '';
    if (isDoctor) {
      return `Welcome, Dr. ${fullName}`;
    }
    return `Welcome, Therapist ${fullName}`;
  };

  const getSubtitle = () => {
    if (isDoctor) {
      return "Monitor patients, review assessments, and guide treatment plans.";
    }
    return "Support development goals, track sessions, and help children thrive.";
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-slate-500 animate-pulse font-medium">Loading your healthcare dashboard...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Dynamic Zoom Alert */}
        {zoomAlert && (
          <div className="fixed top-20 right-6 z-50 p-4 bg-orange-600 text-white rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <span>⚠️</span>
            <p className="font-bold text-sm">{zoomAlert}</p>
          </div>
        )}

        {/* Welcome Hero Banner */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary-600 via-primary-500 to-secondary-500 p-8 md:p-12 text-white shadow-2xl">
          {/* Animated Ambient background elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.1),transparent_50%)]" />
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl translate-x-1/3 -translate-y-1/3 animate-pulse-slow" />
          <div className="absolute bottom-0 left-10 w-72 h-72 bg-secondary-400/10 rounded-full blur-2xl translate-y-1/3" />
          
          {/* Animated floating blobs and shapes */}
          <div className="absolute top-10 left-1/2 w-8 h-8 rounded-full bg-white/10 blur-[1px] animate-float-slow" />
          <div className="absolute bottom-12 right-1/3 w-12 h-12 rounded-full bg-white/5 blur-[2px] animate-float-delayed" />
          
          <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="space-y-4 max-w-xl text-left">
              <div className="inline-block font-bold tracking-wider capitalize text-xs">
                <Badge variant="secondary" size="sm">
                  {isDoctor ? 'Clinical Specialist' : 'Development Therapist'}
                </Badge>
              </div>
              <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">
                {getGreeting()} 👋
              </h1>
              <p className="text-base md:text-lg opacity-90 leading-relaxed font-semibold">
                {getSubtitle()}
              </p>
              
              {/* Quick stats on Left side */}
              <div className="flex gap-4 pt-2">
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
                  <span className="font-bold text-lg block">{dashboardData?.todaySessions || 0}</span>
                  <span className="opacity-80">Today's Sessions</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/10 text-xs">
                  <span className="font-bold text-lg block">{dashboardData?.activeCases || 0}</span>
                  <span className="opacity-80">Active Cases</span>
                </div>
              </div>
            </div>

            {/* SVG Illustration on Right side */}
            <div className="w-full lg:w-auto flex justify-center shrink-0">
              <div className="relative w-64 h-64 md:w-72 md:h-72 bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl flex items-center justify-center overflow-hidden">
                <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full max-w-[200px]">
                  {/* Outer circle decoration */}
                  <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="2" strokeDasharray="4 4" className="opacity-30" />
                  
                  {isDoctor ? (
                    <>
                      {/* Doctor / Medical Graph Visual */}
                      <path d="M40 140 L70 110 L100 120 L130 80 L160 90" stroke="#FFE066" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
                      <circle cx="130" cy="80" r="6" fill="#FFE066" />
                      <circle cx="160" cy="90" r="6" fill="#FFE066" />
                      
                      {/* Stethoscope / Shield shape inside */}
                      <path d="M70 70 C70 50, 130 50, 130 70 C130 110, 100 130, 100 130 C100 130, 70 110, 70 70 Z" fill="white" fillOpacity="0.15" stroke="white" strokeWidth="3" />
                      <line x1="100" y1="80" x2="100" y2="110" stroke="white" strokeWidth="3" />
                      <circle cx="100" cy="65" r="8" fill="white" />
                    </>
                  ) : (
                    <>
                      {/* Therapist / Developmental Milestones Visual */}
                      {/* Blocks / Steps */}
                      <rect x="50" y="110" width="30" height="40" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
                      <rect x="85" y="85" width="30" height="65" rx="4" fill="white" fillOpacity="0.2" stroke="white" strokeWidth="2" />
                      <rect x="120" y="60" width="30" height="90" rx="4" fill="white" fillOpacity="0.3" stroke="white" strokeWidth="2" />
                      
                      {/* Floating balloon/success shape */}
                      <circle cx="135" cy="40" r="10" fill="#FFE066" />
                      <path d="M135 50 Q135 60, 140 65" stroke="#FFE066" strokeWidth="2" />
                    </>
                  )}
                  {/* Floating cross icon */}
                  <g className="animate-bounce" style={{ transformOrigin: '50px 50px' }}>
                    <path d="M45 40 H55 M50 35 V45" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </g>
                  {/* Floating heart icon */}
                  <g className="animate-pulse">
                    <path d="M150 145 C150 142.5 152.5 140 155 140 C157.5 140 160 142.5 160 145 C160 150 150 155 150 155 C150 155 140 150 140 145 C140 142.5 142.5 140 145 140 C147.5 140 150 142.5 150 145 Z" fill="white" fillOpacity="0.3" />
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-2xl">
            <p className="text-sm text-red-700 dark:text-red-300 font-medium">{error}</p>
          </div>
        )}

        {/* Dashboard Statistics from API */}
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Dashboard Overview</h2>
          <DashboardStats stats={stats} />
        </div>

        {/* Patient Carousel - Main Section */}
        {patients.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="text-primary-600" />
                Your Patients
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients`)}
                className="cursor-pointer"
              >
                View All <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
            <PatientCarousel
              patients={patients}
              isDoctor={isDoctor}
              onPatientClick={(patientId) => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients/${patientId}`)}
            />
          </div>
        )}

        {/* Main Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Sessions & Pending Requests */}
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
                              🔎 View Patient Profile
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success">Today</Badge>
                          <Button
                            size="sm"
                            onClick={() => handleJoinZoom(zoomLink)}
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
                  <span>⏳</span> Pending Booking Requests ({pendingBookings.length})
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
                              🔎 Review Patient Profile
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
                <Calendar className="text-green-500" /> Upcoming Confirmed Sessions
              </h3>

              {confirmedSessions.length === 0 ? (
                <p className="text-slate-500 text-sm py-4 text-center">No confirmed sessions scheduled.</p>
              ) : (
                <div className="space-y-4">
                  {confirmedSessions.slice(0, 5).map((session) => {
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
                              🔎 View Patient Charts
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success">Confirmed</Badge>
                          <Button
                            size="sm"
                            onClick={() => handleJoinZoom(session.joinLink)}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer"
                          >
                            🎥 Start Session
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* Right Column: Assigned Cases + Notifications */}
          <div className="space-y-6 lg:col-span-1">

            {/* Assigned Children / Cases */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="text-primary-600" size={18} /> Assigned Cases
                </h3>
                <Badge variant="secondary">{displayChildren.length} Active</Badge>
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
                          {isDoctor && !!(c as Record<string, unknown>).assignedTherapist && (
                            <p className="text-purple-500 mt-0.5 font-medium">🧑‍🏫 Therapist: {(c as Record<string, unknown>).assignedTherapist as string}</p>
                          )}
                          {!isDoctor && !!(c as Record<string, unknown>).assignedDoctor && (
                            <p className="text-blue-500 mt-0.5 font-medium">👨‍⚕️ Doctor: {(c as Record<string, unknown>).assignedDoctor as string}</p>
                          )}
                          {!!(c as Record<string, unknown>).status && (
                            <span className={`inline-block mt-1 px-2 py-0.5 rounded-full text-[10px] font-bold capitalize ${
                              (c as Record<string, unknown>).status === 'active' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                              : (c as Record<string, unknown>).status === 'in-treatment' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                              : 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300'
                            }`}>
                              {(c as Record<string, unknown>).status === 'in-treatment' ? 'In Treatment' : (c as Record<string, unknown>).status as string}
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

              <div className="mt-4 pt-4 border-t border-slate-100 dark:border-white/5">
                <Button
                  size="sm"
                  fullWidth
                  variant="outline"
                  onClick={() => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients`)}
                  className="rounded-xl cursor-pointer"
                >
                  <ClipboardList size={14} className="mr-1.5" /> View All Cases
                </Button>
              </div>
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
                    <div
                      key={n.id}
                      className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                        n.isRead
                          ? 'bg-slate-50/50 border-slate-100 text-slate-600'
                          : 'bg-primary-50/40 border-primary-100 text-slate-800 font-medium'
                      }`}
                    >
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
