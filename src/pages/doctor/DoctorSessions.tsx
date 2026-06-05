import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { bookingService, type Booking } from '../../services/api/bookings';
import { formatDateTime } from '../../utils/dateUtils';

export const DoctorSessions = () => {
  const navigate = useNavigate();
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    try {
      const data = await bookingService.getUpcomingBookings();
      setSessions(data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchSessions();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUpdateStatus = async (id: string, newStatus: Booking['status']) => {
    try {
      await bookingService.updateBookingStatus(id, newStatus);
      fetchSessions();
    } catch (err) {
      console.error('Error updating status:', err);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Sessions</h1>
            <p className="text-neutral-600">Manage your patient sessions and requests</p>
          </div>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12">Loading...</div>
          ) : sessions.length === 0 ? (
            <Card>
              <div className="text-center py-8">
                <p className="text-neutral-600">No sessions scheduled</p>
              </div>
            </Card>
          ) : (
            sessions.map((session) => (
              <Card key={session.id}>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="font-bold text-lg text-neutral-900">Patient Session</p>
                    <p className="text-neutral-600">{session.dateTime ? formatDateTime(session.dateTime) : 'TBD'}</p>
                    {session.reason && <p className="text-sm text-neutral-500 mt-1">Reason: {session.reason}</p>}
                    {session.notes && <p className="text-sm text-neutral-500 mt-1">Notes: {session.notes}</p>}
                    
                    {session.childId && (
                      <button
                        onClick={() => navigate(`/doctor/patients/${session.childId}`)}
                        className="mt-3 text-sm font-semibold text-primary-600 hover:text-primary-700 underline cursor-pointer block text-left"
                      >
                        🔎 Review Child Profile & Screening Records
                      </button>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    <Badge>{session.status}</Badge>
                    {session.status === 'pending' && (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => handleUpdateStatus(session.id, 'confirmed')}>
                          Confirm & Approve
                        </Button>
                        <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(session.id, 'cancelled')}>
                          Reject
                        </Button>
                      </div>
                    )}
                    {session.joinLink && (session.status === 'confirmed' || session.status === 'scheduled') && (
                      <Button size="sm" onClick={() => window.open(session.joinLink, '_blank')}>
                        Join Meeting
                      </Button>
                    )}
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
};
