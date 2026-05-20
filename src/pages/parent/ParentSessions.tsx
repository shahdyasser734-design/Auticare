import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROUTES } from '../../utils/constants';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../services/api/bookings';
import { formatDateTime } from '../../utils/dateUtils';

export const ParentSessions = () => {
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [pastSessions, setPastSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const upcoming = await bookingService.getUpcomingBookings();
        const history = await bookingService.getMyBookings();
        setUpcomingSessions(upcoming);
        setPastSessions(history);
      } catch (err) {
        console.error('Error fetching sessions:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSessions();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Sessions</h1>
          <p className="text-neutral-600">Manage your upcoming and past sessions</p>
        </div>

        {loading ? (
          <div>Loading...</div>
        ) : (
          <>
            {/* Upcoming Sessions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-neutral-900">Upcoming Sessions</h2>
              {upcomingSessions.length === 0 ? (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-neutral-600 mb-4">No upcoming sessions</p>
                    <Button onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}>
                      Book a Session
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingSessions.map((session) => (
                    <Card key={session.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-neutral-900">Session</p>
                          <p className="text-neutral-600">{formatDateTime(session.dateTime)}</p>
                          {session.notes && <p className="text-sm text-neutral-500 mt-2">{session.notes}</p>}
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
                <h2 className="text-2xl font-bold text-neutral-900">Past Sessions</h2>
                <div className="grid gap-4">
                  {pastSessions.slice(0, 5).map((session) => (
                    <Card key={session.id}>
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-bold text-lg text-neutral-900">Session</p>
                          <p className="text-neutral-600">{formatDateTime(session.dateTime)}</p>
                          {session.notes && <p className="text-sm text-neutral-500 mt-2">{session.notes}</p>}
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
