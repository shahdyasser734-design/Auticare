import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, FileText, Calendar, ChevronLeft, ClipboardList,
  AlertCircle, Loader2, Send, Eye, Edit3, Plus
} from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { useAuth } from '../../context/useAuth';
import { childrenService } from '../../services/api/children';
import type { Child } from '../../services/api/children';
import { bookingService } from '../../services/api/bookings';
import { dashboardService } from '../../services/api/dashboard';
import { screeningService } from '../../services/api/screening';
import { notesService } from '../../services/api/notes';
import type { Note } from '../../services/api/notes';
import { treatmentPlansService } from '../../services/api/treatmentPlans';
import type { TreatmentPlan } from '../../services/api/treatmentPlans';
import type { ScreeningResult } from '../../types';
import { NoteCard } from '../../components/notes/NoteCard';
import { TreatmentPlanDescription } from '../../components/treatmentPlans/TreatmentPlanDescription';
import apiClient from '../../services/apiClient';

// ─── helpers ────────────────────────────────────────────────────────────────

const riskColor = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300';
    case 'low':    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
    default:       return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

// A treatment plan is "published / visible" when its status is active or completed
// (not in a draft-like state). Therapists and Parents only see published plans.
const isPlanPublished = (plan: TreatmentPlan) => {
  const s = (plan.status || '').toLowerCase();
  return s === 'active' || s === 'completed' || s === 'published';
};

// ─── component ──────────────────────────────────────────────────────────────

