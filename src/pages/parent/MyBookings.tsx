import { useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { LoadingSpinner } from '../../components/common/Loading';
import { ROUTES } from '../../utils/constants';
import { useBookings } from '../../context/BookingsContext';
import { formatDateTime } from '../../utils/dateUtils';

const getStatusVariant = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'success';
    case 'scheduled':
      return 'warning';
    case 'pending':
      return 'secondary';
    case 'completed':
      return 'primary';
    case 'cancelled':
      return 'danger';
    default:
      return 'secondary';
  }
};

export const MyBookings = () => {
  const navigate = useNavigate();
  const { myBookings, loading, refreshBookings } = useBookings();

  useEffect(() => {
    void refreshBookings();
  }, [refreshBookings]);

  const sortedBookings = useMemo(
    () => [...myBookings].sort((a, b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()),
    [myBookings]
  );

  const upcomingBookings = useMemo(
    () => sortedBookings.filter((booking) => new Date(booking.dateTime) > new Date()),
    [sortedBookings]
  );

  const pastBookings = useMemo(
    () => sortedBookings.filter((booking) => new Date(booking.dateTime) <= new Date()),
    [sortedBookings]
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Bookings</h1>
          <p className="text-slate-600 dark:text-slate-400">Review your upcoming specialist appointments and your booking history.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <p className="text-sm text-slate-500 dark:text-slate-400">Total bookings</p>
                <p className="text-3xl font-bold mt-3 text-slate-900 dark:text-white">{myBookings.length}</p>
              </Card>
              <Card>
                <p className="text-sm text-slate-500 dark:text-slate-400">Upcoming sessions</p>
                <p className="text-3xl font-bold mt-3 text-slate-900 dark:text-white">{upcomingBookings.length}</p>
              </Card>
              <Card>
                <p className="text-sm text-slate-500 dark:text-slate-400">Past sessions</p>
                <p className="text-3xl font-bold mt-3 text-slate-900 dark:text-white">{pastBookings.length}</p>
              </Card>
            </div>

            {myBookings.length === 0 ? (
              <Card className="text-center py-16">
                <div className="text-3xl mb-4">📅</div>
                <h2 className="text-2xl font-bold mb-2 text-slate-900 dark:text-white">No bookings yet</h2>
                <p className="text-slate-500 dark:text-slate-400 mb-6">
                  Schedule a session with one of our specialists to start your child's care plan.
                </p>
                <Button onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}>
                  Book a Specialist
                </Button>
              </Card>
            ) : (
              <div className="space-y-8">
                <section className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upcoming Sessions</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">Appointments that are scheduled in the near future.</p>
                    </div>
                    <Button onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}>
                      Book another session
                    </Button>
                  </div>

                  {upcomingBookings.length === 0 ? (
                    <Card>
                      <p className="text-slate-600 dark:text-slate-400">No upcoming sessions found.</p>
                    </Card>
                  ) : (
                    <div className="grid gap-4">
                      {upcomingBookings.map((booking) => (
                        <Card key={booking.id} className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <p className="font-semibold text-lg text-slate-900 dark:text-white">{booking.specialistName || 'Specialist'}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(booking.dateTime)}</p>
                              {booking.childId && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Child ID: {booking.childId}</p>
                              )}
                            </div>
                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                          </div>

                          {booking.reason && <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Reason: {booking.reason}</p>}
                          {booking.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Notes: {booking.notes}</p>}

                          <div className="mt-4 flex flex-wrap gap-3">
                            {booking.joinLink && (
                              <Button size="sm" onClick={() => window.open(booking.joinLink, '_blank')}>
                                Join Session
                              </Button>
                            )}
                            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.PARENT_SESSIONS)}>
                              View all sessions
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </section>

                {pastBookings.length > 0 && (
                  <section className="space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div>
                        <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Past Sessions</h2>
                        <p className="text-sm text-slate-500 dark:text-slate-400">Review completed, cancelled, or older appointments.</p>
                      </div>
                    </div>
                    <div className="grid gap-4">
                      {pastBookings.map((booking) => (
                        <Card key={booking.id} className="p-6">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                            <div>
                              <p className="font-semibold text-lg text-slate-900 dark:text-white">{booking.specialistName || 'Specialist'}</p>
                              <p className="text-sm text-slate-500 dark:text-slate-400">{formatDateTime(booking.dateTime)}</p>
                              {booking.childId && (
                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">Child ID: {booking.childId}</p>
                              )}
                            </div>
                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                          </div>
                          {booking.reason && <p className="text-sm text-slate-500 dark:text-slate-400 mt-4">Reason: {booking.reason}</p>}
                        </Card>
                      ))}
                    </div>
                  </section>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
