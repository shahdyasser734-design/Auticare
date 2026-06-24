import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/useAuth';
import { MainLayout } from '../../layouts/MainLayout';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../types';
import { Calendar, User, Clock, CheckCircle2 } from 'lucide-react';
import { formatZoomLink } from '../../utils/zoomHelper';

// ─── Status helpers ──────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending:   'Pending',
  approved:  'Approved',
  confirmed: 'Confirmed',
  rejected:  'Rejected',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

const STATUS_BADGE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-800  dark:bg-amber-900/30  dark:text-amber-300  border border-amber-200  dark:border-amber-800/40',
  approved:  'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/40',
  confirmed: 'bg-sky-100 text-sky-800   dark:bg-sky-900/30   dark:text-sky-300   border border-sky-200   dark:border-sky-800/40',
  rejected:  'bg-rose-100 text-rose-800   dark:bg-rose-900/30   dark:text-rose-300   border border-rose-200   dark:border-rose-800/40',
  cancelled: 'bg-rose-100 text-rose-800   dark:bg-rose-900/30   dark:text-rose-300   border border-rose-200   dark:border-rose-800/40',
  completed: 'bg-teal-100 text-teal-800   dark:bg-teal-900/30   dark:text-teal-300   border border-teal-200   dark:border-teal-800/40',
};

const statusLabel = (s: string) => STATUS_LABEL[s?.toLowerCase()] ?? (s || 'Pending');
const statusBadge = (s: string) => STATUS_BADGE[s?.toLowerCase()] ?? 'bg-slate-100 text-slate-700 border border-slate-200';

const isUpcoming = (s: string) => {
  const low = s?.toLowerCase();
  return low === 'pending' || low === 'approved' || low === 'confirmed';
};

const isHistory = (s: string) => {
  const low = s?.toLowerCase();
  return low === 'completed' || low === 'cancelled' || low === 'rejected';
};

const formatDate = (d: string) => {
  if (!d) return 'TBD';
  try {
    return new Date(d).toLocaleDateString('en-US', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
    });
  } catch { return d; }
};

export const ParentSessions = () => {
  const { activeChildId } = useAuth();
  const [allBookings, setAllBookings]   = useState<Booking[]>([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [activeTab, setActiveTab]       = useState<'upcoming' | 'history'>('upcoming');

  const loadSessions = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getMyBookings();
      setAllBookings(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load your sessions. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Refetch whenever child selection changes
// eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { void loadSessions(); }, [loadSessions, activeChildId]);

  const childFiltered = activeChildId
    ? allBookings.filter(b => String(b.childId) === String(activeChildId))
    : allBookings;

  const sorted = [...childFiltered].sort((a, b) =>
    new Date(b.dateTime ?? b.createdAt ?? 0).getTime() - new Date(a.dateTime ?? a.createdAt ?? 0).getTime()
  );

  const upcomingSessions = sorted.filter(b => isUpcoming(b.status));
  const historySessions  = sorted.filter(b => isHistory(b.status));
  const display          = activeTab === 'upcoming' ? upcomingSessions : historySessions;

  const handleJoinZoom = (session: Booking) => {
    const url = session.zoomUrl || session.joinLink;
    const formattedUrl = formatZoomLink(url);
    if (formattedUrl) {
      window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    } else {
      alert("No Zoom meeting link available.");
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your sessions…</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-8 pb-12">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Sessions</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              Upcoming and past sessions with your care team
            </p>
          </div>
          <button
            onClick={() => void loadSessions()}
            className="text-sm font-bold text-indigo-600 dark:text-indigo-400 hover:underline"
          >
            ↻ Refresh
          </button>
        </div>

        {error && (
          <div className="rounded-2xl bg-rose-50 dark:bg-rose-900/20 border border-rose-200 dark:border-rose-800/40 p-4 text-rose-700 dark:text-rose-300 text-sm font-medium flex items-center justify-between">
            <span>{error}</span>
            <button onClick={() => setError('')} className="ml-4 text-rose-400 hover:text-rose-600">✕</button>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 border-b border-slate-200 dark:border-white/10">
          {(['upcoming', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab === 'upcoming'
                ? `Upcoming (${upcomingSessions.length})`
                : `History (${historySessions.length})`}
            </button>
          ))}
        </div>

        {/* Session Cards */}
        {display.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 py-16 text-center">
            <Calendar size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-bold text-slate-600 dark:text-slate-400">
              {activeTab === 'upcoming' ? 'No upcoming sessions' : 'No session history'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'upcoming'
                ? 'Book a specialist to schedule a session.'
                : 'Completed sessions will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {display.map(session => {
              const status         = (session.status || '').toLowerCase();
              const isCompleted    = status === 'completed';
              const isCancelled    = status === 'cancelled' || status === 'rejected';
              const specialistRole = session.specialistType === 'therapist' ? 'Therapist' : 'Doctor';

              return (
                <div
                  key={session.id}
                  className={`rounded-2xl border bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden ${
                    isCompleted ? 'opacity-80 border-teal-100 dark:border-teal-900/30' :
                    isCancelled ? 'opacity-60 border-rose-100 dark:border-rose-900/30' :
                    'border-slate-200 dark:border-white/10'
                  }`}
                >
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">

                    {/* Child */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <User size={11} /> Child
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.childName || '—'}
                      </p>
                    </div>

                    {/* Specialist */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {specialistRole}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {session.specialistName || '—'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{specialistRole}</p>
                    </div>

                    {/* Date & Time */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Clock size={11} /> Date &amp; Time
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatDate(session.appointmentDate)}
                      </p>
                      <p className="text-xs text-slate-500">{session.appointmentTime || 'Time TBD'}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold ${statusBadge(status)}`}>
                        {isCompleted && <CheckCircle2 size={11} />}
                        {statusLabel(status)}
                      </span>
                    </div>

                    {/* Notes */}
                    {session.notes && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Notes</p>
                        <p className="text-sm text-slate-600 dark:text-slate-400 font-medium">{session.notes}</p>
                      </div>
                    )}
                  </div>

                  {/* Zoom action — always available for upcoming sessions */}
                  {activeTab === 'upcoming' && (
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-white/5 flex items-center justify-end">
                      <button
                        onClick={() => handleJoinZoom(session)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors shadow-sm"
                      >
                        🎥 Start Session
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