export const PatientDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDoctor    = user?.role === 'doctor';
  const isTherapist = user?.role === 'therapist';

  // ── state ──
  const [patient,          setPatient]          = useState<Child | null>(null);
  const [screeningResults, setScreeningResults] = useState<ScreeningResult[]>([]);
  const [notes,            setNotes]            = useState<Note[]>([]);
  const [plans,            setPlans]            = useState<TreatmentPlan[]>([]);
  const [loading,          setLoading]          = useState(true);
  const [newNote,          setNewNote]          = useState('');
  const [savingNote,       setSavingNote]       = useState(false);
  const [receiverRole,     setReceiverRole]     = useState(
    isTherapist ? 'doctor' : 'parent'
  );

  // ── fetch ──
  useEffect(() => {
    if (!id) return;

    const load = async () => {
      try {
        // 1. Patient profile (fallback to bookings if 403)
        let childData: Child;
        try {
          childData = await childrenService.getChild(id);
        } catch {
          const [myBookings, dash] = await Promise.all([
            bookingService.getMyBookings(),
            dashboardService.getSpecialistDashboard().catch(() => null),
          ]);
          const bk = myBookings.find(b => String(b.childId) === String(id));
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const card = dash?.patientCards?.find((c: any) =>
            c.childName === bk?.childName || c.name === bk?.childName
          );
          childData = {
            id,
            name: bk?.childName || 'Patient',
            age: card?.age ?? card?.childAge ?? null,
            gender: card?.gender ?? '',
            status: 'active',
            parentId: bk?.parentId || '',
            dateOfBirth: card?.dateOfBirth ?? '',
          } as unknown as Child;
        }

        // 2. Supporting data – all non-fatal
        const [resultsRaw, notesRaw, plansRaw] = await Promise.all([
          screeningService.getResults(id).catch(() => []),
          notesService.getChildNotes(id).catch(() => []),
          treatmentPlansService.getChildPlans(id).catch(() => [] as TreatmentPlan[]),
        ]);

        // Filter notes so each role only sees their own thread
        const filteredNotes = (notesRaw as Note[]).filter(n =>
          !n.senderRole || !n.receiverRole ||
          n.senderRole === user?.role || n.receiverRole === user?.role
        );

        // Therapists see only PUBLISHED plans
        const visiblePlans = (plansRaw as TreatmentPlan[]).filter(p =>
          isDoctor ? true : isPlanPublished(p)
        );

        setPatient(childData);
        setScreeningResults(Array.isArray(resultsRaw) ? resultsRaw : [resultsRaw]);
        setNotes(filteredNotes);
        setPlans(visiblePlans);
      } catch (err) {
        console.error('[PatientDetails] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user?.role, isDoctor]);

  // ── save note ──
  const handleSaveNote = async () => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      const added = await notesService.createNote({
        title: 'Session Note',
        content: newNote,
        childId: id,
        senderRole: user?.role,
        receiverRole,
      });
      setNotes(prev => [added, ...prev]);
      setNewNote('');

      // best-effort notification
      try {
        await apiClient.post('/notifications', {
          userId: receiverRole === 'parent' ? (patient?.parentId || '') : receiverRole,
          title: 'New Session Note',
          message: `${user?.name || 'A specialist'} sent a new note about ${patient?.name || 'the patient'}.`,
          type: 'notes',
        });
      } catch { /* ignored */ }
    } catch (err) {
      console.error('[PatientDetails] Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // Render states
  // ────────────────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-primary-500" />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Loading patient details…</p>
        </div>
      </MainLayout>
    );
  }

  if (!patient) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-24 gap-4">
          <AlertCircle className="w-10 h-10 text-red-400" />
          <p className="text-slate-700 dark:text-slate-300 font-semibold">Patient not found.</p>
          <button
            onClick={() => navigate(-1)}
            className="text-sm text-primary-600 dark:text-primary-400 underline cursor-pointer"
          >
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  const patientName  = patient.name || 'Patient';
  const latestResult = screeningResults[0];
  const riskLevel    = latestResult?.riskLevel;

  return (
    <MainLayout>
      <div className="space-y-8 max-w-6xl mx-auto">

        {/* ── Back & Header ─────────────────────────────────────────────────── */}
        <div>
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 mb-5 transition-colors cursor-pointer"
          >
            <ChevronLeft size={16} /> Back
          </button>

          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-400 to-primary-700 flex items-center justify-center text-2xl font-bold text-white shadow-lg flex-shrink-0">
              {patientName.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-slate-900 dark:text-white">{patientName}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1">
                {patient.age  && <span className="text-sm text-slate-500 dark:text-slate-400">Age {patient.age}</span>}
                {patient.gender && patient.gender.toLowerCase() !== 'unknown' && (
                  <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">• {patient.gender}</span>
                )}
                {riskLevel && riskLevel.toLowerCase() !== 'unknown' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase ${riskColor(riskLevel)}`}>
                    {riskLevel} Risk
                  </span>
                )}
                {/* Role badge */}
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ml-auto">
                  {isDoctor ? '🩺 Doctor View' : '🧠 Therapist View'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Main Grid ──────────────────────────────────────────────────────── */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">

          {/* Screening Results */}
          <div className="standard-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList size={16} className="text-primary-500" /> Screening Results
              </h2>
              {screeningResults.length > 0 && (
                <button
                  onClick={() => navigate(`/specialist/screening-results/${id}`)}
                  className="text-xs text-primary-600 dark:text-primary-400 underline cursor-pointer font-semibold hover:opacity-80"
                >
                  Full results
                </button>
              )}
            </div>

            {screeningResults.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">No screening results yet.</p>
            ) : (
              <div className="space-y-3">
                {screeningResults.map((r, i) => (
                  <div key={i} className="p-3 bg-slate-50 dark:bg-slate-900/60 rounded-xl border border-slate-100 dark:border-white/5">
                    <div className="flex justify-between items-start">
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">{r.predictionClass}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase ${riskColor(r.riskLevel)}`}>
                        {r.riskLevel}
                      </span>
                    </div>
                    <div className="flex gap-4 text-xs text-slate-500 dark:text-slate-400 mt-2">
                      <span>AQ Score: <strong className="text-slate-700 dark:text-slate-300">{r.aqScore}</strong></span>
                      <span>Prob: <strong className="text-slate-700 dark:text-slate-300">{r.probability}</strong></span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">{new Date(r.createdAt).toLocaleDateString()}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Treatment Plan ─── role-aware */}
          <div className="standard-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" /> Treatment Plan
              </h2>
              {/* Doctor: create if none */}
              {isDoctor && plans.length === 0 && (
                <button
                  onClick={() => navigate(`/treatment-plan/${id}`)}
                  className="flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400 underline cursor-pointer font-semibold hover:opacity-80"
                >
                  <Plus size={12} /> Create
                </button>
              )}
            </div>

            {plans.length === 0 ? (
              <div className="text-center py-6">
                {isDoctor ? (
                  <>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No treatment plan yet.</p>
                    <button
                      onClick={() => navigate(`/treatment-plan/${id}`)}
                      className="px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer flex items-center gap-2 mx-auto"
                    >
                      <Plus size={14} /> Design Plan
                    </button>
                  </>
                ) : (
                  <p className="text-sm text-slate-500 dark:text-slate-400">
                    No published treatment plan yet.
                    <br />
                    <span className="text-xs opacity-70">It will appear here once the doctor publishes it.</span>
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {plans.map(p => (
                  <div key={p.id} className="p-4 bg-emerald-50/60 dark:bg-emerald-950/20 rounded-xl border border-emerald-100 dark:border-emerald-800/30">
                    <p className="font-bold text-slate-900 dark:text-white text-sm break-words">
                      {p.title || 'Development & Clinical Treatment Plan'}
                    </p>
                    <div className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                      <TreatmentPlanDescription
                        text={p.description}
                        fallbackText="Comprehensive multi-disciplinary intervention plan."
                      />
                    </div>
                    <div className="flex items-center justify-between mt-3 pt-3 border-t border-emerald-100 dark:border-emerald-800/20 text-xs">
                      <span className="text-slate-500 dark:text-slate-400">
                        Status: <span className="font-bold capitalize text-emerald-700 dark:text-emerald-300">{p.status || 'active'}</span>
                      </span>
                      <div className="flex gap-2">
                        {isDoctor ? (
                          <>
                            <button
                              onClick={() => navigate(`/treatment-plan/${id}`)}
                              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-600 dark:text-primary-400 font-semibold hover:shadow-md transition-all cursor-pointer"
                            >
                              <Edit3 size={11} /> Edit
                            </button>
                            <button
                              onClick={() => navigate(`/treatment-plan/${id}?action=new`)}
                              className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border border-green-200 dark:border-green-800 rounded-lg text-green-600 dark:text-green-400 font-semibold hover:shadow-md transition-all cursor-pointer"
                            >
                              <Plus size={11} /> Update
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => navigate(`/treatment-plan/${id}`)}
                            className="flex items-center gap-1 px-2 py-1 bg-white dark:bg-slate-900 border border-primary-200 dark:border-primary-800 rounded-lg text-primary-600 dark:text-primary-400 font-semibold hover:shadow-md transition-all cursor-pointer"
                          >
                            <Eye size={11} /> View
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Past Notes */}
          <div className="standard-card p-5 rounded-2xl space-y-4">
            <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User size={16} className="text-violet-500" /> Session Notes
            </h2>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {notes.length === 0 ? (
                <p className="text-sm text-slate-500 dark:text-slate-400">No notes yet.</p>
              ) : (
                notes.map(n => (
                  <NoteCard
                    key={n.id}
                    note={n}
                    onUpdate={updated => setNotes(prev => prev.map(x => x.id === updated.id ? updated : x))}
                    onDelete={deletedId => setNotes(prev => prev.filter(x => x.id !== deletedId))}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* ── Patient Info Card ──────────────────────────────────────────────── */}
        {(patient.dateOfBirth || patient.medicalHistory) && (
          <div className="standard-card p-5 rounded-2xl">
            <h2 className="font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={16} className="text-blue-500" /> Patient Information
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
              {patient.dateOfBirth && (
                <div>
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                    <Calendar size={11} className="inline mr-1" /> Date of Birth
                  </p>
                  <p className="text-slate-800 dark:text-slate-200">{new Date(patient.dateOfBirth).toLocaleDateString()}</p>
                </div>
              )}
              {patient.medicalHistory && (
                <div className="col-span-2">
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Medical History</p>
                  <p className="text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{patient.medicalHistory}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── Add Note ────────────────────────────────────────────────────────── */}
        <div className="standard-card p-5 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send size={16} className="text-primary-500" /> Add Session Note
          </h2>

          <div className="flex flex-col sm:flex-row gap-4">
            <div className="w-full sm:w-48">
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Send To</label>
              <select
                value={receiverRole}
                onChange={e => setReceiverRole(e.target.value)}
                className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                {isDoctor && <option value="parent">Parent</option>}
                {isDoctor && <option value="therapist">Therapist</option>}
                {isTherapist && <option value="doctor">Doctor</option>}
                {isTherapist && <option value="parent">Parent</option>}
              </select>
            </div>
          </div>

          <textarea
            value={newNote}
            onChange={e => setNewNote(e.target.value)}
            className="w-full p-4 border border-slate-200 dark:border-white/10 rounded-2xl bg-slate-50 dark:bg-slate-900/60 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none text-sm"
            rows={4}
            placeholder={`Write a note about ${patientName}…`}
          />

          <button
            onClick={handleSaveNote}
            disabled={!newNote.trim() || savingNote}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary-600 hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-colors cursor-pointer"
          >
            {savingNote ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            {savingNote ? 'Saving…' : 'Save & Send Note'}
          </button>
        </div>

      </div>
    </MainLayout>
  );
};
