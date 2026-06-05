import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { ROUTES } from '../../utils/constants';
import { bookingsService } from '../../services/api/bookingsService';
import { specialistsService } from '../../services/api/specialists';
import { BookingModal } from '../../components/specialists/BookingModal';
import type { Booking } from '../../types';
import type { Specialist } from '../../types';
import { formatDateTime } from '../../utils/dateUtils';

export const ParentSessions = () => {
  const navigate = useNavigate();
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [pastSessions, setPastSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [defaultSpecialist, setDefaultSpecialist] = useState<Specialist | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const upcoming = await bookingsService.getUpcomingBookings();
      const history = await bookingsService.getMyBookings();
      setUpcomingSessions(upcoming);
      setPastSessions(history);
    } catch (err) {
      console.error('Error fetching sessions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
    const loadDefaultSpecialist = async () => {
      try {
        const doctors = await specialistsService.getSpecialists('doctor');
        if (Array.isArray(doctors) && doctors.length > 0) {
          setDefaultSpecialist(doctors[0]);
        }
      } catch (err) {
        console.warn('Unable to load default specialist for session booking', err);
        setDefaultSpecialist({
          id: 'mock-specialist-1',
          type: 'doctor',
          name: 'AutiCare Care Specialist',
          specialization: 'Behavioral Support',
          yearsOfExperience: 5,
          rating: 4.8,
          reviewCount: 40,
          availableSlots: [],
        } as Specialist);
      }
    };
    void loadDefaultSpecialist();
  }, []);

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Sessions</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your upcoming and past sessions</p>
          </div>
          <Button onClick={() => setShowBookingModal(true)} disabled={!defaultSpecialist}>
            Book a New Session
          </Button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Upcoming / Requested Sessions */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Sessions & Requests</h2>
              {upcomingSessions.filter(s => s.status !== 'completed').length === 0 ? (
                <Card>
                  <div className="text-center py-12">
                    <div className="w-16 h-16 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-2xl">📅</div>
                    <p className="text-slate-600 dark:text-slate-400 mb-4">No active sessions or requests</p>
                    <Button onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}>
                      Book a Session
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingSessions
                    .filter(s => s.status !== 'completed')
                    .map((session) => {
                      const zoomLink = session.joinLink || 'https://zoom.us/j/9876543210';
                      const canJoin = session.status === 'scheduled' || session.status === 'confirmed';
                      return (
                        <Card key={session.id} className="border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition rounded-2xl p-5">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <p className="font-bold text-lg text-slate-900 dark:text-white">
                                👨‍⚕️ {session.specialistName || 'Specialist Consultation'}
                              </p>
                              <p className="text-slate-600 dark:text-slate-400 mt-1">
                                {session.dateTime ? formatDateTime(session.dateTime) : 'Preferred time scheduled'}
                              </p>
                              {session.reason && <p className="text-xs text-slate-500 mt-1">Reason: {session.reason}</p>}
                              {session.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5">Session Note: {session.notes}</p>}
                            </div>
                            <div className="flex items-center gap-3 self-start sm:self-center">
                              <Badge>{session.status}</Badge>
                              {canJoin && (
                                <Button 
                                  size="sm" 
                                  onClick={() => window.open(zoomLink, '_blank')}
                                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold flex items-center gap-1 rounded-xl cursor-pointer"
                                >
                                  🎥 Join Zoom Session
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Completed Sessions */}
            {(pastSessions.filter(s => s.status === 'completed').length > 0 || upcomingSessions.filter(s => s.status === 'completed').length > 0) && (
              <div className="space-y-4">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white mt-8">Completed Sessions</h2>
                <div className="grid gap-4">
                  {[...upcomingSessions, ...pastSessions]
                    .filter(s => s.status === 'completed')
                    // deduplicate by id
                    .filter((value, index, self) => self.findIndex(t => t.id === value.id) === index)
                    .map((session) => (
                      <Card key={session.id} className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 bg-slate-50/50">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                            <p className="font-bold text-lg text-slate-900 dark:text-white">
                              👨‍⚕️ {session.specialistName || 'Specialist Consultation'}
                            </p>
                            <p className="text-slate-600 dark:text-slate-400 mt-1">
                              {session.dateTime ? formatDateTime(session.dateTime) : 'TBD'}
                            </p>
                            {session.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 bg-slate-100/50 p-3 rounded-xl">Session Summary: {session.notes}</p>}
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
      {defaultSpecialist && (
        <BookingModal
          open={showBookingModal}
          specialist={defaultSpecialist}
          onClose={() => setShowBookingModal(false)}
          onBooked={() => {
            setShowBookingModal(false);
            void fetchSessions();
          }}
        />
      )}
    </MainLayout>
  );
};
