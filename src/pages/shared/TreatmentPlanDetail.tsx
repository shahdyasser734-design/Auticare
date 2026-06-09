import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/useAuth';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { treatmentPlansService } from '../../services/api/treatmentPlansService';
import { sessionsService } from '../../services/api/sessionsService';
import { notesService } from '../../services/api/notesService';
import { childrenService } from '../../services/api/children';
import { NoteCard } from '../../components/notes/NoteCard';
import type { TreatmentPlan, TherapySession } from '../../types';
import type { Child } from '../../services/api/children';
import { Calendar, Target, CheckCircle, MessageSquare, User, Activity, Heart, FileText } from 'lucide-react';

// Calculate age from DOB if age field is missing
const calcAge = (child: Child): number | null => {
  if (child.age && child.age > 0) return child.age;
  if (!child.dateOfBirth) return null;
  const dob = new Date(child.dateOfBirth);
  if (isNaN(dob.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - dob.getFullYear();
  if (now < new Date(now.getFullYear(), dob.getMonth(), dob.getDate())) age--;
  return age > 0 ? age : null;
};

export const TreatmentPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const { activeChildId } = useAuth();
  const navigate = useNavigate();
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [child, setChild] = useState<Child | null>(null);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'notes'>('overview');

  useEffect(() => {
    // If global activeChildId changes, sync the URL
    if (activeChildId && planId && activeChildId !== planId) {
      navigate(`/treatment-plan/${activeChildId}`, { replace: true });
      return;
    }

    const loadData = async () => {
      const targetId = activeChildId || planId;
      if (!targetId) return;
      try {
        setLoading(true);
        const planData = await treatmentPlansService.getPlan(targetId);
        setPlan(planData as any);

        // Fetch sessions in parallel with child data
        const sessionsPromise = sessionsService.getTreatmentSessions(targetId).catch(() => []);
        const childPromise = planData.childId
          ? childrenService.getChild(String(planData.childId)).catch(() => null)
          : Promise.resolve(null);
        const notesPromise = planData.childId
          ? notesService.getChildNotes(planData.childId).catch(() => [])
          : Promise.resolve([]);

        const [sessionsData, childData, notesData] = await Promise.all([
          sessionsPromise,
          childPromise,
          notesPromise,
        ]);

        setSessions(sessionsData);
        setChild(childData);
        setNotes(notesData);
      } catch (err) {
        console.error('Error loading treatment plan:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId, activeChildId, navigate]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600" />
          <p className="text-stone-500 text-sm font-medium animate-pulse">Loading treatment plan...</p>
        </div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="text-center py-16">
          <div className="w-16 h-16 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-4">
            <FileText size={28} className="text-stone-400" />
          </div>
          <p className="text-stone-600 dark:text-slate-400 font-semibold">Treatment plan not found</p>
        </div>
      </MainLayout>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  // Computed child display data
  const childAge = child ? calcAge(child) : null;
  const childGender = child?.gender && child.gender !== 'Unknown' && child.gender !== '' ? child.gender : null;
  const childMedHistory = child?.medicalHistory && child.medicalHistory.trim() !== ''
    ? child.medicalHistory
    : null;

  return (
    <MainLayout>
      <div className="space-y-6 pb-12 max-w-5xl mx-auto">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">{plan.title}</h1>
          <p className="text-stone-500 dark:text-slate-400 font-medium">{plan.description}</p>
        </div>

        {/* Child Profile Card — populated from real child data */}
        {child && (
          <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
            <h3 className="font-black text-base text-stone-800 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
              <div className="w-8 h-8 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center">
                <Heart className="text-rose-500" size={15} />
              </div>
              Child Profile
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Name</p>
                <p className="font-bold text-stone-900 dark:text-white text-sm">{child.name}</p>
              </div>
              {childAge !== null && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Age</p>
                  <p className="font-bold text-stone-900 dark:text-white text-sm">{childAge} years old</p>
                </div>
              )}
              {childGender && (
                <div>
                  <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Gender</p>
                  <p className="font-bold text-stone-900 dark:text-white text-sm capitalize">{childGender}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Medical History</p>
                <p className="text-sm text-stone-700 dark:text-slate-300 font-medium">
                  {childMedHistory || 'No medical history recorded'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-stone-200/60 dark:border-white/8">
          {(['overview', 'sessions', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2.5 font-bold text-sm border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-stone-500 dark:text-slate-400 hover:text-stone-800 dark:hover:text-white'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="flex items-center gap-2 text-base font-black text-stone-800 dark:text-white mb-4 tracking-tight">
                <Target className="h-5 w-5 text-blue-600" />
                Goals
              </h3>
              {(plan.goals?.length ?? 0) === 0 ? (
                <p className="text-stone-400 text-sm">No goals defined yet.</p>
              ) : (
                <ul className="space-y-2.5">
                  {plan.goals?.map((goal, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 text-sm">
                      <CheckCircle className="h-4 w-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <span className="text-stone-700 dark:text-slate-300 font-medium">{goal}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
              <h3 className="flex items-center gap-2 text-base font-black text-stone-800 dark:text-white mb-4 tracking-tight">
                <MessageSquare className="h-5 w-5 text-violet-600" />
                Recommendations
              </h3>
              {(plan.recommendations?.length ?? 0) === 0 ? (
                <p className="text-stone-400 text-sm">No recommendations added yet.</p>
              ) : (
                <ul className="space-y-2">
                  {plan.recommendations?.map((rec, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-stone-700 dark:text-slate-300 font-medium">
                      <span className="text-violet-400 font-black mt-0.5">•</span> {rec}
                    </li>
                  ))}
                </ul>
              )}
            </Card>

            <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80 md:col-span-2">
              <h3 className="flex items-center gap-2 text-base font-black text-stone-800 dark:text-white mb-4 tracking-tight">
                <Activity className="h-5 w-5 text-amber-600" />
                Home Activities
              </h3>
              {(plan.homeActivities?.length ?? 0) === 0 ? (
                <p className="text-stone-400 text-sm">No home activities defined.</p>
              ) : (
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {plan.homeActivities?.map((activity, idx) => (
                    <li key={idx} className="flex items-start gap-2.5 bg-amber-50/50 dark:bg-amber-900/10 p-3.5 rounded-2xl border border-amber-100 dark:border-amber-900/20">
                      <span className="text-amber-600 font-black text-sm flex-shrink-0">{idx + 1}.</span>
                      <span className="text-stone-700 dark:text-slate-300 text-sm font-medium">{activity}</span>
                    </li>
                  ))}
                </ul>
              )}
            </Card>
          </div>
        )}

        {/* Sessions Tab */}
        {activeTab === 'sessions' && (
          <div className="space-y-5">
            {upcomingSessions.length > 0 && (
              <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
                <h3 className="text-base font-black text-stone-800 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
                  <Calendar className="text-blue-500" size={17} />
                  Upcoming Sessions
                </h3>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-blue-50/40 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800/20">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-white text-sm">{session.title}</p>
                        <p className="text-xs text-stone-500 dark:text-slate-400 mt-0.5 font-medium">
                          {new Date(session.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} at {session.scheduledTime}
                        </p>
                      </div>
                      {session.joinLink && (
                        <a
                          href={session.joinLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-sm flex items-center gap-1.5"
                        >
                          🎥 Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {completedSessions.length > 0 && (
              <Card className="border border-stone-200/60 dark:border-white/8 shadow-md rounded-3xl p-5 bg-[var(--surface-strong)] dark:bg-slate-800/80">
                <h3 className="text-base font-black text-stone-800 dark:text-white mb-4 flex items-center gap-2 tracking-tight">
                  <CheckCircle className="text-emerald-500" size={17} />
                  Completed Sessions
                </h3>
                <div className="space-y-3">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 bg-emerald-50/40 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-800/20">
                      <div>
                        <p className="font-bold text-stone-900 dark:text-white text-sm">{session.title}</p>
                        <p className="text-xs text-stone-500 mt-0.5 font-medium">
                          {new Date(session.scheduledDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-emerald-500" />
                    </div>
                  ))}
                </div>
              </Card>
            )}

            {upcomingSessions.length === 0 && completedSessions.length === 0 && (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <Calendar size={24} className="text-stone-400" />
                </div>
                <p className="text-stone-500 font-semibold">No sessions recorded yet.</p>
              </div>
            )}
          </div>
        )}

        {/* Notes Tab */}
        {activeTab === 'notes' && (
          <div className="space-y-3">
            {notes.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-14 h-14 rounded-2xl bg-stone-100 dark:bg-slate-800 flex items-center justify-center mx-auto mb-3">
                  <User size={24} className="text-stone-400" />
                </div>
                <p className="text-stone-500 font-semibold">No clinical notes yet.</p>
              </div>
            ) : (
              notes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  onUpdate={(updated) => setNotes(notes.map(n => n.id === updated.id ? updated : n))}
                  onDelete={(deletedId) => setNotes(notes.filter(n => n.id !== deletedId))}
                />
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
