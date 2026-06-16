import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Badge } from '../../components/common/Badge';
import { Button } from '../../components/common/Button';
import { bookingService, type Booking } from '../../services/api/bookings';
import { useAuth } from '../../context/useAuth';
import { AttachmentViewer } from '../../components/common/AttachmentViewer';

import { Loader2 } from 'lucide-react';

export const DoctorSessions = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const isDoctor = user?.role === 'doctor';
  
  const [sessions, setSessions] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'upcoming' | 'completed'>('upcoming');
  const [cancellingId, setCancellingId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

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
    if (!id) return;
    try {
      setUpdateError(null);
      setUpdatingId(id);
      const updated = await bookingService.updateBookingStatus(id, newStatus);
      
      // Safely update state using the updated object or just the new status
      setSessions(prev => prev.map(s => s.id === id ? { ...s, ...(updated || {}), status: newStatus } : s));
      
      // Fetch in background to ensure consistency without unmounting
      void fetchSessions();
// eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      console.error('Error updating status:', err);
      const errMsg = err?.response?.data?.title || err?.response?.data?.detail || err?.message || 'Failed to update booking status.';
      setUpdateError(`Status Update Failed: ${errMsg}`);
    } finally {
      setUpdatingId(null);
    }
  };

  const handleCancelSession = async () => {
    if (!cancellingId) return;
    try {
      await bookingService.cancelBooking(cancellingId, cancelReason.trim() || undefined);
      setCancellingId(null);
      setCancelReason('');
      fetchSessions();
    } catch (err) {
      console.error('Error cancelling session:', err);
    }
  };


  const handleJoinZoom = async (session: Booking) => {
    const url = session.zoomUrl || session.joinLink;
    if (url) {
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }

    try {
      const chatServiceAPI = (await import('../../services/api/chatService')).chatServiceAPI;
      const chat = await chatServiceAPI.startChat(session.parentId || session.childId);
      const newZoomUrl = `https://zoom.us/j/${session.id}?pwd=${Math.random().toString(36).substring(7)}`;
      
      // Simulate sending via chat logic as requested
      console.log('[ZOOM] Generated meeting link:', newZoomUrl, 'for chat:', chat.id);
      
      // Open immediately to avoid popup blockers
      window.open(newZoomUrl, '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('[ZOOM] Failed to generate zoom via chat:', err);
      window.open(`https://zoom.us/j/${session.id}`, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        
        {updateError && (
          <div className="fixed top-20 right-6 z-50 p-4 bg-red-600 text-white rounded-2xl shadow-xl flex items-center gap-2 animate-bounce">
            <span>⚠️</span>
            <p className="font-bold text-sm">{updateError}</p>
            <button onClick={() => setUpdateError(null)} className="ml-2 font-bold hover:text-red-200">✕</button>
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
              const meetingUrl = session.zoomUrl || session.joinLink || '';

              // For title display, we still need to strip the "Attached File" text
              const cleanReason = session.reason?.replace(/(\n\n)?Attached File:\s*.+/, '').trim();

              return (
                <Card key={session.id} className="border border-slate-300 dark:border-white/10 shadow hover:shadow-md transition-shadow rounded-2xl p-6 standard-card">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-3 flex-1 overflow-hidden w-full">
                      <div className="flex flex-wrap items-center gap-3">
                        <span className="font-extrabold text-xl text-slate-900 dark:text-white block">
                          {cleanReason || (session.specialistType === 'doctor' ? `${session.childName || 'Child'}'s Clinical Consultation` : `${session.childName || 'Child'}'s Therapy Session`)}
                        </span>
                        <Badge variant={meetingUrl ? 'success' : 'warning'}>
                          {meetingUrl ? '🟢 Zoom Available' : '🔴 No Zoom Link'}
                        </Badge>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3 text-sm text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                        <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Child Name:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.childName || 'Not Provided'}</span></p>
                        <p><strong className="text-slate-900 dark:text-slate-100 uppercase text-xs tracking-wider">Parent Name:</strong><br /> <span className="font-medium text-slate-800 dark:text-slate-200">{session.parentName || 'Not Provided'}</span></p>
                      </div>

                      <div className="mt-3 bg-white dark:bg-transparent rounded-lg">
                        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium">
                          <strong className="text-slate-900 dark:text-slate-100">Date & Time:</strong> {session.appointmentDate || 'TBD'} at {session.appointmentTime || 'TBD'}
                        </p>
                        {session.notes && (
                          <div className="text-sm text-slate-600 dark:text-slate-400 mt-2 bg-slate-100 dark:bg-slate-900/40 p-3 rounded-lg border border-slate-200 dark:border-slate-800 w-full">
                            <AttachmentViewer content={session.notes} />
                          </div>
                        )}
                      </div>
                      
                      {session.childId && (
                        <button
                          onClick={() => {
                            if (session.childId) {
                              navigate(`/patients/${session.childId}`);
                            }
                          }}
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
                      
                      {session?.status === 'pending' && (
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            disabled={updatingId === session?.id}
                            onClick={() => handleUpdateStatus(session.id, 'confirmed')}
                          >
                            {updatingId === session?.id ? 'Processing...' : 'Confirm & Approve'}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline" 
                            disabled={updatingId === session?.id}
                            onClick={() => handleUpdateStatus(session.id, 'rejected')}
                          >
                            Reject
                          </Button>
                        </div>
                      )}
                      
                      
                      {(session.status === 'confirmed' || session.status === 'scheduled') && activeTab === 'upcoming' && (
                        <Button size="sm" variant="outline" className="border-red-200 text-red-600 hover:bg-red-50" onClick={() => setCancellingId(session.id)}>
                          Cancel Session
                        </Button>
                      )}

                      {(session.status !== 'pending' && session.status !== 'rejected') && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleJoinZoom(session)}
                            className="font-bold rounded-lg cursor-pointer flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            <>
                              🎥 {isDoctor ? 'Start Session' : 'Join Session'}
                            </>
                          </Button>
                          {activeTab === 'upcoming' && session.status !== 'completed' && session.status !== 'cancelled' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={async () => {
                                await handleUpdateStatus(session.id, 'completed');
                                alert('Session marked as completed.');
                              }}
                            >
                              Mark Completed
                            </Button>
                          )}
                        </div>
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
          <div className="standard-card max-w-md w-full p-6">
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
