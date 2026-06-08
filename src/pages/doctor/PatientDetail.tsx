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

  useEffect(() => {
    const fetchPatientData = async () => {
      if (!id) return;
      try {
        let childData;
        try {
          childData = await childrenService.getChild(id);
        } catch (childErr) {
          console.warn('Could not fetch child profile directly (possibly 403), falling back to bookings search.', childErr);
          // Fallback: search my bookings to extract basic child info
          const [myBookings, dashData] = await Promise.all([
            bookingService.getMyBookings(),
            dashboardService.getSpecialistDashboard().catch(() => null)
          ]);
          const booking = myBookings.find(b => String(b.childId) === String(id));
          if (booking) {
            const card = dashData?.patientCards?.find((c: any) => c.childName === booking.childName || c.name === booking.childName);
            childData = {
              id: booking.childId?.toString() || id,
              name: booking.childName || 'Unknown Patient',
              age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
              gender: card?.gender ?? card?.childGender ?? card?.sex ?? 'Unknown',
              status: 'active',
              parentId: booking.parentId || '',
              parentName: booking.parentName || 'Parent',
              dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? card?.dob ?? card?.childDob ?? '',
            } as unknown as Child;
          } else {
            throw new Error('Patient not found in active bookings.');
          }
        }

        const [resultsData, notesData, plansData] = await Promise.all([
          screeningService.getResults(id).catch(() => []),
          notesService.getChildNotes(id).catch(() => []),
          treatmentPlansService.getChildPlans(id).catch(() => []),
        ]);
        
        setPatient(childData);
        setScreeningResults(Array.isArray(resultsData) ? resultsData : [resultsData]);
        setNotes(notesData);
        setPlans(plansData);
      } catch (err) {
        console.error('Error fetching patient data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchPatientData();
  }, [id]);

  const handleSaveNote = async () => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const addedNote = await notesService.createNote({
        title: 'Session Note',
        content: newNote,
        childId: id,
      });
      setNotes([addedNote, ...notes]);
      setNewNote('');
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
            <p className="text-slate-700 dark:text-slate-300">
              {patient.age ? `Age: ${patient.age}` : 'Age: Not Provided'}
              {' • '}
              {patient.gender && patient.gender.toLowerCase() !== 'unknown' ? `Gender: ${patient.gender.charAt(0).toUpperCase() + patient.gender.slice(1).toLowerCase()}` : 'Gender: Not Provided'}
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Screening Results */}
          <Card>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-4">Screening Results</h3>
            <div className="space-y-4">
              {screeningResults.length === 0 ? (
                <p className="text-slate-500 dark:text-slate-400">No screening results available</p>
              ) : (
                screeningResults.map((result, idx) => (
                  <div key={idx} className="p-4 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-slate-900 dark:text-white">{result.predictionClass}</p>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                        result.riskLevel === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300' :
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
              <button 
                onClick={() => navigate(`/treatment-plan/${id}`)}
                className="text-xs text-primary-600 dark:text-primary-450 hover:text-primary-750 font-bold underline cursor-pointer"
              >
                {plans.length > 0 ? 'Edit Plan' : 'Create Plan'}
              </button>
            </h3>
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-slate-500 dark:text-slate-400 mb-4">No treatment plan configured</p>
                  <Button size="sm" onClick={() => navigate(`/treatment-plan/${id}`)}>
                    Design Plan
                  </Button>
                </div>
              ) : (
                plans.map((p) => (
                  <div key={p.id} className="p-4 bg-primary-50/50 dark:bg-primary-950/20 rounded-xl border border-primary-100/50 dark:border-primary-500/20">
                    <p className="font-bold text-slate-900 dark:text-white">{p.title}</p>
                    <p className="text-xs text-slate-600 dark:text-slate-350 truncate mt-1">{p.description}</p>
                    <div className="flex justify-between items-center mt-3 text-xs">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold">Status: <span className="capitalize text-primary-700 dark:text-primary-300 font-bold">{p.status}</span></span>
                      <button
                        onClick={() => navigate(`/treatment-plan/${id}`)}
                        className="text-primary-600 dark:text-primary-450 hover:text-primary-700 font-bold underline cursor-pointer"
                      >
                        View Details
                      </button>
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
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-4 border border-slate-350 dark:border-white/10 rounded-2xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            rows={4}
            placeholder="Add notes about this patient..."
          />
          <Button 
            className="mt-4" 
            onClick={handleSaveNote} 
            disabled={!newNote.trim() || savingNote}
            isLoading={savingNote}
          >
            Save Note
          </Button>
        </Card>
      </div>
    </MainLayout>
  );
};
