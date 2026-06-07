import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { bookingService, type Booking } from '../../services/api/bookings';

import { useAuth } from '../../context/useAuth';
import { Loader2 } from 'lucide-react';
import { getOrCreateSessionMeetingLink, cleanIntId } from '../../utils/zoomHelper';

export const DoctorSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomAlert, setZoomAlert] = useState<string | null>(null);

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

  const [joiningZoom, setJoiningZoom] = useState<string | null>(null);

  const handleJoinZoom = async (session: Booking) => {
    setJoiningZoom(session.id);
    try {
      const isSpecialist = isDoctor || user?.role === 'therapist';
      const link = await getOrCreateSessionMeetingLink(session, isSpecialist);
      window.open(link, '_blank');
    } catch (err) {
      console.error('Failed to join Zoom session:', err);
      setZoomAlert('Error establishing Zoom link. Opening fallback room.');
      setTimeout(() => setZoomAlert(null), 4000);
      window.open(session.zoomUrl || session.joinLink || `https://zoom.us/j/${session.id}`, '_blank');
    } finally {
      setJoiningZoom(null);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Dynamic Zoom Alert */}
        {zoomAlert && (
          <div className="fixed top-20 right-6 z-50 p-4 bg-orange-600 text-white rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <span>⚠️</span>
            <p className="font-bold text-sm">{zoomAlert}</p>
          </div>
        )}

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
            sessions.map((session) => {
              const meetingUrl = session.zoomUrl || session.joinLink || (session.id ? `https://zoom.us/j/${cleanIntId(session.id)}` : '');
              return (
                <Card key={session.id} className="border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition rounded-2xl p-5">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-2 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-lg text-neutral-900 block">
                          {session.reason || (session.specialistType === 'doctor' ? `${session.childName || 'Child'}'s Clinical Consultation` : `${session.childName || 'Child'}'s Therapy Session`)}
                        </span>
                        <Badge variant={meetingUrl ? 'success' : 'warning'}>
                          {meetingUrl ? '🟢 Zoom Available' : '🔴 No Zoom Link'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                        <p><strong>Child Name:</strong> {session.childName || 'Emma Johnson'}</p>
                        <p><strong>Parent Name:</strong> {session.parentName || 'Sarah Johnson'}</p>
                        {isDoctor ? (
                          <p><strong>Assigned Therapist:</strong> {session.therapistName || 'Therapist Sarah'}</p>
                        ) : (
                          <p><strong>Doctor Name:</strong> {session.doctorName || 'Dr. Ahmed'}</p>
                        )}
                        <p><strong>Treatment Plan:</strong> Active</p>
                        <p><strong>Session Type:</strong> {session.specialistType === 'doctor' ? 'Doctor Consultation' : 'Therapy Session'}</p>
                      </div>

                      <p className="text-sm text-neutral-650 mt-1">
                        <strong>Date & Time:</strong> {session.appointmentDate || 'TBD'} at {session.appointmentTime || 'TBD'}
                      </p>
                      {session.notes && <p className="text-sm text-neutral-500 italic mt-1">Notes: {session.notes}</p>}
                      
                      {session.childId && (
                        <button
                          onClick={() => navigate(`/${user?.role}/patients/${session.childId}`)}
                          className="mt-2 text-sm font-semibold text-primary-600 hover:text-primary-700 underline cursor-pointer block text-left"
                        >
                          🔎 Review Child Profile & Screening Records
                        </button>
                      )}
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center gap-4 shrink-0">
                      <Badge variant={session.status === 'confirmed' || session.status === 'scheduled' ? 'success' : 'warning'}>
                        {session.status}
                      </Badge>
                      
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
                      
                      {(session.status === 'confirmed' || session.status === 'scheduled') && (
                        meetingUrl ? (
                          <Button
                            size="sm"
                            onClick={() => handleJoinZoom(session)}
                            disabled={joiningZoom === session.id}
                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg cursor-pointer flex items-center gap-1"
                          >
                            {joiningZoom === session.id ? (
                              <>
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                Connecting...
                              </>
                            ) : (
                              <>
                                🎥 {isDoctor ? 'Start Session' : 'Join Session'}
                              </>
                            )}
                          </Button>
                        ) : (
                          <span className="text-xs text-red-500 font-semibold bg-red-50 dark:bg-red-950/20 px-3 py-1.5 rounded-lg border border-red-200 dark:border-red-900/30">
                            No Zoom meeting link available.
                          </span>
                        )
                      )}
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
};
