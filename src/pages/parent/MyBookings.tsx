import { useEffect, useState, useCallback } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { useAuth } from '../../context/useAuth';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../types';
import { Calendar, User, Clock, Video, XCircle } from 'lucide-react';

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending',
  approved: 'Approved',
  confirmed: 'Confirmed',
  rejected: 'Rejected',
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

const isActiveStatus = (s: string) => {
  const low = s?.toLowerCase();
  return low === 'pending' || low === 'approved' || low === 'confirmed';
};

const isTerminalStatus = (s: string) => {
  const low = s?.toLowerCase();
  return low === 'completed' || low === 'cancelled' || low === 'rejected';
};

const formatDate = (d: string) => {
  if (!d) return 'TBD';
  try { return new Date(d).toLocaleDateString('en-US', { weekday: 'short', year: 'numeric', month: 'short', day: 'numeric' }); }
  catch { return d; }
};

export const MyBookings = () => {
  const { activeChildId } = useAuth();
  const [allBookings, setAllBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'history'>('active');

  // Cancel flow
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await bookingService.getMyBookings();
      setAllBookings(Array.isArray(data) ? data : []);
    } catch {
      setError('Could not load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload whenever the active child changes
  useEffect(() => { void loadBookings(); }, [loadBookings, activeChildId]);

  const childFiltered = activeChildId
    ? allBookings.filter(b => String(b.childId) === String(activeChildId))
    : allBookings;

  const sorted = [...childFiltered].sort((a, b) =>
    new Date(b.dateTime ?? b.createdAt ?? 0).getTime() - new Date(a.dateTime ?? a.createdAt ?? 0).getTime()
  );

  const activeBookings   = sorted.filter(b => isActiveStatus(b.status));
  const historyBookings  = sorted.filter(b => isTerminalStatus(b.status));
  const displayBookings  = activeTab === 'active' ? activeBookings : historyBookings;

  const handleCancel = async () => {
    if (!cancellingId) return;
    setCancelBusy(true);
    try {
      await bookingService.cancelBooking(cancellingId, cancelReason.trim() || undefined);
      setCancellingId(null);
      setCancelReason('');
      await loadBookings();
    } catch {
      setError('Failed to cancel booking. Please try again.');
    } finally {
      setCancelBusy(false);
    }
  };

  const handleJoinZoom = (booking: Booking) => {
    // Synchronous open — avoids popup blocker
    const url = booking.joinLink || booking.zoomUrl;
    const tab = window.open(url || 'https://app.zoom.us/wc', '_blank', 'noopener,noreferrer');
    if (!url && tab) {
      tab.close();
      alert('No Zoom meeting link is available for this booking yet. Please wait for your specialist to set up the meeting.');
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-20">
          <div className="text-center space-y-3">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-300 border-t-indigo-600 mx-auto" />
            <p className="text-slate-500 dark:text-slate-400 font-medium">Loading your bookings…</p>
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
            <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">My Bookings</h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 font-medium">
              All appointments with your specialists
            </p>
          </div>
          <button
            onClick={() => void loadBookings()}
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
          {(['active', 'history'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-bold text-sm border-b-2 transition-colors capitalize ${
                activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                  : 'border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
              }`}
            >
              {tab === 'active' ? `Active (${activeBookings.length})` : `History (${historyBookings.length})`}
            </button>
          ))}
        </div>

        {/* Booking Cards */}
        {displayBookings.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-200 dark:border-white/10 py-16 text-center">
            <Calendar size={40} className="mx-auto text-slate-300 dark:text-slate-600 mb-4" />
            <p className="font-bold text-slate-600 dark:text-slate-400">
              {activeTab === 'active' ? 'No active bookings' : 'No booking history'}
            </p>
            <p className="text-sm text-slate-400 mt-1">
              {activeTab === 'active' ? 'Book a specialist to get started.' : 'Completed bookings will appear here.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map(booking => {
              const status  = (booking.status || '').toLowerCase();
              const canJoin = (status === 'approved' || status === 'confirmed') && !isTerminalStatus(status);
              const canCancel = isActiveStatus(status);
              const specialistLabel = booking.specialistType === 'therapist' ? 'Therapist' : 'Doctor';

              return (
                <div
                  key={booking.id}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-800 shadow-sm hover:shadow-md transition-all overflow-hidden"
                >
                  <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Child */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <User size={11} /> Child
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {booking.childName || '—'}
                      </p>
                    </div>

                    {/* Specialist */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                        {specialistLabel}
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {booking.specialistName || '—'}
                      </p>
                      <p className="text-xs text-slate-500 capitalize">{specialistLabel}</p>
                    </div>

                    {/* Date & Time */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                        <Clock size={11} /> Date &amp; Time
                      </p>
                      <p className="font-bold text-slate-900 dark:text-white text-sm">
                        {formatDate(booking.appointmentDate)}
                      </p>
                      <p className="text-xs text-slate-500">{booking.appointmentTime || 'Time TBD'}</p>
                    </div>

                    {/* Status */}
                    <div>
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Status</p>
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold ${statusBadge(status)}`}>
                        {statusLabel(status)}
                      </span>
                    </div>

                    {/* Reason */}
                    {booking.reason && (
                      <div className="sm:col-span-2">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Reason</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 font-medium">{booking.reason}</p>
                      </div>
                    )}
                  </div>

                  {/* Actions bar */}
                  {(canJoin || canCancel) && (
                    <div className="px-5 py-3 bg-slate-50 dark:bg-slate-900/30 border-t border-slate-100 dark:border-white/5 flex items-center justify-end gap-3">
                      {canCancel && (
                        <button
                          onClick={() => setCancellingId(booking.id)}
                          className="flex items-center gap-1.5 rounded-xl border border-rose-200 dark:border-rose-800/40 bg-transparent hover:bg-rose-50 dark:hover:bg-rose-900/20 px-4 py-2 text-sm font-bold text-rose-600 dark:text-rose-400 transition-colors"
                        >
                          <XCircle size={14} /> Cancel
                        </button>
                      )}
                      {canJoin && (
                        <button
                          onClick={() => handleJoinZoom(booking)}
                          className="flex items-center gap-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-bold text-white transition-colors shadow-sm"
                        >
                          <Video size={14} /> Join Zoom Meeting
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel confirmation modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">Cancel Booking</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-4">
              Provide a reason for cancelling (optional). This will be shared with the specialist.
            </p>
            <textarea
              className="w-full p-3 border border-slate-200 dark:border-white/10 rounded-2xl mb-4 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-rose-400 resize-none"
              rows={3}
              placeholder="Reason for cancellation…"
              value={cancelReason}
              onChange={e => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button
                className="px-4 py-2 rounded-xl font-bold border border-slate-200 dark:border-white/10 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
                onClick={() => { setCancellingId(null); setCancelReason(''); }}
                disabled={cancelBusy}
              >
                Keep Booking
              </button>
              <button
                className="px-4 py-2 rounded-xl font-bold bg-rose-600 hover:bg-rose-700 text-white transition-colors disabled:opacity-50"
                onClick={() => void handleCancel()}
                disabled={cancelBusy}
              >
                {cancelBusy ? 'Cancelling…' : 'Confirm Cancellation'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
