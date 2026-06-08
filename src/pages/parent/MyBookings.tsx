import { useEffect, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { useBookings } from '../../context/BookingsContext';
import { getOrCreateSessionMeetingLink } from '../../utils/zoomHelper';
import { bookingService } from '../../services/api/bookings';

export const MyBookings = () => {
  const { myBookings: bookings, loading, refreshBookings } = useBookings();
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const handleCancelSession = async () => {
    if (!cancellingId || !cancelReason.trim()) return;
    try {
      await bookingService.cancelBooking(cancellingId, cancelReason);
      setCancellingId(null);
      setCancelReason('');
      await refreshBookings();
    } catch (err) {
      console.error('Error cancelling session:', err);
    }
  };

  useEffect(() => {
    const loadBookings = async () => {
      try {
        await refreshBookings();
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError('Could not load your bookings. Please try again later.');
      }
    };
    void loadBookings();
  }, []);

  const sortedBookings = [...bookings].sort((a, b) => {
    const timeA = new Date(a.dateTime || a.createdAt || 0).getTime();
    const timeB = new Date(b.dateTime || b.createdAt || 0).getTime();
    return timeB - timeA;
  });

  // Upcoming: anything that is NOT completed or cancelled
  const upcomingBookings = sortedBookings.filter((b) => {
    const s = (b.status ?? '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled';
  });

  // Completed: bookings explicitly marked completed or cancelled
  const completedBookings = sortedBookings.filter((b) => {
    const s = (b.status ?? '').toLowerCase();
    return s === 'completed' || s === 'cancelled';
  });

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : completedBookings;

  const getStatusLabel = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'pending') return 'Pending';
    if (s === 'approved') return 'Approved';
    if (s === 'rejected') return 'Rejected';
    if (s === 'confirmed') return 'Confirmed';
    if (s === 'scheduled') return 'Scheduled';
    if (s === 'completed') return 'Completed';
    if (s === 'cancelled') return 'Cancelled';
    return statusStr || 'Pending';
  };

  const getStatusBadgeClass = (statusStr: string) => {
    const s = (statusStr || '').toLowerCase();
    if (s === 'pending') {
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300 border border-amber-200 dark:border-amber-900/40';
    }
    if (s === 'approved') {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40';
    }
    if (s === 'rejected' || s === 'cancelled') {
      return 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40';
    }
    if (s === 'confirmed' || s === 'scheduled') {
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300 border border-sky-200 dark:border-sky-900/40';
    }
    if (s === 'completed') {
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 border border-teal-200 dark:border-teal-900/40';
    }
    return 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-350 border border-slate-200 dark:border-slate-800';
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
            <p className="text-slate-600 dark:text-slate-400">Loading your bookings...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">My Bookings</h1>
          <p className="mt-2 text-slate-600 dark:text-slate-400">
            View and manage all your appointments with specialists
          </p>
        </div>

        {error && (
          <div className="rounded-2xl border border-red-300 bg-red-50 p-6 dark:border-red-700 dark:bg-red-900/20">
            <p className="text-red-700 dark:text-red-200">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Upcoming ({upcomingBookings.length})
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-6 py-3 font-semibold border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Completed ({completedBookings.length})
          </button>
        </div>

        {/* Bookings List */}
        {displayBookings.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
              {activeTab === 'upcoming'
                ? 'You have no upcoming bookings'
                : 'You have no completed bookings'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {displayBookings.map((booking) => {
              const status = (booking.status ?? '').toLowerCase();
              const canJoin = activeTab === 'upcoming' && (status === 'scheduled' || status === 'confirmed' || status === 'approved');
              return (
                <div
                  key={booking.id}
                  className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all hover:shadow-lg dark:border-slate-700 dark:bg-slate-800"
                >
                  <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Specialist
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {booking.specialistName || 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Date & Time
                      </p>
                      <p className="mt-1 font-semibold text-slate-900 dark:text-white">
                        {booking.appointmentDate || booking.dateTime
                          ? `${new Date(booking.appointmentDate || booking.dateTime || '').toLocaleDateString()} at ${booking.appointmentTime || 'TBD'}`
                          : 'TBD'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Status
                      </p>
                      <span
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${getStatusBadgeClass(booking.status)}`}
                      >
                        {getStatusLabel(booking.status)}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-400">
                        Reason
                      </p>
                      <p className="mt-1 truncate font-semibold text-slate-900 dark:text-white">
                        {booking.reason || 'N/A'}
                      </p>
                    </div>
                  </div>
                  {canJoin && (
                    <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-3 flex justify-end gap-3">
                      <button
                        onClick={() => setCancellingId(booking.id)}
                        className="rounded-xl border border-red-200 bg-transparent hover:bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 transition-colors"
                      >
                        Cancel Session
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const link = await getOrCreateSessionMeetingLink(booking, false);
                            window.open(link, '_blank');
                          } catch (err) {
                            window.open(booking.joinLink || `https://zoom.us/j/${booking.id}`, '_blank');
                          }
                        }}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 hover:bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors"
                      >
                        🎥 Join Zoom Meeting
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Cancel Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cancel Session</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Please provide a reason for cancelling this session. This will be shared with the specialist.</p>
            <textarea
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl mb-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <button 
                className="px-4 py-2 rounded-lg font-semibold border border-slate-300 hover:bg-slate-50 text-slate-700"
                onClick={() => { setCancellingId(null); setCancelReason(''); }}
              >
                Keep Session
              </button>
              <button 
                className="px-4 py-2 rounded-lg font-semibold bg-red-600 hover:bg-red-700 text-white disabled:opacity-50"
                onClick={handleCancelSession}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
