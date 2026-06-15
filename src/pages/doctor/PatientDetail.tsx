import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { childrenService, type Child } from '../../services/api/children';
import { bookingService } from '../../services/api/bookings';
import { dashboardService } from '../../services/api/dashboard';
import { screeningService } from '../../services/api/screening';
import { notesService, type Note } from '../../services/api/notes';
import { NoteCard } from '../../components/notes/NoteCard';
import { treatmentPlansService, type TreatmentPlan } from '../../services/api/treatmentPlans';
import type { ScreeningResult } from '../../types';
import { useAuth } from '../../context/useAuth';
import apiClient from '../../services/apiClient';
import { TreatmentPlanDescription } from '../../components/treatmentPlans/TreatmentPlanDescription';

export const PatientDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [patient, setPatient] = useState<Child | null>(null);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [plans, setPlans] = useState<TreatmentPlan[]>([]);
  const { user } = useAuth();

  // Default selected receiver based on role
  const [selectedReceiverRole, setSelectedReceiverRole] = useState(user?.role === 'therapist' ? 'doctor' : 'parent');

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        let childData;
        try {
          childData = await childrenService.getChild(id);
        } catch {
          // getChild() failed (likely 403 for therapist) — fall back to booking data
          const [myBookings, dashData] = await Promise.all([
            bookingService.getMyBookings(),
            dashboardService.getSpecialistDashboard().catch(() => null)
          ]);
          const booking = myBookings.find(b => String(b.childId) === String(id));
          if (booking) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const card = dashData?.patientCards?.find((c: any) => c.childName === booking.childName || c.name === booking.childName);
            childData = {
              id: booking.childId?.toString() || id,
              name: booking.childName || 'Patient',
              age: card?.age ?? card?.childAge ?? null,
              gender: card?.gender ?? card?.childGender ?? '',
              status: 'active',
              parentId: booking.parentId || '',
              parentName: booking.parentName || '',
              dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? '',
            } as unknown as Child;
          } else {
            // No booking data either — render a minimal shell so the page loads
            childData = { id, name: 'Patient', status: 'active', parentId: '' } as unknown as Child;
          }
        }

        const [resultsData, notesData, plansData] = await Promise.all([
          screeningService.getResults(id).catch(() => []),
          notesService.getChildNotes(id).catch(() => []),
          treatmentPlansService.getChildPlans(id).catch(() => [] as TreatmentPlan[]),
        ]);

        const filteredNotes = notesData.filter((note: Note) =>
          !note.senderRole ||
          !note.receiverRole ||
          note.senderRole === user?.role ||
          note.receiverRole === user?.role
        );

        setPatient(childData);
        setScreeningResults(Array.isArray(resultsData) ? resultsData : [resultsData]);
        setNotes(filteredNotes);
        setPlans(plansData as TreatmentPlan[]);
      } catch (err) {
        console.error('[PatientDetail] Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id, user?.role]);

  const handleSaveNote = async () => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const addedNote = await notesService.createNote({
        title: 'Session Note',
        content: newNote,
        childId: id,
        senderRole: user?.role,
        receiverRole: selectedReceiverRole
      });
      setNotes([addedNote, ...notes]);
      setNewNote('');

      // Send notification to the target recipient
      try {
        await apiClient.post('/notifications', {
          userId: selectedReceiverRole === 'parent' ? patient?.parentId || '' : selectedReceiverRole,
          title: 'New Session Note',
          message: `${user?.name || 'A specialist'} has sent you a new note regarding ${patientName}.`,
          type: 'notes'
        });
      } catch (err) {
        console.warn('Failed to dispatch note notification', err);
      }
    } catch (err) {
      console.error('Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  if (loading) return <MainLayout><div className="flex justify-center py-12">Loading patient data...</div></MainLayout>;
  if (!patient) return <MainLayout><div className="text-center py-12">Patient not found</div></MainLayout>;

  const patientName = patient.name || 'Patient';

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Avatar name={patientName} size="xl" />
          <div>
            <h1 className="text-4xl font-bold text-slate-900 dark:text-white">{patientName}</h1>
            {screeningResults.length > 0 && screeningResults[0].riskLevel && screeningResults[0].riskLevel.toLowerCase() !== 'unknown' && (
              <div className="mt-2 mb-1">
                <span className={`inline-flex px-3 py-1 rounded-full text-xs font-bold uppercase ${screeningResults[0].riskLevel.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                    screeningResults[0].riskLevel.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' :
                      'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                  }`}>
                  {screeningResults[0].riskLevel} Risk
                </span>
              </div>
            )}
            <p className="text-slate-700 dark:text-slate-300 mt-1">
              {(() => {
                const infoParts = [];
                if (patient.age) infoParts.push(`Age: ${patient.age}`);
                if (patient.gender && patient.gender.toLowerCase() !== 'unknown') {
                  infoParts.push(`Gender: ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()}`);
                }
                return infoParts.join(' • ');
              })()}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Screening Results */}
          <Card>
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Screening Results</h3>
              {screeningResults.length > 0 && (
                <button
                  onClick={() => navigate(`/specialist/screening-results/${id}`)}
                  className="text-xs text-primary-600 dark:text-primary-450 hover:text-primary-750 font-bold underline cursor-pointer"
                >
                  View Full Results
                </button>
              )}
            </div>
            <div className="space-y-4">
              {screeningResults.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No screening results available</p>
              ) : (
                screeningResults.map((result, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-900 dark:text-white">{result.predictionClass}</p>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${result.riskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
                          result.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300' :
                            'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300'
                        }`}>
                        {result.riskLevel} Risk
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm mt-2">
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">AQ Score:</span>
                        <span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">{result.aqScore}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 dark:text-slate-400">Probability:</span>
                        <span className="ml-1 font-semibold text-slate-800 dark:text-slate-200">{result.probability}</span>
                      </div>
                    </div>
                    <p className="text-xs text-slate-400 dark:text-slate-550 mt-2">{new Date(result.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Treatment Plans */}
          <Card>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4 flex justify-between items-center">
              <span>Treatment Plans</span>
              {plans.length === 0 && user?.role === 'doctor' && (
                <button
                  onClick={() => navigate(`/treatment-plan/${id}`)}
                  className="text-xs text-primary-600 dark:text-primary-450 hover:text-primary-750 font-bold underline cursor-pointer"
                >
                  Create Plan
                </button>
              )}
            </h3>
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No treatment plan configured</p>
                  {user?.role === 'doctor' && (
                    <Button size="sm" onClick={() => navigate(`/treatment-plan/${id}`)}>
                      Design Plan
                    </Button>
                  )}
                </div>
              ) : (
                plans.map((p) => (
                  <div key={p.id} className="p-4 bg-primary-50/50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-500/20 flex flex-col gap-2">
                    <div>
                      <p className="font-bold text-slate-900 dark:text-white break-words">{p.title || 'Development and Clinical Treatment Plan'}</p>
                      <div className="mt-2">
                        <TreatmentPlanDescription text={p.description} fallbackText="Comprehensive multi-disciplinary intervention plan." />
                      </div>
                    </div>
                    <div className="flex justify-between items-center mt-2 text-xs border-t border-primary-100/50 dark:border-white/5 pt-3">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">
                        Status: <span className="capitalize text-primary-700 dark:text-primary-300 font-bold">{p.status || p.progress || 'active'}</span>
                      </span>
                      <div className="flex gap-2">
                        {user?.role === 'doctor' ? (
                          <>
                            <button
                              onClick={() => navigate(`/treatment-plan/${id}`)}
                              className="text-primary-600 dark:text-primary-400 hover:text-primary-800 font-bold underline cursor-pointer px-2 py-1 bg-white/50 dark:bg-slate-900/50 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900/30 transition-all hover:shadow-md"
                            >
                              Edit Treatment Plan
                            </button>
                            <button
                              onClick={() => navigate(`/treatment-plan/${id}?action=new`)}
                              className="text-green-600 dark:text-green-400 hover:text-green-800 font-bold underline cursor-pointer px-2 py-1 bg-green-50/50 dark:bg-green-900/30 rounded-lg shadow-sm border border-green-200 dark:border-green-900/30 transition-all hover:shadow-md"
                            >
                              Update Treatment Plan
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => navigate(`/treatment-plan/${id}`)}
                            className="text-primary-600 dark:text-primary-400 hover:text-primary-800 font-bold underline cursor-pointer px-2 py-1 bg-white/50 dark:bg-slate-900/50 rounded-lg shadow-sm border border-primary-100 dark:border-primary-900/30 transition-all hover:shadow-md"
                          >
                            View Treatment Plan
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Previous Notes */}
          <Card>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Past Notes</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <NoteCard
                    key={note.id}
                    note={note}
                    onUpdate={(updated) => setNotes(notes.map(n => n.id === updated.id ? updated : n))}
                    onDelete={(deletedId) => setNotes(notes.filter(n => n.id !== deletedId))}
                  />
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Add New Note */}
        <Card>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Add Session Note</h3>
          <div className="flex flex-col sm:flex-row gap-4 mb-4">
            <div className="w-full sm:w-1/3">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Send Note To</label>
              <select
                value={selectedReceiverRole}
                onChange={(e) => setSelectedReceiverRole(e.target.value)}
                className="w-full p-2.5 border border-slate-300 dark:border-white/10 rounded-xl standard-card text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm bg-white dark:bg-slate-900"
              >
                {user?.role === 'doctor' && <option value="parent">Parent</option>}
                {user?.role === 'doctor' && <option value="therapist">Therapist</option>}

                {user?.role === 'therapist' && <option value="doctor">Doctor</option>}
                {user?.role === 'therapist' && <option value="parent">Parent</option>}

                {user?.role === 'parent' && <option value="doctor">Doctor</option>}
                {user?.role === 'parent' && <option value="therapist">Therapist</option>}
              </select>
            </div>
          </div>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-4 border border-slate-350 dark:border-white/10 rounded-2xl standard-card text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            rows={4}
            placeholder="Add notes about this patient..."
          />
          <Button
            className="mt-4"
            onClick={handleSaveNote}
            disabled={!newNote.trim() || savingNote}
            isLoading={savingNote}
          >
            Save & Send Note
          </Button>
        </Card>
      </div>
    </MainLayout>
  );
};
