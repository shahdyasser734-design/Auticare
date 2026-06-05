import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Avatar } from '../../components/common/Avatar';
import { childrenService, type Child } from '../../services/api/children';
import { screeningService } from '../../services/api/screening';
import { notesService, type Note } from '../../services/api/notes';
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
        const [childData, resultsData, notesData, plansData] = await Promise.all([
          childrenService.getChild(id),
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
  const patientDOB = patient.dateOfBirth ? new Date(patient.dateOfBirth).toLocaleDateString() : 'N/A';

  return (
    <MainLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-6">
          <Avatar name={patientName} size="xl" />
          <div>
            <h1 className="text-4xl font-bold text-neutral-900">{patientName}</h1>
            <p className="text-neutral-600">Age: {patient.age ?? 'N/A'} • Gender: {patient.gender}</p>
            <p className="text-neutral-600">DOB: {patientDOB}</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Screening Results */}
          <Card>
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Screening Results</h3>
            <div className="space-y-4">
              {screeningResults.length === 0 ? (
                <p className="text-neutral-500">No screening results available</p>
              ) : (
                screeningResults.map((result, idx) => (
                  <div key={idx} className="p-4 bg-neutral-50 rounded-xl border border-neutral-100">
                    <div className="flex justify-between items-start mb-2">
                      <p className="font-bold text-neutral-900">{result.predictionClass}</p>
                      <span className={`px-2 py-1 text-xs rounded-full font-bold uppercase ${
                        result.riskLevel === 'High' ? 'bg-red-100 text-red-700' :
                        result.riskLevel === 'Medium' ? 'bg-orange-100 text-orange-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {result.riskLevel} Risk
                      </span>
                    </div>
                    <div className="flex gap-4 text-sm mt-2">
                      <div>
                        <span className="text-neutral-500">AQ Score:</span>
                        <span className="ml-1 font-semibold">{result.aqScore}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500">Probability:</span>
                        <span className="ml-1 font-semibold">{result.probability}</span>
                      </div>
                    </div>
                    <p className="text-xs text-neutral-400 mt-2">{new Date(result.createdAt).toLocaleDateString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Active Treatment Plans */}
          <Card>
            <h3 className="text-xl font-bold text-neutral-900 mb-4 flex justify-between items-center">
              <span>Treatment Plans</span>
              <button 
                onClick={() => navigate(`/treatment-plan/${id}`)}
                className="text-xs text-primary-600 hover:text-primary-700 font-bold underline cursor-pointer"
              >
                {plans.length > 0 ? 'Edit Plan' : 'Create Plan'}
              </button>
            </h3>
            <div className="space-y-4">
              {plans.length === 0 ? (
                <div className="text-center py-6">
                  <p className="text-neutral-500 mb-4">No treatment plan configured</p>
                  <Button size="sm" onClick={() => navigate(`/treatment-plan/${id}`)}>
                    Design Plan
                  </Button>
                </div>
              ) : (
                plans.map((p) => (
                  <div key={p.id} className="p-4 bg-primary-50/50 rounded-xl border border-primary-100/50">
                    <p className="font-bold text-neutral-950">{p.title}</p>
                    <p className="text-xs text-neutral-600 truncate mt-1">{p.description}</p>
                    <div className="flex justify-between items-center mt-3 text-xs">
                      <span className="text-slate-500 font-semibold">Status: <span className="capitalize text-primary-700 font-bold">{p.status}</span></span>
                      <button
                        onClick={() => navigate(`/treatment-plan/${id}`)}
                        className="text-primary-600 hover:text-primary-700 font-bold underline cursor-pointer"
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
            <h3 className="text-xl font-bold text-neutral-900 mb-4">Past Notes</h3>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-neutral-500">No notes yet</p>
              ) : (
                notes.map((note) => (
                  <div key={note.id} className="p-3 bg-neutral-50 rounded-lg border border-neutral-100">
                    <p className="text-sm text-neutral-900">{note.content}</p>
                    <p className="text-xs text-neutral-500 mt-2">{new Date(note.createdAt).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        {/* Add New Note */}
        <Card>
          <h3 className="text-xl font-bold text-neutral-900 mb-4">Add Session Note</h3>
          <textarea
            value={newNote}
            onChange={(e) => setNewNote(e.target.value)}
            className="w-full p-4 border border-neutral-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
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
