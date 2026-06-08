import { useState, useEffect } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Modal } from '../../components/common/Modal';
import { bookingsService } from '../../services/api/bookingsService';
import { specialistsService } from '../../services/api/specialists';
import { treatmentPlansService } from '../../services/api/treatmentPlans';
import { BookingModal } from '../../components/specialists/BookingModal';
import type { Booking } from '../../types';
import type { Specialist } from '../../types';
import { Loader2 } from 'lucide-react';
import { getOrCreateSessionMeetingLink } from '../../utils/zoomHelper';


export const ParentSessions = () => {
  const [upcomingSessions, setUpcomingSessions] = useState<Booking[]>([]);
  const [pastSessions, setPastSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [connectedSpecialists, setConnectedSpecialists] = useState<Specialist[]>([]);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showSelectorModal, setShowSelectorModal] = useState(false);
  const [zoomAlert, setZoomAlert] = useState<string | null>(null);

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
    void fetchSessions();
    const loadConnectedSpecialists = async () => {
      try {
        const childId = localStorage.getItem('latestChildId') || 'child-1';
        const allBookings = await bookingsService.getMyBookings().catch(() => []);
        const allSpecs = await specialistsService.getSpecialists().catch(() => []);
        const plans = childId ? await treatmentPlansService.getChildPlans(childId).catch(() => []) : [];
        
        const connectedIds = new Set<string>();
        
        allBookings.forEach(b => {
          if (b.specialistId) connectedIds.add(String(b.specialistId));
          if ((b as any).SpecialistId) connectedIds.add(String((b as any).SpecialistId));
        });
        
        plans.forEach(p => {
          if ((p as any).specialistId) connectedIds.add(String((p as any).specialistId));
          if ((p as any).doctorId) connectedIds.add(String((p as any).doctorId));
          if ((p as any).therapistId) connectedIds.add(String((p as any).therapistId));
          if (Array.isArray((p as any).assignedTherapists)) {
            (p as any).assignedTherapists.forEach((tId: any) => connectedIds.add(String(tId)));
          }
        });
        
        const connected = allSpecs.filter(spec => connectedIds.has(String(spec.id)));
        
        setConnectedSpecialists(connected);
        if (connected.length > 0) {
          setSelectedSpecialist(connected[0]);
        }
      } catch (err) {
        console.warn('Unable to load connected specialists for session booking', err);
      }
    };
    void loadConnectedSpecialists();
  }, []);

  const [joiningZoom, setJoiningZoom] = useState<string | null>(null);

  const handleJoinZoom = async (session: Booking) => {
    console.log('[ZOOM] Parent Join Zoom handler clicked.');
    console.log('session:', session);
    console.log('session.meetingLink:', (session as any).meetingLink);
    console.log('session.zoomUrl:', session.zoomUrl);
    console.log('session.joinLink:', session.joinLink);

    setJoiningZoom(session.id);
    const newWindow = window.open('', '_blank');
    if (newWindow) {
      console.log('[ZOOM] window.open() executed successfully.');
    } else {
      console.warn('[ZOOM] window.open() returned null or was blocked.');
    }

    try {
      const link = await getOrCreateSessionMeetingLink(session, false);
      console.log('[ZOOM] getOrCreateSessionMeetingLink returned link:', link);

      if (newWindow) {
        newWindow.location.href = link;
      }
    } catch (err: any) {
      console.error('[ZOOM] Failed to join Zoom session:', err);
      if (newWindow) newWindow.close();
      const errMsg = err.message || 'No Zoom meeting link available.';
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

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Sessions</h1>
            <p className="text-slate-600 dark:text-slate-400">Manage your upcoming and past sessions</p>
          </div>
          <Button 
            onClick={() => {
              if (connectedSpecialists.length > 1) {
                setShowSelectorModal(true);
              } else if (connectedSpecialists.length === 1) {
                setSelectedSpecialist(connectedSpecialists[0]);
                setShowBookingModal(true);
              }
            }} 
            disabled={connectedSpecialists.length === 0}
          >
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
                    <Button 
                      onClick={() => {
                        if (connectedSpecialists.length > 1) {
                          setShowSelectorModal(true);
                        } else if (connectedSpecialists.length === 1) {
                          setSelectedSpecialist(connectedSpecialists[0]);
                          setShowBookingModal(true);
                        }
                      }}
                      disabled={connectedSpecialists.length === 0}
                    >
                      Book a Session
                    </Button>
                  </div>
                </Card>
              ) : (
                <div className="grid gap-4">
                  {upcomingSessions
                    .filter(s => s.status !== 'completed')
                    .map((session) => {
                      const canJoin = session.status === 'scheduled' || session.status === 'confirmed';
                      const meetingUrl = session.zoomUrl || session.joinLink || '';
                      return (
                        <Card key={session.id} className="border border-slate-200 dark:border-white/10 shadow-sm hover:shadow-md transition rounded-2xl p-5">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-lg text-slate-900 dark:text-white block">
                                  {session.reason || (session.specialistType === 'doctor' ? 'Clinical Consultation' : 'Therapy Session')}
                                </span>
                                <Badge variant={meetingUrl ? 'success' : 'warning'}>
                                  {meetingUrl ? '🟢 Zoom Available' : '🔴 No Zoom Link'}
                                </Badge>
                              </div>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                <p><strong>Child Name:</strong> {session.childName || 'Not Provided'}</p>
                                <p><strong>Parent Name:</strong> {session.parentName || 'Not Provided'}</p>
                                {session.specialistType === 'doctor' ? (
                                  <p><strong>Doctor Name:</strong> {session.doctorName || 'Not Assigned'}</p>
                                ) : (
                                  <p><strong>Therapist Name:</strong> {session.therapistName || 'Not Assigned'}</p>
                                )}
                              </div>

                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                <strong>Date & Time:</strong> {session.appointmentDate || 'TBD'} at {session.appointmentTime || 'TBD'}
                              </p>
                              {session.notes && <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-100 dark:border-white/5 font-mono text-xs">Session Note: {session.notes}</p>}
                            </div>
                            
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge variant={session.status === 'confirmed' || session.status === 'scheduled' ? 'success' : 'warning'}>
                                {session.status}
                              </Badge>
                              {(session.status !== 'pending' && session.status !== 'rejected') && (
                                <Button 
                                  size="sm" 
                                  onClick={() => handleJoinZoom(session)}
                                  disabled={joiningZoom === session.id || !meetingUrl}
                                  className={`font-semibold flex items-center gap-1 rounded-xl cursor-pointer ${
                                    joiningZoom === session.id || !meetingUrl
                                      ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                      : 'bg-blue-600 hover:bg-blue-700 text-white'
                                  }`}
                                  title={!meetingUrl ? 'No active meeting available' : ''}
                                >
                                  {joiningZoom === session.id ? (
                                    <>
                                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                      Connecting...
                                    </>
                                  ) : (
                                    <>
                                      🎥 Join Session
                                    </>
                                  )}
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
                    .map((session) => {
                      const meetingUrl = session.zoomUrl || session.joinLink || '';
                      return (
                        <Card key={session.id} className="border border-slate-200 dark:border-white/10 rounded-2xl p-5 bg-slate-50/50">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="space-y-2 flex-1">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-bold text-lg text-slate-900 dark:text-white block">
                                  {session.reason || (session.specialistType === 'doctor' ? 'Clinical Consultation' : 'Therapy Session')}
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600 dark:text-slate-400">
                                <p><strong>Child Name:</strong> {session.childName || 'Not Provided'}</p>
                                <p><strong>Parent Name:</strong> {session.parentName || 'Not Provided'}</p>
                                {session.specialistType === 'doctor' ? (
                                  <p><strong>Doctor Name:</strong> {session.doctorName || 'Not Assigned'}</p>
                                ) : (
                                  <p><strong>Therapist Name:</strong> {session.therapistName || 'Not Assigned'}</p>
                                )}
                              </div>

                              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                                <strong>Date & Time:</strong> {session.appointmentDate || 'TBD'} at {session.appointmentTime || 'TBD'}
                              </p>
                              {session.notes && <p className="text-sm text-slate-550 dark:text-slate-450 mt-2 bg-slate-100/50 p-3 rounded-xl">Session Summary: {session.notes}</p>}
                            </div>
                            <div className="flex items-center gap-3 shrink-0">
                              <Badge>Completed</Badge>
                              <Button 
                                size="sm" 
                                onClick={() => handleJoinZoom(session)}
                                disabled={joiningZoom === session.id || !meetingUrl}
                                className={`font-semibold flex items-center gap-1 rounded-xl cursor-pointer ${
                                  joiningZoom === session.id || !meetingUrl
                                    ? 'bg-slate-300 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                }`}
                                title={!meetingUrl ? 'No active meeting available' : ''}
                              >
                                {joiningZoom === session.id ? (
                                  <>
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                    Connecting...
                                  </>
                                ) : (
                                  <>
                                    🎥 Join Session
                                  </>
                                )}
                              </Button>
                            </div>
                          </div>
                        </Card>
                      );
                    })}
                </div>
              </div>
            )}
          </>
        )}
      </div>
      {showSelectorModal && (
        <Modal
          isOpen={showSelectorModal}
          onClose={() => setShowSelectorModal(false)}
          title="Select Connected Specialist"
        >
          <div className="space-y-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Choose a specialist from your treatment team to book a session with.
            </p>
            <div className="grid gap-3">
              {connectedSpecialists.map((spec) => {
                const isDoctor = spec.type === 'doctor';
                return (
                  <button
                    key={spec.id}
                    onClick={() => {
                      setSelectedSpecialist(spec);
                      setShowSelectorModal(false);
                      setShowBookingModal(true);
                    }}
                    className="w-full text-left p-4 rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-slate-900 hover:border-orange-500 hover:ring-2 hover:ring-orange-200 dark:hover:border-orange-500 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div>
                      <h4 className="font-bold text-slate-950 dark:text-white group-hover:text-orange-500 transition-colors">
                        {spec.name}
                      </h4>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                        {spec.specialization}
                      </p>
                    </div>
                    <span
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full ${
                        isDoctor
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                          : 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300'
                      }`}
                    >
                      {isDoctor ? '👨‍⚕️ Doctor' : '🧑‍🏫 Therapist'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </Modal>
      )}

      {selectedSpecialist && (
        <BookingModal
          open={showBookingModal}
          specialist={selectedSpecialist}
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
