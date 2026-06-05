import { useEffect, useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { bookingService, type Booking } from '../../services/api/bookings';

export const MyBookings = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');

  useEffect(() => {
    const loadBookings = async () => {
      try {
        setLoading(true);
        const data = await bookingService.getMyBookings();
        setBookings(data);
      } catch (err) {
        console.error('Failed to load bookings:', err);
        setError('Could not load your bookings. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadBookings();
  }, []);

  // Upcoming: anything that is NOT completed and NOT cancelled
  const upcomingBookings = bookings.filter((b) => {
    const s = (b.status ?? '').toLowerCase();
    return s !== 'completed' && s !== 'cancelled';
  });

  // Completed: only bookings explicitly marked completed
  const completedBookings = bookings.filter((b) => {
    return (b.status ?? '').toLowerCase() === 'completed';
  });

  const displayBookings = activeTab === 'upcoming' ? upcomingBookings : completedBookings;

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
              const zoomLink = booking.joinLink || 'https://zoom.us/j/9876543210';
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
                        className={`mt-1 inline-block rounded-full px-3 py-1 text-sm font-semibold capitalize ${
                          status === 'scheduled' || status === 'confirmed' || status === 'approved'
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                            : status === 'completed'
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            : status === 'cancelled'
                            ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300'
                        }`}
                      >
                        {booking.status || 'Pending'}
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
                    <div className="border-t border-slate-100 dark:border-slate-700 px-6 py-3 flex justify-end">
                      <button
                        onClick={() => window.open(zoomLink, '_blank')}
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
    </MainLayout>
  );
};
