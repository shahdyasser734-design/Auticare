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
import { useNotification } from '../../context/NotificationContext';
import { notesService } from '../../services/api/notes';
import { NoteCard } from '../../components/notes/NoteCard';

import {
  Loader2, Calendar, Users, Bell, ClipboardList, ArrowRight,
  Activity, MessageSquare, Video, CheckCircle2, Clock3, Stethoscope,
  Sparkles, ChevronRight, Heart
} from 'lucide-react';

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
  const isTherapist = user?.role === 'therapist';
  
  const { unreadCount: totalUnreadCount, notifications: allNotifications, chatUnreadCount } = useNotification();
  const notifications = allNotifications.slice(0, 5);

  const [dashboardData, setDashboardData] = useState<DashboardSpecialistData | null>(null);
  const [patients, setPatients] = useState<PatientCard[]>([]);
  const [sessions, setSessions] = useState<Booking[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [children, setChildren] = useState<any[]>([]);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [myNotes, setMyNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSpecialistData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log(`[DASHBOARD] Fetching specialist dashboard data for ${user?.role}:`, user?.id);

      const [dashData, bookingData, childList, notesData] = await Promise.all([
        dashboardService.getSpecialistDashboard().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch specialist dashboard:', err);
          return null;
        }),
        bookingService.getUpcomingBookings().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch bookings:', err);
          return [];
        }),
        bookingService.getMyBookings().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch all bookings for patients:', err);
          return [];
        }),
        notesService.getMyNotes().catch((err) => {
          console.warn('[DASHBOARD] Failed to fetch notes:', err);
          return [];
        }),
      ]);

      const uniqueChildren = new Map();

      // Ensure we have access to all bookings for the specialist
      const allBookings = childList || [];
      
      const patientCards = dashData?.patientCards || dashData?.patients || dashData?.assignedChildren || [];

      // Extract patients from dashboard cards
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      patientCards.forEach((card: any) => {
        const id = card.id || card.childId;
        if (id) {
          uniqueChildren.set(id, {
            id,
            name: card.name || card.childName || 'Unknown Patient',
            age: card.age ?? card.childAge ?? card.ageInYears ?? null,
            gender: card.gender ?? card.childGender ?? card.sex ?? 'Unknown',
            status: card.status || 'active',
            assignedDoctor: card.assignedDoctor || (isDoctor ? user?.name : 'No Doctor Assigned'),
            assignedTherapist: card.assignedTherapist || (isTherapist ? user?.name : 'No Therapist Assigned'),
            parentId: card.parentId || '',
            parentName: card.parentName || 'Parent'
          });
        }
      });

      // Extract patients from ALL bookings, not just active ones
      allBookings.forEach((b: Booking) => {
        const status = (b.status || '').toLowerCase();
        if (status !== 'pending' && status !== 'rejected' && b && b.childId && !uniqueChildren.has(b.childId)) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          const card = patientCards.find((c: any) => c.childName === b.childName || c.name === b.childName);
          uniqueChildren.set(b.childId, {
            id: b.childId,
            name: b.childName || 'Unknown Patient',
            age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
            gender: card?.gender ?? card?.childGender ?? card?.sex ?? '',
            status: 'active',
            assignedDoctor: card.assignedDoctor || '',
            assignedTherapist: card.assignedTherapist || '',
            parentId: b.parentId || '',
            parentName: b.parentName || 'Parent'
          });
        }
      });
      const extractedPatients = Array.from(uniqueChildren.values());

      const enrichedDashData = {
        ...dashData,
        completedSessions: dashData?.completedSessions || allBookings.filter((b: Booking) => b?.status === 'completed').length,
      };

      setDashboardData(enrichedDashData);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPatients(extractedPatients as any[]);
      setSessions(bookingData);
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      setChildren(extractedPatients as any[]);
      setMyNotes(notesData || []);

      console.log(
        `[DASHBOARD] Dashboard ready - ${extractedPatients.length} patients, ${bookingData.length} bookings`
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

  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleUpdateStatus = async (e: React.MouseEvent, booking: Booking, newStatus: Booking['status']) => {
    e.preventDefault();
    e.stopPropagation();
    if (!booking?.id) return;
    try {
      setUpdatingId(booking.id);
      console.log(`[DASHBOARD] Updating booking ${booking.id} to status: ${newStatus}`);
      const updated = await bookingService.updateBookingStatus(booking.id, newStatus);
      console.log(`[DASHBOARD] Successfully updated booking ${booking.id}`);

      // Optimistically update the session list immediately to avoid page flicker
      setSessions(prev => prev.map(s => s.id === booking.id ? { ...s, ...(updated || {}), status: newStatus } : s));

      if (newStatus === 'confirmed' && booking.parentId) {
        try {
          console.log(`[DASHBOARD] Session confirmed for Parent: ${booking.parentId}`);
        } catch (chatErr) {
          console.warn('[DASHBOARD] Failed to handle session confirmation:', chatErr);
        }
      }

      // Fetch in the background instead of replacing the whole screen with a spinner immediately
      void fetchSpecialistData();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error(`[DASHBOARD] Error updating booking ${booking?.id}:`, err);
      const errMsg = err?.response?.data?.title || err?.response?.data?.detail || err?.message || 'Failed to update booking status.';
      setError(`Status Update Failed: ${errMsg}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const pendingBookings = (sessions || []).filter((s) => s && s.status === 'pending');
  const confirmedSessions = (sessions || []).filter((s) => s && (s.status === 'confirmed' || s.status === 'scheduled' || s.status === 'approved'));
  const todaySessions = confirmedSessions.filter((s) => s && (isToday(s.appointmentDate) || isToday(s.dateTime)));

  // Completed sessions might not be in `sessions` (which is upcoming), so use the dashData if > 0, otherwise fallback
  const completedSessionsCount = dashboardData?.completedSessions && dashboardData.completedSessions > 0
    ? dashboardData.completedSessions 
    : 0; // We can't access `childList` directly here, but we can rely on `dashboardData` or mock

  const computedDashboardData: DashboardSpecialistData = {
    ...dashboardData,
    patientCount: dashboardData?.patientCount || children.length,
    activeCases: dashboardData?.activeCases || dashboardData?.activePatients || children.length,
    todaySessions: dashboardData?.todaySessions || todaySessions.length,
    upcomingSessions: dashboardData?.upcomingSessions || confirmedSessions.length,
    pendingRequests: dashboardData?.pendingRequests || pendingBookings.length,
    completedSessions: completedSessionsCount,
    unreadMessages: chatUnreadCount,
  };

  const stats = isDoctor ? createDoctorStats(computedDashboardData) : createTherapistStats(computedDashboardData);

  const displayChildren = children.map((c) => ({ ...c, status: 'active' as const }));

  const handleJoinZoom = (session: Booking) => {
    // Synchronous open — avoids popup blocker
    const url = isDoctor ? 'https://app.zoom.us/wc' : (session.joinLink || session.zoomUrl || `https://zoom.us/j/${session.id}`);
    const tab = window.open(url || 'https://app.zoom.us/wc', '_blank', 'noopener,noreferrer');
    if (!url && tab) {
      tab.close();
      alert('No Zoom meeting link is available for this session.');
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const fullName = user?.name || '';
    if (isDoctor) return `${timeGreet}, Dr. ${fullName}`;
    return `${timeGreet}, ${fullName}`;
  };

  const getSubtitle = () => {
    if (isDoctor) return 'Monitor patients, review assessments, and guide treatment plans.';
    return 'Support development goals, track sessions, and help children thrive.';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="relative">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-xl">
              <Loader2 className="h-8 w-8 animate-spin text-white" />
            </div>
          </div>
          <div className="text-center">
            <p className="text-stone-700 dark:text-slate-300 font-semibold text-lg">Loading your dashboard</p>
            <p className="text-stone-400 dark:text-slate-500 text-sm mt-1 animate-pulse">Fetching clinical data...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 pb-20">

        {/* ── HERO BANNER ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Background gradient */}
          <div className={`absolute inset-0 ${isDoctor
            ? 'bg-gradient-to-br from-indigo-900 via-slate-900 to-blue-950'
            : 'bg-gradient-to-br from-teal-900 via-slate-900 to-emerald-950'
          }`} />
          {/* Decorative blobs */}
          <div className={`absolute top-0 right-0 w-96 h-96 rounded-full opacity-20 blur-3xl -translate-y-1/2 translate-x-1/3 ${isDoctor ? 'bg-indigo-400' : 'bg-teal-400'}`} />
          <div className={`absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-15 blur-3xl translate-y-1/2 -translate-x-1/4 ${isDoctor ? 'bg-purple-500' : 'bg-emerald-500'}`} />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

              {/* Left Content */}
              <div className="space-y-5 max-w-xl">
                <div className="flex items-center gap-2">
                  <span className={`text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full border ${
                    isDoctor
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                      : 'bg-teal-500/20 text-teal-300 border-teal-500/30'
                  }`}>
                    {isDoctor ? '🩺 Clinical Specialist' : '🧠 Development Therapist'}
                  </span>
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Sparkles size={12} className="text-yellow-400" />
                    <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</span>
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    {getGreeting()} 👋
                  </h1>
                  <p className="text-base md:text-lg text-white/70 leading-relaxed mt-3 font-medium">
                    {getSubtitle()}
                  </p>
                </div>

                {/* Quick at-a-glance stats */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {[
                    { icon: <Calendar size={14} />, label: "Today's Sessions", value: todaySessions.length, color: 'text-emerald-300' },
                    { icon: <Users size={14} />, label: 'Active Cases', value: children.length, color: 'text-blue-300' },
                    { icon: <Clock3 size={14} />, label: 'Pending Requests', value: pendingBookings.length, color: 'text-amber-300' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 px-4 py-2.5 rounded-2xl">
                      <span className={item.color}>{item.icon}</span>
                      <div>
                        <span className={`font-black text-lg leading-none ${item.color}`}>{item.value}</span>
                        <span className="text-white/60 text-[10px] font-medium ml-1.5">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right illustration panel */}
              <div className="hidden lg:flex shrink-0">
                <div className="w-52 h-52 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl">
                  <svg width="160" height="160" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="100" cy="100" r="80" stroke="white" strokeWidth="1" strokeDasharray="6 4" className="opacity-15" />
                    {isDoctor ? (
                      <>
                        <path d="M40 145 L70 110 L100 125 L130 80 L165 88" stroke="#818CF8" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
                        <circle cx="165" cy="88" r="6" fill="#818CF8" />
                        <circle cx="130" cy="80" r="5" fill="#a5b4fc" />
                        <path d="M72 72 C72 52, 128 52, 128 72 C128 112, 100 132, 100 132 C100 132, 72 112, 72 72 Z" fill="white" fillOpacity="0.06" stroke="white" strokeWidth="2.5" />
                        <line x1="100" y1="80" x2="100" y2="112" stroke="white" strokeWidth="2.5" />
                        <line x1="86" y1="96" x2="114" y2="96" stroke="white" strokeWidth="2.5" />
                      </>
                    ) : (
                      <>
                        <rect x="48" y="112" width="28" height="38" rx="5" fill="white" fillOpacity="0.08" stroke="#5eead4" strokeWidth="2" />
                        <rect x="86" y="84" width="28" height="66" rx="5" fill="white" fillOpacity="0.1" stroke="#5eead4" strokeWidth="2" />
                        <rect x="124" y="58" width="28" height="92" rx="5" fill="white" fillOpacity="0.14" stroke="#5eead4" strokeWidth="2" />
                        <path d="M48 130 L86 100 L124 74" stroke="#5eead4" strokeWidth="2.5" strokeLinecap="round" strokeDasharray="4 3" />
                      </>
                    )}
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-center gap-3">
            <span className="text-rose-500 text-xl">⚠️</span>
            <p className="text-sm text-rose-700 dark:text-rose-300 font-medium">{error}</p>
          </div>
        )}

        {/* ── QUICK ACTIONS ──────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500 inline-block" />
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                label: 'Sessions',
                desc: 'Manage appointments',
                icon: <Calendar size={22} />,
                action: () => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/sessions`),
                iconBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
                hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
                activeDot: 'bg-blue-500',
              },
              {
                label: 'Patients',
                desc: 'View all cases',
                icon: <Users size={22} />,
                action: () => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients`),
                iconBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
                hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
                activeDot: 'bg-violet-500',
              },
              {
                label: 'Messages',
                desc: 'Chat with parents',
                icon: <MessageSquare size={22} />,
                action: () => navigate('/chat'),
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
                hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
                activeDot: 'bg-emerald-500',
              },
              {
                label: 'Notifications',
                desc: 'View alerts',
                icon: <Bell size={22} />,
                action: () => navigate('/notifications'),
                iconBg: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
                hoverBorder: 'hover:border-amber-300 dark:hover:border-amber-700',
                activeDot: 'bg-amber-500',
              },
            ].map((item, i) => (
              <button
                key={i}
                onClick={item.action}
                className={`group text-left p-4 md:p-5 standard-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${item.hoverBorder}`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110 ${item.iconBg}`}>
                  {item.icon}
                </div>
                <p className="font-bold text-stone-800 dark:text-slate-100 text-sm">{item.label}</p>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-0.5 font-medium">{item.desc}</p>
                <div className="mt-3 flex items-center text-xs font-bold text-stone-400 dark:text-slate-500 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                  Open <ChevronRight size={13} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── DASHBOARD STATS ─────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-emerald-500 to-teal-500 inline-block" />
              Dashboard Overview
            </h2>
          </div>
          <DashboardStats stats={stats} />
        </section>

        {/* ── PATIENT CAROUSEL ────────────────────────────────── */}
        {patients.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-black text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
                <span className="w-1 h-6 rounded-full bg-gradient-to-b from-blue-500 to-indigo-500 inline-block" />
                <Users className="text-blue-500" size={20} />
                Your Patients
              </h2>
              <Button
                size="sm"
                variant="outline"
                onClick={() => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients`)}
                className="cursor-pointer rounded-xl font-bold text-xs"
              >
                View All <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </div>
            <PatientCarousel
              patients={patients}
              isDoctor={isDoctor}
              onPatientClick={(patientId) => navigate(`/patients/${patientId}`)}
            />
          </section>
        )}

        {/* ── MAIN GRID ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* LEFT: Sessions & Requests */}
          <div className="lg:col-span-2 space-y-5">

            {/* Today's Sessions */}
            {todaySessions.length > 0 && (
              <Card className="border border-emerald-200/60 dark:border-emerald-800/20 shadow-md rounded-3xl p-6 bg-emerald-50/30 dark:bg-emerald-950/10">
                <h3 className="font-black text-lg text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                  <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                    <Activity className="text-emerald-600 dark:text-emerald-400" size={18} />
                  </div>
                  Today's Sessions
                  <Badge variant="success">{todaySessions.length} active</Badge>
                </h3>
                <div className="space-y-4">
                  {todaySessions.map((session) => {
                    const meetingUrl = session.zoomUrl || session.joinLink || '';
                    return (
                      <div key={session.id} className="p-5 standard-card border border-emerald-200/50 dark:border-emerald-800/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-300">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-3 flex-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <Heart size={14} className="text-rose-400" />
                              <span className="font-bold text-stone-900 dark:text-white text-base">
                                {session.reason || (session.specialistType === 'doctor'
                                  ? `${session.childName || 'Child'}'s Clinical Consultation`
                                  : `${session.childName || 'Child'}'s Therapy Session`)}
                              </span>
                              <Badge variant={meetingUrl ? 'success' : 'warning'}>
                                {meetingUrl ? '🟢 Zoom Ready' : '🔴 No Link'}
                              </Badge>
                            </div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                              {[
                                { label: 'Child', value: session.childName || 'Not Provided' },
                                { label: 'Parent', value: session.parentName || 'Not Provided' },
                                { label: 'Time', value: `${session.appointmentDate || 'Today'} · ${session.appointmentTime || 'Scheduled'}` },
                              ].map((info, i) => (
                                <div key={i} className="bg-stone-50 dark:bg-slate-800/60 rounded-xl px-3 py-2">
                                  <p className="text-[10px] font-bold uppercase tracking-wider text-stone-400 dark:text-slate-500 mb-0.5">{info.label}</p>
                                  <p className="font-semibold text-stone-800 dark:text-slate-200 truncate">{info.value}</p>
                                </div>
                              ))}
                            </div>
                            {session.childId && (
                              <button
                                onClick={() => navigate(`/patients/${session.childId}`)}
                                className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                              >
                                🔎 View Patient Profile <ChevronRight size={11} />
                              </button>
                            )}
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <Badge variant="success">Today</Badge>
                            <Button
                              size="sm"
                              onClick={() => handleJoinZoom(session)}
                              className="font-bold rounded-xl cursor-pointer flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-200"
                            >
                              <><Video size={14} /> {isDoctor ? 'Start Session' : 'Join Session'}</>
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Pending Booking Requests */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-6 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-lg text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center">
                  <Clock3 className="text-amber-500" size={18} />
                </div>
                Pending Requests
                {pendingBookings.length > 0 && (
                  <span className="ml-auto w-6 h-6 rounded-full bg-amber-500 text-white text-xs font-black flex items-center justify-center">
                    {pendingBookings.length}
                  </span>
                )}
              </h3>

              {pendingBookings.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={22} className="text-stone-400 dark:text-slate-500" />
                  </div>
                  <p className="text-stone-500 dark:text-slate-400 text-sm font-medium">All clear — no pending requests.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingBookings.map((booking) => (
                    <div key={booking.id} className="p-4 bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/50 dark:border-amber-800/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div className="space-y-1.5">
                        <p className="font-bold text-stone-900 dark:text-white text-sm flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                          Appointment Request
                        </p>
                        <p className="text-xs text-stone-500 dark:text-slate-400 font-medium">
                          {booking.appointmentDate ? new Date(booking.appointmentDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'TBD'} at {booking.appointmentTime || 'TBD'}
                        </p>
                        {booking.reason && (
                          <p className="text-xs text-stone-600 dark:text-slate-400 italic standard-card px-2.5 py-1.5">
                            "{booking.reason}"
                          </p>
                        )}
                        {booking.childId && (
                          <button
                            onClick={() => navigate(`/patients/${booking.childId}`)}
                            className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                          >
                            🔎 Review Patient Profile <ChevronRight size={11} />
                          </button>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          disabled={updatingId === booking?.id}
                          onClick={(e) => handleUpdateStatus(e, booking, 'confirmed')}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl cursor-pointer shadow-sm"
                        >
                          {updatingId === booking?.id ? <Loader2 size={13} className="mr-1 animate-spin" /> : <CheckCircle2 size={13} className="mr-1" />}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updatingId === booking?.id}
                          onClick={(e) => handleUpdateStatus(e, booking, 'rejected')}
                          className="rounded-xl cursor-pointer font-bold"
                        >
                          Reject
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Upcoming Confirmed Sessions */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-6 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-lg text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                  <Calendar className="text-blue-500" size={18} />
                </div>
                Upcoming Sessions
                {confirmedSessions.length > 0 && (
                  <Badge variant="secondary">{confirmedSessions.length} scheduled</Badge>
                )}
              </h3>

              {confirmedSessions.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-2xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <Calendar size={22} className="text-stone-400 dark:text-slate-500" />
                  </div>
                  <p className="text-stone-500 dark:text-slate-400 text-sm font-medium">No confirmed sessions scheduled.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {confirmedSessions.slice(0, 5).map((session) => {
                    const meetingUrl = session.zoomUrl || session.joinLink || '';
                    return (
                      <div key={session.id} className="p-4 standard-card hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div className="space-y-2 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-bold text-stone-900 dark:text-white text-sm">
                              {session.reason || (session.specialistType === 'doctor'
                                ? `${session.childName || 'Child'}'s Clinical Consultation`
                                : `${session.childName || 'Child'}'s Therapy Session`)}
                            </span>
                            <Badge variant={meetingUrl ? 'success' : 'warning'}>
                              {meetingUrl ? '🟢 Zoom Ready' : '🔴 No Link'}
                            </Badge>
                          </div>
                          <div className="flex flex-wrap gap-3 text-xs text-stone-500 dark:text-slate-400">
                            <span className="flex items-center gap-1 font-medium">
                              <Users size={11} /> {session.childName || 'Child'}
                            </span>
                            <span className="flex items-center gap-1 font-medium">
                              <Calendar size={11} /> {session.appointmentDate || 'TBD'} · {session.appointmentTime || 'TBD'}
                            </span>
                          </div>
                          {session.childId && (
                            <button
                              onClick={() => navigate(`/patients/${session.childId}`)}
                              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                            >
                              🔎 View Charts <ChevronRight size={11} />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <Badge variant="success">Confirmed</Badge>
                          <Button
                            size="sm"
                            onClick={() => handleJoinZoom(session)}
                            className="font-bold rounded-xl cursor-pointer flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <><Video size={14} /> {isDoctor ? 'Start' : 'Join'}</>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </Card>
          </div>

          {/* RIGHT: Cases + Notifications + Notes */}
          <div className="space-y-5 lg:col-span-1">

            {/* Assigned Cases */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <div className="flex items-center justify-between mb-5">
                <h3 className="font-black text-base text-stone-800 dark:text-white flex items-center gap-2 tracking-tight">
                  <Stethoscope className="text-indigo-500" size={17} />
                  Assigned Cases
                </h3>
                <Badge variant="secondary">{displayChildren.length} active</Badge>
              </div>

              <div className="space-y-2.5">
                {displayChildren.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-stone-400 dark:text-slate-500 text-xs font-medium">No assigned cases yet.</p>
                  </div>
                ) : (
                  displayChildren.map((c) => (
                    <div key={c.id} className="p-3 bg-stone-50 dark:bg-slate-900/40 border border-stone-100 dark:border-white/5 rounded-xl">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-stone-900 dark:text-white text-sm truncate">{c.name}</p>
                          {(() => {
                            const agePart = c.age ? `Age: ${c.age} yrs` : '';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
                            const genderVal = (c as any).gender;
                            const isUnknown = !genderVal || genderVal.toString().toLowerCase() === 'unknown' || genderVal === '';
                            const genderPart = !isUnknown ? genderVal : '';
                            const info = [agePart, genderPart].filter(Boolean).join(' · ');
                            return info ? (
                              <p className="text-stone-400 dark:text-slate-500 text-[11px] mt-0.5 capitalize">{info}</p>
                            ) : null;
                          })()}
                          {isDoctor && !!(c as Record<string, unknown>).assignedTherapist && (c as Record<string, unknown>).assignedTherapist !== 'No Therapist Assigned' && (c as Record<string, unknown>).assignedTherapist !== 'Unknown' && (
                            <p className="text-violet-500 text-[11px] mt-0.5 font-medium">🧑‍🏫 {(c as Record<string, unknown>).assignedTherapist as string}</p>
                          )}
                          {!isDoctor && !!(c as Record<string, unknown>).assignedDoctor && (c as Record<string, unknown>).assignedDoctor !== 'No Doctor Assigned' && (c as Record<string, unknown>).assignedDoctor !== 'Unknown' && (
                            <p className="text-blue-500 text-[11px] mt-0.5 font-medium">👨‍⚕️ {(c as Record<string, unknown>).assignedDoctor as string}</p>
                          )}
                          {(c as Record<string, unknown>).status && (c as Record<string, unknown>).status !== 'Unknown' && (
                            <span className={`inline-block mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              (c as Record<string, unknown>).status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : (c as Record<string, unknown>).status === 'in-treatment'
                                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            }`}>
                              {(c as Record<string, unknown>).status === 'in-treatment' ? 'In Treatment' : (c as Record<string, unknown>).status as string}
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => navigate(`/patients/${c.id}`)}
                          className="text-indigo-600 dark:text-indigo-400 text-xs font-bold hover:underline cursor-pointer shrink-0 flex items-center gap-0.5"
                        >
                          Open <ChevronRight size={11} />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-white/5">
                <Button
                  size="sm"
                  fullWidth
                  variant="outline"
                  onClick={() => navigate(`/${isDoctor ? 'doctor' : 'therapist'}/patients`)}
                  className="rounded-xl cursor-pointer font-bold"
                >
                  <ClipboardList size={13} className="mr-1.5" /> View All Cases
                </Button>
              </div>
            </Card>

            {/* Action Alerts / Notifications */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-base text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <Bell className="text-amber-500" size={17} />
                Action Alerts
                {totalUnreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 rounded-full bg-amber-500 text-white text-[9px] font-black flex items-center justify-center">
                    {totalUnreadCount}
                  </span>
                )}
              </h3>

              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-stone-400 dark:text-slate-500 text-xs font-medium">No alerts currently.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed ${
                        n.isRead
                          ? 'bg-stone-50/80 dark:bg-slate-900/40 border-stone-100 dark:border-white/5 text-stone-500 dark:text-slate-400'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/30 text-stone-800 dark:text-slate-200 font-medium'
                      }`}
                    >
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block mr-1.5 mb-0.5" />}
                      <p className="font-bold text-stone-900 dark:text-white mb-0.5 inline">{n.title}</p>
                      <p className="text-stone-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-stone-100 dark:border-white/5">
                <Button
                  size="sm"
                  fullWidth
                  variant="outline"
                  onClick={() => navigate('/notifications')}
                  className="rounded-xl cursor-pointer font-bold"
                >
                  <Bell size={13} className="mr-1.5" /> All Notifications
                </Button>
              </div>
            </Card>

            {/* My Recent Notes */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-base text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <ClipboardList className="text-blue-500" size={17} />
                My Recent Notes
              </h3>

              <div className="space-y-2.5">
                {myNotes.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-stone-400 dark:text-slate-500 text-xs font-medium">No notes found.</p>
                  </div>
                ) : (
                  myNotes.slice(0, 5).map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      onUpdate={(updated) => setMyNotes(myNotes.map(n => n.id === updated.id ? updated : n))}
                      onDelete={(deletedId) => setMyNotes(myNotes.filter(n => n.id !== deletedId))}
                    />
                  ))
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
