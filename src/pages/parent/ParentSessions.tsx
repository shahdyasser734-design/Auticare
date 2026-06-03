import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROUTES } from '../../utils/constants';
import type { Booking } from '../../services/api/bookings';
import { formatDateTime } from '../../utils/dateUtils';
import { useBookings } from '../../context/BookingsContext';

export const ParentSessions = () => {
  const navigate = useNavigate();
  const { myBookings, upcomingBookings, loading, refreshBookings } = useBookings();
  const [pastSessions, setPastSessions] = useState<Booking[]>([]);

  useEffect(() => {
    // derive past sessions from myBookings
    setPastSessions(myBookings.filter(b => b.status !== 'scheduled' && b.status !== 'pending' && b.status !== 'confirmed'));
  }, [myBookings]);

  useEffect(() => {
    // ensure bookings are fresh
    void refreshBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Sessions</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your upcoming and past sessions</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Upcoming Sessions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Upcoming Sessions</h2>
              {upcomingBookings.length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📅</div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">No upcoming sessions</p>
                    <Button onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}>
                      Book a Session
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingBookings.map((session) => (
                    <Card key={session.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">Session</p>
                          <p className="text-slate-600 dark:text-slate-400">{formatDateTime(session.dateTime)}</p>
                          {session.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{session.notes}</p>}
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge>{session.status}</Badge>
                          {session.joinLink && (
                            <Button size="sm" onClick={() => window.open(session.joinLink)}>
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            {/* Past Sessions */}
            {pastSessions.length > 0 && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">Past Sessions</h2>
                <div className="grid gap-4">
                  {pastSessions.slice(0, 5).map((session) => (
                    <Card key={session.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-slate-900 dark:text-white">Session</p>
                          <p className="text-slate-600 dark:text-slate-400">{formatDateTime(session.dateTime)}</p>
                          {session.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2">{session.notes}</p>}
                        </div>
                        <Badge>{session.status}</Badge>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </MainLayout>
  );
};
