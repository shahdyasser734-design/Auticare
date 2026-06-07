import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { treatmentPlansService } from '../../services/api/treatmentPlansService';
import { sessionsService } from '../../services/api/sessionsService';
import { notesService } from '../../services/api/notesService';
import type { TreatmentPlan, TherapySession, ClinicalNote } from '../../types';
import { Calendar, Target, CheckCircle, MessageSquare } from 'lucide-react';

export const TreatmentPlanDetail = () => {
  const { planId } = useParams<{ planId: string }>();
  const [plan, setPlan] = useState<TreatmentPlan | null>(null);
  const [sessions, setSessions] = useState<TherapySession[]>([]);
  const [notes, setNotes] = useState<ClinicalNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'sessions' | 'notes'>('overview');

  useEffect(() => {
    const loadData = async () => {
      if (!planId) return;
      try {
        setLoading(true);
        const planData = await treatmentPlansService.getPlan(planId);
        setPlan(planData as any);

        const sessionsData = await sessionsService.getTreatmentSessions(planId);
        setSessions(sessionsData);

        if (planData.childId) {
          const notesData = await notesService.getChildNotes(planData.childId);
          setNotes(notesData);
        }
      } catch (err) {
        console.error('Error loading treatment plan:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [planId]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
        </div>
      </MainLayout>
    );
  }

  if (!plan) {
    return (
      <MainLayout>
        <div className="text-center py-12">
          <p className="text-gray-600 dark:text-gray-400">Treatment plan not found</p>
        </div>
      </MainLayout>
    );
  }

  const upcomingSessions = sessions.filter(s => s.status === 'scheduled');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{plan.title}</h1>
          <p className="text-gray-600 dark:text-gray-400">{plan.description}</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-200 dark:border-gray-700">
          {(['overview', 'sessions', 'notes'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
                activeTab === tab
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Goals */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Target className="h-5 w-5 text-blue-600" />
                Goals
              </h3>
              <ul className="space-y-2">
                {plan.goals?.map((goal, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                    <span className="text-gray-700 dark:text-gray-300">{goal}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Recommendations */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <MessageSquare className="h-5 w-5 text-purple-600" />
                Recommendations
              </h3>
              <ul className="space-y-2">
                {plan.recommendations?.map((rec, idx) => (
                  <li key={idx} className="text-gray-700 dark:text-gray-300">• {rec}</li>
                ))}
              </ul>
            </div>

            {/* Home Activities */}
            <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:col-span-2">
              <h3 className="flex items-center gap-2 text-lg font-bold mb-4">
                <Calendar className="h-5 w-5 text-orange-600" />
                Home Activities
              </h3>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {plan.homeActivities?.map((activity, idx) => (
                  <li key={idx} className="flex items-start gap-2 bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                    <span className="text-orange-600 font-bold flex-shrink-0">{idx + 1}.</span>
                    <span className="text-gray-700 dark:text-gray-300">{activity}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'sessions' && (
          <div className="space-y-6">
            {/* Upcoming */}
            {upcomingSessions.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="text-lg font-bold mb-4">Upcoming Sessions</h3>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{session.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(session.scheduledDate).toLocaleDateString()} at {session.scheduledTime}
                        </p>
                      </div>
                      {session.joinLink && (
                        <a
                          href={session.joinLink}
                          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold"
                        >
                          Join
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Completed */}
            {completedSessions.length > 0 && (
              <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                <h3 className="text-lg font-bold mb-4">Completed Sessions</h3>
                <div className="space-y-3">
                  {completedSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white">{session.title}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {new Date(session.scheduledDate).toLocaleDateString()}
                        </p>
                      </div>
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'notes' && (
          <div className="space-y-3">
            {notes.length === 0 ? (
              <p className="text-center text-gray-600 dark:text-gray-400 py-8">No notes yet</p>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-bold text-gray-900 dark:text-white">{note.title}</h4>
                    <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                      {note.category}
                    </span>
                  </div>
                  <p className="text-gray-700 dark:text-gray-300">{note.content}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                    {new Date(note.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
