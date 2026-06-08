import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { bookingService, type Booking } from '../../services/api/bookings';

import { useAuth } from '../../context/useAuth';
import { Loader2 } from 'lucide-react';
import { chatServiceAPI } from '../../services/api/chatService';
import { getOrCreateSessionMeetingLink, cleanIntId } from '../../utils/zoomHelper';

export const DoctorSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');

  const fetchSessions = async () => {
    try {
      const data = await bookingService.getMyBookings();
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

  const handleCancelSession = async () => {
    if (!cancellingId || !cancelReason.trim()) return;
    try {
      await bookingService.cancelBooking(cancellingId, cancelReason, isDoctor ? 'doctor' : 'therapist');
      setCancellingId(null);
      setCancelReason('');
      fetchSessions();
    } catch (err) {
      console.error('Error cancelling session:', err);
    }
  };

  const [joiningZoom, setJoiningZoom] = useState<string | null>(null);
  const [zoomAlert, setZoomAlert] = useState<string | null>(null);

  const handleJoinZoom = async (session: Booking) => {
    setJoiningZoom(session.id);
    const newWindow = window.open('', '_blank');
    try {
      const link = await getOrCreateSessionMeetingLink(session, isDoctor);
      
      if (isDoctor && session.parentId) {
        try {
          const chat = await chatServiceAPI.startChat([session.parentId]);
          await chatServiceAPI.sendZoomLink(
            chat.id, 
            link, 
            session.appointmentDate, 
            session.appointmentTime,
            session.reason || 'Zoom Session Link'
          );
        } catch (chatErr) {
          console.warn('[ZOOM] Could not automatically send link to parent via chat:', chatErr);
        }
      }

      if (newWindow) {
        newWindow.location.href = link;
      }
    } catch (err: any) {
      console.error('Failed to join Zoom session:', err);
      if (newWindow) newWindow.close();
      const errMsg = err.message || 'Error establishing Zoom link.';
      setZoomAlert(errMsg);
      setTimeout(() => setZoomAlert(null), 4000);
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

        <div className="flex gap-4 border-b border-slate-200 dark:border-slate-700 mb-6">
          <button
            onClick={() => setActiveTab('upcoming')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'upcoming'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Active / Upcoming
          </button>
          <button
            onClick={() => setActiveTab('completed')}
            className={`px-4 py-2 font-semibold border-b-2 transition-colors ${
              activeTab === 'completed'
                ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400'
                : 'border-transparent text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Completed / Cancelled
          </button>
        </div>

        <div className="grid gap-4">
          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary-600" /></div>
          ) : (() => {
            const displaySessions = sessions.filter(s => {
              const st = (s.status || '').toLowerCase();
              if (activeTab === 'completed') return st === 'completed' || st === 'cancelled';
              return st !== 'completed' && st !== 'cancelled';
            });
            
            if (displaySessions.length === 0) {
              return (
                <Card>
                  <div className="text-center py-8">
                    <p className="text-neutral-600">No sessions in this category</p>
                  </div>
                </Card>
              );
            }

            return displaySessions.map((session) => {
              const meetingUrl = session.zoomUrl || session.joinLink || (session.id ? `https://zoom.us/j/${cleanIntId(session.id)}` : '');

              return (
                <Card key={session.id} className="border border-slate-300 dark:border-white/10 shadow hover:shadow-md transition-shadow rounded-2xl p-6 bg-white dark:bg-slate-900">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-extrabold text-xl text-slate-900 dark:text-white block">
                          {session.reason || (session.specialistType === 'doctor' ? `${session.childName || 'Child'}'s Clinical Consultation` : `${session.childName || 'Child'}'s Therapy Session`)}
                        </span>
                        <Badge variant={meetingUrl ? 'success' : 'warning'}>
                          {meetingUrl ? '🟢 Zoom Available' : '🔴 No Zoom Link'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Child Name:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.childName || 'Not Provided'}</span></p>
                        <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Parent Name:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.parentName || 'Not Provided'}</span></p>
                        {isDoctor ? (
                          <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Assigned Therapist:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.therapistName || 'Not Assigned'}</span></p>
                        ) : (
                          <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Assigned Doctor:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.doctorName || 'Not Assigned'}</span></p>
                        )}
                        <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Session Type:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.specialistType === 'doctor' ? 'Doctor Consultation' : 'Therapy Session'}</span></p>
                      </div>

                      <div className="mt-3 bg-white dark:bg-transparent rounded-lg">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                          <strong className="text-slate-900 dark:text-slate-100">Date & Time:</strong> {session.appointmentDate || 'TBD'} at {session.appointmentTime || 'TBD'}
                        </p>
                        {session.notes && <p className="text-sm text-slate-600 dark:text-slate-400 italic mt-2 bg-slate-100 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800">Notes: {session.notes}</p>}
                      </div>
                      
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
                      
                      
                      {(session.status === 'confirmed' || session.status === 'scheduled') && activeTab === 'upcoming' && (
                        <>
                          <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancellingId(session.id)}>
                            Cancel Session
                          </Button>
                          {meetingUrl ? (
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
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </Card>
              );
            });
          })()}
        </div>
      </div>

      {/* Cancel Modal */}
      {cancellingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Cancel Session</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">Please provide a reason for cancelling this session. This will be visible to the parent.</p>
            <textarea
              className="w-full p-3 border border-slate-300 dark:border-slate-700 rounded-xl mb-4 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={3}
              placeholder="Reason for cancellation..."
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
            />
            <div className="flex gap-3 justify-end">
              <Button variant="outline" onClick={() => { setCancellingId(null); setCancelReason(''); }}>
                Keep Session
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={handleCancelSession}
                disabled={!cancelReason.trim()}
              >
                Confirm Cancellation
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
