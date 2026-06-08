import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/useAuth';
import { childrenService, type Child } from '../../services/api/children';
import { treatmentPlansService, type TreatmentPlan } from '../../services/api/treatmentPlans';
import { bookingService } from '../../services/api/bookings';
import { notesService, type Note } from '../../services/api/notes';
import { notificationService, type Notification } from '../../services/api/notifications';
import { formatDateTime } from '../../utils/dateUtils';
import {
  Loader2, Plus, FileText, Activity, MessageSquare, Calendar,
  ClipboardCheck, Bell, ChevronRight, Sparkles, Heart, Star,
  BookOpen, Users, ShieldCheck
} from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';

export const ParentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [children, setChildren] = useState<Child[]>([]);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [upcomingSessions, setUpcomingSessions] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const childList = await childrenService.getMyChildren().catch(() => {
        const latestId = localStorage.getItem('latestChildId');
        const latestName = localStorage.getItem('latestChildName');
        if (latestId && latestName) {
          return [{
            id: latestId,
            name: latestName,
            parentId: '',
            age: 0,
            gender: 'Unknown',
            dateOfBirth: '',
            profileImage: '',
            medicalHistory: '',
            familyAutismHistory: false,
            jaundiceHistory: false,
            notes: '',
            createdAt: new Date().toISOString(),
          }] as Child[];
        }
        return [] as Child[];
      });

      const [plansArrays, noteList, notifList, upcoming] = await Promise.all([
        Promise.all(childList.map(c => treatmentPlansService.getChildPlans(c.id).catch(() => []))),
        notesService.getMyNotes().catch(() => []),
        notificationService.getNotifications().catch(() => []),
        bookingService.getUpcomingBookings().catch(() => []),
      ]);

      const planList = plansArrays.flat();

      setChildren(childList);
      setPlans(planList);
      setNotes(noteList);
      setNotifications(notifList.slice(0, 4));
      setUpcomingSessions(upcoming.length);
    } catch (err) {
      console.error('Error fetching parent dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchDashboard();
  }, []);

  const handleStartScreening = () => {
    const latestChildId = localStorage.getItem('latestChildId') || (children.length > 0 ? children[0].id : null);
    if (latestChildId) {
      navigate(`${ROUTES.PARENT_SCREENING}?childId=${latestChildId}`);
    } else {
      navigate(ROUTES.PARENT_ADD_CHILD);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    const timeGreet = hour < 12 ? 'Good Morning' : hour < 17 ? 'Good Afternoon' : 'Good Evening';
    const firstName = user?.name?.split(' ')[0] || user?.name || 'Parent';
    return `${timeGreet}, ${firstName}!`;
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-5">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-rose-400 to-purple-500 flex items-center justify-center shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
          <div className="text-center">
            <p className="text-stone-700 dark:text-slate-300 font-semibold text-lg">Setting up your dashboard</p>
            <p className="text-stone-400 dark:text-slate-500 text-sm mt-1 animate-pulse">Loading your family's care plan...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8 pb-16 animate-fade-in">

        {/* ── HERO BANNER ─────────────────────────────────────── */}
        <div className="relative overflow-hidden rounded-3xl shadow-2xl">
          {/* Layered gradient background */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-900 via-purple-950 to-indigo-900" />
          {/* Decorative blobs */}
          <div className="absolute top-0 right-0 w-80 h-80 rounded-full opacity-25 blur-3xl -translate-y-1/3 translate-x-1/3 bg-rose-400" />
          <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl translate-y-1/3 -translate-x-1/4 bg-purple-500" />
          <div className="absolute top-1/2 left-1/2 w-48 h-48 rounded-full opacity-10 blur-3xl -translate-x-1/2 -translate-y-1/2 bg-indigo-400" />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">

              {/* Left Content */}
              <div className="space-y-5 max-w-xl">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-bold tracking-widest uppercase px-3 py-1.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30">
                    💜 Parent Dashboard
                  </span>
                  <span className="text-xs text-white/50 flex items-center gap-1">
                    <Sparkles size={11} className="text-yellow-400" />
                    {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                  </span>
                </div>

                <div>
                  <h1 className="text-3xl md:text-4xl lg:text-5xl font-black tracking-tight leading-tight text-white">
                    {getGreeting()} 👋
                  </h1>
                  <p className="text-base md:text-lg text-white/70 leading-relaxed mt-3 font-medium">
                    Track your children's development, review screening results, and coordinate with specialists.
                  </p>
                </div>

                {/* Quick at-a-glance stats */}
                <div className="flex flex-wrap gap-3 pt-1">
                  {[
                    { icon: <Users size={13} />, label: 'Children', value: children.length, color: 'text-rose-300' },
                    { icon: <FileText size={13} />, label: 'Care Plans', value: plans.length, color: 'text-purple-300' },
                    { icon: <Calendar size={13} />, label: 'Upcoming', value: upcomingSessions, color: 'text-indigo-300' },
                    { icon: <Bell size={13} />, label: 'Alerts', value: unreadCount, color: 'text-amber-300' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 px-3.5 py-2 rounded-2xl">
                      <span className={item.color}>{item.icon}</span>
                      <div>
                        <span className={`font-black text-base leading-none ${item.color}`}>{item.value}</span>
                        <span className="text-white/55 text-[10px] font-medium ml-1.5">{item.label}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Decorative right panel */}
              <div className="hidden lg:flex shrink-0">
                <div className="w-48 h-48 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl flex items-center justify-center shadow-2xl overflow-hidden relative">
                  {/* Animated heart + stars pattern */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <svg width="160" height="160" viewBox="0 0 200 200" fill="none">
                      <circle cx="100" cy="100" r="75" stroke="white" strokeWidth="1" strokeDasharray="5 4" opacity="0.15" />
                      {/* Heart shape */}
                      <path d="M100 140 C100 140, 55 110, 55 78 C55 62 67 52 78 52 C88 52 96 59 100 65 C104 59 112 52 122 52 C133 52 145 62 145 78 C145 110 100 140 100 140Z"
                        fill="#fb7185" fillOpacity="0.2" stroke="#fb7185" strokeWidth="2.5" strokeLinejoin="round" />
                      {/* Stars */}
                      <circle cx="60" cy="60" r="3" fill="#fbbf24" opacity="0.7" />
                      <circle cx="148" cy="68" r="2.5" fill="#a78bfa" opacity="0.6" />
                      <circle cx="70" cy="145" r="2" fill="#6ee7b7" opacity="0.5" />
                      <circle cx="138" cy="140" r="2.5" fill="#93c5fd" opacity="0.6" />
                      <circle cx="100" cy="40" r="2" fill="#fda4af" opacity="0.7" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── STATS GRID ───────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-rose-500 to-purple-500 inline-block" />
              At a Glance
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              {
                label: 'Registered Children',
                value: children.length,
                icon: <Users size={20} />,
                iconStyle: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
                blobStyle: 'bg-blue-400',
                description: 'Enrolled profiles',
              },
              {
                label: 'Active Care Plans',
                value: plans.length,
                icon: <FileText size={20} />,
                iconStyle: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
                blobStyle: 'bg-emerald-400',
                description: 'Ongoing treatments',
              },
              {
                label: 'Consultations',
                value: upcomingSessions,
                icon: <Calendar size={20} />,
                iconStyle: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
                blobStyle: 'bg-amber-400',
                description: 'Upcoming sessions',
              },
              {
                label: 'Unread Alerts',
                value: unreadCount,
                icon: <Bell size={20} />,
                iconStyle: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
                blobStyle: 'bg-rose-400',
                description: 'Action required',
              },
            ].map((stat, idx) => (
              <Card
                key={idx}
                className="relative p-5 border border-stone-200/50 dark:border-white/8 standard-card overflow-hidden hover:shadow-xl hover:-translate-y-1.5 transition-all duration-300 group cursor-default"
              >
                <div className={`absolute -right-8 -bottom-8 w-28 h-28 rounded-full opacity-15 group-hover:opacity-30 group-hover:scale-150 transition-all duration-700 blur-3xl ${stat.blobStyle}`} />
                <div className="relative z-10 flex flex-col gap-3">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shadow-sm ${stat.iconStyle} transition-transform duration-300 group-hover:scale-110`}>
                    {stat.icon}
                  </div>
                  <div>
                    <p className="text-3xl font-black text-stone-800 dark:text-white tracking-tight leading-none">{stat.value}</p>
                    <p className="text-[10px] text-stone-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-1.5">{stat.label}</p>
                    <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-0.5 font-medium">{stat.description}</p>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </section>

        {/* ── QUICK ACTIONS ─────────────────────────────────────── */}
        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-black text-stone-800 dark:text-white tracking-tight flex items-center gap-2">
              <span className="w-1 h-6 rounded-full bg-gradient-to-b from-indigo-500 to-blue-500 inline-block" />
              Quick Actions
            </h2>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
            {[
              {
                title: 'Add Child Profile',
                desc: 'Register a new child in AutiCare',
                action: () => navigate(ROUTES.PARENT_ADD_CHILD),
                icon: <Plus size={22} />,
                iconBg: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
                hoverBorder: 'hover:border-indigo-300 dark:hover:border-indigo-700',
                hoverText: 'text-indigo-600 dark:text-indigo-400',
              },
              {
                title: 'AI Screening',
                desc: 'Developmental assessment tool',
                action: handleStartScreening,
                icon: <ClipboardCheck size={22} />,
                iconBg: 'bg-violet-50 dark:bg-violet-950/30 text-violet-600 dark:text-violet-400',
                hoverBorder: 'hover:border-violet-300 dark:hover:border-violet-700',
                hoverText: 'text-violet-600 dark:text-violet-400',
              },
              {
                title: 'Book a Doctor',
                desc: 'Schedule specialist consulting',
                action: () => navigate(ROUTES.PARENT_DOCTORS),
                icon: <ShieldCheck size={22} />,
                iconBg: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400',
                hoverBorder: 'hover:border-blue-300 dark:hover:border-blue-700',
                hoverText: 'text-blue-600 dark:text-blue-400',
              },
              {
                title: 'Book a Therapist',
                desc: 'Coordinate therapy programs',
                action: () => navigate(ROUTES.PARENT_THERAPISTS),
                icon: <Activity size={22} />,
                iconBg: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
                hoverBorder: 'hover:border-emerald-300 dark:hover:border-emerald-700',
                hoverText: 'text-emerald-600 dark:text-emerald-400',
              },
            ].map((act, idx) => (
              <button
                key={idx}
                onClick={act.action}
                className={`group text-left p-5 standard-card hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer ${act.hoverBorder} flex flex-col h-full`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-3 shadow-sm transition-transform duration-300 group-hover:scale-110 ${act.iconBg}`}>
                  {act.icon}
                </div>
                <h4 className="font-bold text-stone-800 dark:text-white text-sm leading-snug">{act.title}</h4>
                <p className="text-[11px] text-stone-500 dark:text-slate-400 mt-1.5 leading-relaxed flex-grow font-medium">{act.desc}</p>
                <div className={`mt-3 text-[11px] font-bold flex items-center opacity-0 group-hover:opacity-100 transition-opacity ${act.hoverText}`}>
                  Get Started <ChevronRight size={12} className="ml-0.5 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </button>
            ))}
          </div>
        </section>

        {/* ── MAIN CONTENT GRID ────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">

          {/* Column 1 (Wide): Children + Treatment Plans */}
          <div className="lg:col-span-2 space-y-5">

            {/* Children Profiles */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-6 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-black text-lg text-stone-800 dark:text-white flex items-center gap-2 tracking-tight">
                  <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                    <Heart className="text-rose-500" size={17} />
                  </div>
                  My Children
                </h3>
                <Button
                  size="sm"
                  onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)}
                  className="rounded-xl flex items-center gap-1.5 font-bold"
                >
                  <Plus size={14} /> Add New
                </Button>
              </div>

              {children.length === 0 ? (
                <div className="text-center py-10 space-y-3">
                  {localStorage.getItem('latestChildId') ? (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto">
                        <Users size={24} className="text-stone-400" />
                      </div>
                      <p className="text-stone-500 text-sm font-medium">⚠️ Could not load child data from server.</p>
                      <p className="text-stone-400 text-xs">Child ID: {localStorage.getItem('latestChildId')} · {localStorage.getItem('latestChildName') || 'Registered'}</p>
                      <Button size="sm" onClick={() => window.location.reload()} className="rounded-xl">Retry Loading</Button>
                    </>
                  ) : (
                    <>
                      <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto">
                        <Plus size={24} className="text-stone-400" />
                      </div>
                      <p className="text-stone-500 text-sm font-medium">No children registered yet.</p>
                      <Button size="sm" onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)} className="rounded-xl">Add First Child</Button>
                    </>
                  )}
                </div>
              ) : (
                <div className="grid gap-3 sm:grid-cols-2">
                  {children.map((c) => (
                    <div
                      key={c.id}
                      className="p-4 bg-stone-50 dark:bg-slate-900/40 rounded-2xl border border-stone-100 dark:border-white/5 flex justify-between items-center gap-4 hover:border-indigo-200 dark:hover:border-indigo-800/40 hover:shadow-sm transition-all duration-300"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar name={c.name} size="md" image={c.profileImage} />
                        <div>
                          <p className="font-bold text-stone-900 dark:text-white text-sm">{c.name}</p>
                          <p className="text-[11px] text-stone-400 dark:text-slate-500 mt-0.5 capitalize font-medium">
                            {[
                              c.age ? `Age: ${c.age} yrs` : null,
                              c.gender && c.gender !== 'Unknown' ? c.gender : null,
                            ].filter(Boolean).join(' · ') || 'No details yet'}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button
                          size="sm"
                          onClick={() => navigate(`${ROUTES.PARENT_SCREENING}?childId=${c.id}`)}
                          className="rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold cursor-pointer text-[10px] py-1 px-2.5 shadow-sm"
                        >
                          Screen
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => navigate(`/treatment-plan/${c.id}`)}
                          className="rounded-lg cursor-pointer text-[10px] py-1 px-2.5 font-bold"
                        >
                          Care Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Treatment Plans */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-6 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-lg text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 flex items-center justify-center">
                  <FileText className="text-emerald-600" size={17} />
                </div>
                Active Treatment Plans
                {plans.length > 0 && <Badge variant="success">{plans.length}</Badge>}
              </h3>

              {plans.length === 0 ? (
                <div className="text-center py-10">
                  <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-3">
                    <BookOpen size={24} className="text-stone-400" />
                  </div>
                  <p className="text-stone-500 text-sm font-medium">No active treatment plans yet.</p>
                  <p className="text-stone-400 text-xs mt-1">Book a specialist to get started.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {plans.map((p) => (
                    <div
                      key={p.id}
                      className="p-4 bg-emerald-50/40 dark:bg-emerald-950/10 border border-emerald-200/50 dark:border-emerald-800/20 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-emerald-300 dark:hover:border-emerald-700/30 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-stone-900 dark:text-white text-sm">{p.title}</p>
                          <Badge variant="success">{p.status}</Badge>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-1 line-clamp-2 font-medium">{p.description}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => navigate(`/treatment-plan/${p.childId}`)}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shrink-0 cursor-pointer font-bold shadow-sm"
                      >
                        Open Pathway <ChevronRight size={13} className="ml-1" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Column 2 (Narrow): Notifications + Notes */}
          <div className="space-y-5 lg:col-span-1">

            {/* Live Notifications Feed */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-black text-base text-stone-800 dark:text-white flex items-center gap-2 tracking-tight">
                  <Bell className="text-amber-500" size={17} />
                  Care Notifications
                  {unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-rose-500 text-white text-[9px] font-black flex items-center justify-center">
                      {unreadCount}
                    </span>
                  )}
                </h3>
                <button
                  onClick={() => navigate(ROUTES.NOTIFICATIONS)}
                  className="text-xs text-indigo-600 dark:text-indigo-400 font-bold hover:underline flex items-center gap-0.5"
                >
                  See All <ChevronRight size={12} />
                </button>
              </div>

              <div className="space-y-2.5">
                {notifications.length === 0 ? (
                  <div className="text-center py-6">
                    <div className="w-10 h-10 rounded-xl bg-stone-100 dark:bg-slate-700/50 flex items-center justify-center mx-auto mb-2">
                      <Bell size={18} className="text-stone-300 dark:text-slate-600" />
                    </div>
                    <p className="text-stone-400 dark:text-slate-500 text-xs font-medium">No care alerts yet.</p>
                  </div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`p-3 rounded-xl border text-xs leading-relaxed transition-colors ${
                        n.isRead
                          ? 'bg-stone-50/80 dark:bg-slate-900/40 border-stone-100 dark:border-white/5 text-stone-500 dark:text-slate-400'
                          : 'bg-indigo-50/70 dark:bg-indigo-950/20 border-indigo-100 dark:border-indigo-800/30 font-medium'
                      }`}
                    >
                      {!n.isRead && <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 inline-block mr-1.5 mb-0.5 animate-pulse" />}
                      <p className="font-bold text-stone-900 dark:text-white mb-0.5 inline">{n.title}</p>
                      <p className="text-stone-500 dark:text-slate-400 mt-0.5">{n.message}</p>
                      <p className="text-[10px] text-stone-400 dark:text-slate-500 mt-1 font-medium">{formatDateTime(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Specialist Tips / Care Badge */}
            <div className="p-5 rounded-3xl border border-purple-200/50 dark:border-purple-800/20 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-950/20 dark:to-indigo-950/10">
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                  <Star className="text-purple-500" size={17} />
                </div>
                <div>
                  <p className="font-black text-sm text-stone-800 dark:text-white">Care Tip</p>
                  <p className="text-[11px] text-stone-500 dark:text-slate-400 font-medium mt-0.5">From your specialist team</p>
                </div>
              </div>
              <p className="text-xs text-stone-700 dark:text-slate-300 leading-relaxed font-medium">
                "Early intervention and consistent therapy sessions significantly improve developmental outcomes.
                Stay engaged with your child's progress and communicate openly with their care team."
              </p>
            </div>

            {/* Recent Care Notes */}
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="font-black text-base text-stone-800 dark:text-white mb-5 flex items-center gap-2 tracking-tight">
                <MessageSquare className="text-violet-500" size={17} />
                Recent Notes & Guidelines
              </h3>

              <div className="space-y-3">
                {notes.length === 0 ? (
                  <div className="text-center py-6">
                    <p className="text-stone-400 dark:text-slate-500 text-xs font-medium">No specialist notes yet.</p>
                  </div>
                ) : (
                  notes.slice(0, 3).map((note) => (
                    <div
                      key={note.id}
                      className="p-3.5 bg-stone-50 dark:bg-slate-900/50 rounded-xl border border-stone-100 dark:border-white/5 text-xs"
                    >
                      <p className="font-bold text-stone-900 dark:text-white mb-1.5 flex items-center gap-1.5">
                        <BookOpen size={11} className="text-violet-400" />
                        {note.title || 'Session Note'}
                      </p>
                      <p className="text-stone-600 dark:text-slate-300 leading-relaxed line-clamp-2 italic">"{note.content}"</p>
                      <p className="text-[10px] text-stone-400 dark:text-slate-500 text-right mt-2 font-medium">
                        {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
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
