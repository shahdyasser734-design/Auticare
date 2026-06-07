import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/useAuth';
import { dashboardService, type DashboardParentData } from '../../services/api/dashboard';
import { childrenService, type Child } from '../../services/api/children';
import { treatmentPlansService, type TreatmentPlan } from '../../services/api/treatmentPlans';
import { notesService, type Note } from '../../services/api/notes';
import { notificationService, type Notification } from '../../services/api/notifications';
import { formatDateTime } from '../../utils/dateUtils';
import { Loader2, Plus, FileText, Activity, MessageSquare, Calendar, ClipboardCheck, Bell, ChevronRight } from 'lucide-react';
import { Avatar } from '../../components/common/Avatar';

export const ParentHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardParentData | null>(null);
  const [children, setChildren] = useState<Child[]>([]);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboard = async () => {
    try {
      setLoading(true);
      const childList = await childrenService.getChildren().catch(() => []);
      
      const [db, plansArrays, noteList, notifList] = await Promise.all([
        dashboardService.getParentDashboard().catch(() => null),
        Promise.all(childList.map(c => treatmentPlansService.getChildPlans(c.id).catch(() => []))),
        notesService.getMyNotes().catch(() => []),
        notificationService.getNotifications().catch(() => []),
      ]);

      const planList = plansArrays.flat();

      setDashboardData(db);
      setChildren(childList);
      setPlans(planList);
      setNotes(noteList);
      setNotifications(notifList.slice(0, 4)); // Show recent 4 notifications
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

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-slate-500 animate-pulse font-medium">Configuring parent dashboard...</p>
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
            <Badge variant="secondary">Parent Dashboard</Badge>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight leading-none">Welcome Back, {user?.name?.split(' ')[0] || user?.name || 'Parent'}! 👋</h1>
            <p className="text-lg opacity-90 leading-relaxed font-medium">
              Monitor your children's development, review screening results, coordinate with clinical specialists, and access specialized treatment plans.
            </p>
          </div>
          <div className="absolute -right-16 -top-16 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute bottom-0 right-10 w-56 h-56 bg-primary-400/20 rounded-full translate-y-1/3 blur-xl" />
        </div>

        {/* Quick Stats Banner */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Registered Children', value: children.length, icon: '👶', color: 'bg-blue-50 text-blue-600 dark:bg-blue-950/20' },
            { label: 'Active Care Plans', value: plans.length, icon: '📋', color: 'bg-green-50 text-green-600 dark:bg-green-950/20' },
            { label: 'Consultations', value: dashboardData?.upcomingSessions ?? 0, icon: '👨‍⚕️', color: 'bg-orange-50 text-orange-600 dark:bg-orange-950/20' },
            { label: 'Unread Alerts', value: notifications.filter(n => !n.isRead).length, icon: '🔔', color: 'bg-red-50 text-red-600 dark:bg-red-950/20' },
          ].map((stat, idx) => (
            <Card key={idx} className="p-5 border border-slate-200 dark:border-white/10 shadow-sm flex items-center justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs text-slate-500 font-bold uppercase tracking-wider">{stat.label}</p>
                <p className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</p>
              </div>
              <span className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${stat.color}`}>{stat.icon}</span>
            </Card>
          ))}
        </div>

        {/* Quick Actions Panel */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { title: 'Add Child Profile', desc: 'Register a new child in AutiCare', action: () => navigate(ROUTES.PARENT_ADD_CHILD), icon: <Plus />, variant: 'primary' },
            { title: 'AI Autism Screening', desc: 'Perform developmental assessment', action: handleStartScreening, icon: <ClipboardCheck />, variant: 'secondary' },
            { title: 'Book Doctor', desc: 'Schedule specialist consulting', action: () => navigate(ROUTES.PARENT_DOCTORS), icon: <Calendar />, variant: 'outline' },
            { title: 'Book Therapist', desc: 'Coordinate therapy programs', action: () => navigate(ROUTES.PARENT_THERAPISTS), icon: <Activity />, variant: 'outline' },
          ].map((act, idx) => (
            <Card key={idx} className="border border-slate-150 p-5 shadow-sm hover:shadow-md transition flex flex-col justify-between h-40">
              <div>
                <h4 className="font-bold text-slate-900 dark:text-white text-base flex items-center gap-2">
                  <span className="text-primary-600">{act.icon}</span>
                  {act.title}
                </h4>
                <p className="text-xs text-slate-500 mt-2">{act.desc}</p>
              </div>
              <Button size="sm" onClick={act.action} fullWidth className="rounded-xl cursor-pointer">
                Select Action
              </Button>
            </Card>
          ))}
        </div>

        {/* Dashboard Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Column 1: Children list & Active Treatment Plans */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Children Profiles */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-xl text-slate-900 dark:text-white flex items-center gap-2">
                  <span>👶</span> My Children
                </h3>
                <Button size="sm" onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)} className="rounded-xl flex items-center gap-1">
                  <Plus size={14} /> Add New
                </Button>
              </div>

              {children.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm mb-4">No children added yet.</p>
                  <Button size="sm" onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)}>Add First Child</Button>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2">
                  {children.map((c) => (
                    <div key={c.id} className="p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 flex justify-between items-center gap-4">
                      <div className="flex items-center gap-4">
                        <Avatar name={c.name} size="md" image={c.profileImage} />
                        <div>
                          <p className="font-bold text-slate-950 dark:text-white">{c.name}</p>
                          <p className="text-xs text-slate-500 mt-1 capitalize">Age: {c.age ?? 'N/A'} yrs · {c.gender}</p>
                        </div>
                      </div>
                      <div className="flex flex-col gap-1.5 shrink-0">
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`${ROUTES.PARENT_SCREENING}?childId=${c.id}`)}
                          className="rounded-lg bg-orange-600 hover:bg-orange-700 text-white font-bold cursor-pointer text-[10px] py-1 px-2.5"
                        >
                          Screen
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => navigate(`/treatment-plan/${c.id}`)}
                          className="rounded-lg cursor-pointer text-[10px] py-1 px-2.5"
                        >
                          View Plan
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Active Treatment Plans */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <h3 className="font-bold text-xl text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <FileText className="text-green-500" /> Active Treatment Plans
              </h3>

              {plans.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-slate-500 text-sm">No active treatment plans designated.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {plans.map((p) => (
                    <div key={p.id} className="p-5 bg-green-50/20 dark:bg-green-950/10 border border-green-200/40 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-bold text-slate-950 dark:text-white text-base">{p.title}</p>
                          <Badge variant="success">{p.status}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 truncate max-w-md">{p.description}</p>
                      </div>
                      <Button 
                        size="sm" 
                        onClick={() => navigate(`/treatment-plan/${p.childId}`)}
                        className="bg-green-600 hover:bg-green-700 text-white rounded-xl shrink-0 cursor-pointer"
                      >
                        Open Pathway
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* Column 2: Notifications, Consultations, and Professional notes */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Live Notifications Feed */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
                  <Bell className="text-primary-600" size={18} /> Care Notifications
                </h3>
                <button onClick={() => navigate(ROUTES.NOTIFICATIONS)} className="text-xs text-primary-600 font-bold hover:underline flex items-center gap-0.5">
                  See All <ChevronRight size={14} />
                </button>
              </div>

              <div className="space-y-3">
                {notifications.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No care alerts yet.</p>
                ) : (
                  notifications.map((n) => (
                    <div key={n.id} className={`p-3 rounded-2xl border text-xs leading-relaxed ${
                      n.isRead 
                        ? 'bg-slate-50/50 border-slate-100 text-slate-600' 
                        : 'bg-primary-50/40 border-primary-100 text-slate-800 font-medium'
                    }`}>
                      <p className="font-bold text-slate-900 dark:text-white mb-0.5">{n.title}</p>
                      <p className="text-slate-600 dark:text-slate-400">{n.message}</p>
                      <p className="text-[10px] text-slate-400 mt-1">{formatDateTime(n.createdAt)}</p>
                    </div>
                  ))
                )}
              </div>
            </Card>

            {/* Recent Care Notes */}
            <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
              <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-6 flex items-center gap-2">
                <MessageSquare className="text-purple-500" size={18} /> Recent Notes & Guidelines
              </h3>

              <div className="space-y-4">
                {notes.length === 0 ? (
                  <p className="text-slate-500 text-xs py-4 text-center">No specialist notes added yet.</p>
                ) : (
                  notes.slice(0, 3).map((note) => (
                    <div key={note.id} className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-2xl border border-slate-100 text-xs">
                      <p className="font-bold text-slate-900 dark:text-white mb-1">📝 {note.title || 'Session Note'}</p>
                      <p className="text-slate-700 dark:text-slate-300 leading-relaxed italic">"{note.content}"</p>
                      <p className="text-[10px] text-slate-400 text-right mt-2">{new Date(note.createdAt).toLocaleDateString()}</p>
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
