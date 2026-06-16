import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  User, FileText, Calendar, ChevronLeft, ClipboardList,
  AlertCircle, Loader2, Send, Eye, Edit3, Plus, Video,
  Clock, CheckCircle2, XCircle, CalendarDays
} from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { useAuth } from '../../context/useAuth';
import { childrenService } from '../../services/api/children';
import type { Child } from '../../services/api/children';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../services/api/bookings';
import { dashboardService } from '../../services/api/dashboard';
import { screeningService } from '../../services/api/screening';
import { notesService } from '../../services/api/notes';
import type { Note } from '../../services/api/notes';
import { treatmentPlansService } from '../../services/api/treatmentPlans';
import type { TreatmentPlan } from '../../services/api/treatmentPlans';
import { sessionsService } from '../../services/api/sessionsService';
import type { TherapySession } from '../../types';
import type { ScreeningResult } from '../../types';
import { NoteCard } from '../../components/notes/NoteCard';
import { TreatmentPlanDescription } from '../../components/treatmentPlans/TreatmentPlanDescription';
import apiClient from '../../services/apiClient';

// ─── helpers ─────────────────────────────────────────────────────────────────

const riskColor = (level?: string) => {
  switch ((level || '').toLowerCase()) {
    case 'high':   return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    case 'medium': return 'bg-orange-100 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300';
    case 'low':    return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
    default:       return 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400';
  }
};

const sessionStatusColor = (status?: string) => {
  switch ((status || '').toLowerCase()) {
    case 'confirmed': case 'approved': case 'scheduled':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300';
    case 'completed':
      return 'bg-green-100 text-green-700 dark:bg-green-950/40 dark:text-green-300';
    case 'cancelled': case 'rejected':
      return 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300';
    default:
      return 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300';
  }
};

const sessionStatusIcon = (status?: string) => {
  const s = (status || '').toLowerCase();
  if (s === 'completed') return <CheckCircle2 size={13} />;
  if (s === 'cancelled' || s === 'rejected') return <XCircle size={13} />;
  return <Clock size={13} />;
};

const formatDateTime = (dateStr?: string, timeStr?: string) => {
  if (!dateStr) return '—';
  try {
    const dt = timeStr ? new Date(`${dateStr}T${timeStr}`) : new Date(dateStr);
    return dt.toLocaleString(undefined, {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return dateStr; }
};

// Treatment plan visibility:
// Backend is the authoritative gate.
// If the backend returns a plan, it is visible to the requesting user.
// Frontend NEVER filters plans by role — only UI actions differ by role.

// ─── component ───────────────────────────────────────────────────────────────

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
  const [bookings,         setBookings]         = useState<Booking[]>([]);
  const [therapySessions,  setTherapySessions]  = useState<TherapySession[]>([]);
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
        // ── 1. Fetch Dashboard & Core Dependencies First ─────────────────────
        const [dash, allMyBookings] = await Promise.all([
          dashboardService.getSpecialistDashboard().catch(() => null),
          bookingService.getMyBookings().catch(() => [] as Booking[]),
        ]);
        
        const bk = allMyBookings.find((b: Booking) => String(b.childId) === String(id));
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const card = dash?.patientCards?.find((c: any) =>
          c.childId === id || c.id === id || c.childName === bk?.childName || c.name === bk?.childName
        );

        // ── 2. Patient profile ─────────────────────────────────────────────────
        let childData: Child;
        try {
          childData = await childrenService.getChild(id);
        } catch {
          // Fallback: build from bookings when getChild() returns 403
          childData = {
            id,
            name: bk?.childName || card?.name || card?.childName || 'Patient',
            age: card?.age ?? card?.childAge ?? null,
            gender: card?.gender ?? '',
            status: 'active',
            parentId: bk?.parentId || card?.parentId || '',
            dateOfBirth: card?.dateOfBirth ?? '',
          } as unknown as Child;
        }

        // Hydrate roles from the rich dashboard card (or fallbacks)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childData as any).assignedDoctor = card?.assignedDoctor || bk?.doctorName || 'No Doctor Assigned';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childData as any).assignedDoctorId = card?.assignedDoctorId || (bk?.specialistType?.toLowerCase() === 'doctor' ? bk?.specialistId : undefined);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childData as any).assignedTherapist = card?.assignedTherapist || bk?.therapistName || 'Unassigned Therapist';
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (childData as any).assignedTherapistId = card?.assignedTherapistId || (bk?.specialistType?.toLowerCase() === 'therapist' ? bk?.specialistId : undefined);

        // ── 3. All supporting data in parallel ────────────────────────────────
        const [resultsRaw, notesRaw, plansRaw] = await Promise.all([
          screeningService.getResults(id).catch(() => []),
          notesService.getChildNotes(id).catch(() => []),
          treatmentPlansService.getChildPlans(id).catch(() => [] as TreatmentPlan[]),
        ]);

        // ── 4. Filter bookings to this specific child (sessions) ───────────────
        const childBookings = (allMyBookings as Booking[]).filter(
          (b: Booking) => String(b.childId) === String(id)
        );

        // ── 5. Fetch therapy sessions for each treatment plan ─────────────────
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const inlinePlan = (childData as any).treatmentPlan || (childData as any).TreatmentPlan;
        const allPlans = Array.isArray(plansRaw) ? [...plansRaw] : [];
        if (inlinePlan && !allPlans.find(p => p.id === inlinePlan.id)) {
          allPlans.push(inlinePlan);
        }
        
        // Unconditional dashboard hydration: inject treatment plan if missing
        if (allPlans.length === 0 && card?.treatmentPlan) {
          allPlans.push(card.treatmentPlan as TreatmentPlan);
        }
        let normalizedPlans = (allPlans as TreatmentPlan[]);
        if (isTherapist) {
          normalizedPlans = normalizedPlans.filter(p => p.status === 'active');
        }

        // Fetch therapy sessions from all visible plans (linked by treatmentPlanId)
        const therapySessionArrays = await Promise.all(
          normalizedPlans.map(p =>
            p.id
              ? sessionsService.getTreatmentSessions(p.id).catch(() => [] as TherapySession[])
              : Promise.resolve([] as TherapySession[])
          )
        );
        const allTherapySessions = therapySessionArrays.flat();

        // ── 5. Filter notes by role ────────────────────────────────────────────
        const filteredNotes = (notesRaw as Note[]).filter(n =>
          !n.senderRole || !n.receiverRole ||
          n.senderRole === user?.role || n.receiverRole === user?.role
        );

        setPatient(childData);
        setScreeningResults(Array.isArray(resultsRaw) ? resultsRaw : [resultsRaw]);
        setNotes(filteredNotes);
        setPlans(normalizedPlans);
        setBookings(childBookings);
        setTherapySessions(allTherapySessions);
      } catch (err) {
        console.error('[PatientDetails] Unexpected error:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [id, user?.role, user?.id, user?.name, isDoctor, isTherapist]);

  // ── save note ──
  const handleSaveNote = async () => {
    if (!id || !newNote.trim()) return;
    setSavingNote(true);
    try {
      // Resolve actual receiver ID
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const p = patient as any;
      let actualReceiverId = receiverRole === 'parent' ? p?.parentId : receiverRole;
      if (receiverRole === 'doctor' && p?.assignedDoctorId) actualReceiverId = p.assignedDoctorId;
      if (receiverRole === 'therapist' && p?.assignedTherapistId) actualReceiverId = p.assignedTherapistId;

      const added = await notesService.createNote({
        title: 'Session Note',
        content: newNote,
        childId: id,
        parentId: p?.parentId, // Ensure the parent receives it
        senderRole: user?.role,
        receiverRole,
        receiverId: actualReceiverId !== receiverRole ? actualReceiverId : undefined, // Only pass if we actually resolved an ID
        senderName: user?.name
      });
      setNotes(prev => [added, ...prev]);
      setNewNote('');
      try {
        if (actualReceiverId && actualReceiverId !== receiverRole) {
          await apiClient.post('/notifications', {
            userId: actualReceiverId,
            title: 'New Session Note',
            message: `${user?.name || 'A specialist'} sent a new note about ${patient?.name || 'the patient'}.`,
            type: 'notes',
          });
        }
      } catch { /* ignored */ }
    } catch (err) {
      console.error('[PatientDetails] Error saving note:', err);
    } finally {
      setSavingNote(false);
    }
  };

  // ── loading / error states ────────────────────────────────────────────────

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
          <button onClick={() => navigate(-1)} className="text-sm text-primary-600 dark:text-primary-400 underline cursor-pointer">
            Go back
          </button>
        </div>
      </MainLayout>
    );
  }

  const patientName  = patient.name || 'Patient';
  const latestResult = screeningResults[0];
  const riskLevel    = latestResult?.riskLevel;

  // Combine bookings + therapy sessions for the sessions panel
  // Sort newest first
  const sortedBookings = [...bookings].sort(
    (a, b) => new Date(b.dateTime ?? b.createdAt).getTime() - new Date(a.dateTime ?? a.createdAt).getTime()
  );

  const isLocked = bookings.length > 0 && bookings.every(b => {
    const s = (b.status || '').toLowerCase();
    return s === 'pending' || s === 'rejected';
  });

  const handleApprove = async () => {
    const pendingBooking = bookings.find(b => (b.status || '').toLowerCase() === 'pending');
    if (pendingBooking) {
      try {
        await bookingService.updateBookingStatus(pendingBooking.id, 'confirmed');
        window.location.reload();
      } catch (err) {
        console.error('Failed to approve:', err);
      }
    }
  };

  const handleReject = async () => {
    const pendingBooking = bookings.find(b => (b.status || '').toLowerCase() === 'pending');
    if (pendingBooking) {
      try {
        await bookingService.updateBookingStatus(pendingBooking.id, 'rejected');
        window.location.reload();
      } catch (err) {
        console.error('Failed to reject:', err);
      }
    }
  };

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
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-100 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 ml-auto">
                  {isDoctor ? '🩺 Doctor View' : '🧠 Therapist View'}
                </span>
              </div>
              <div className="mt-3 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-slate-600 dark:text-slate-400">
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p><strong className="text-slate-800 dark:text-slate-200">Doctor:</strong> {(patient as any).assignedDoctor || 'No Doctor Assigned'}</p>
                {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                <p><strong className="text-slate-800 dark:text-slate-200">Therapist:</strong> {(patient as any).assignedTherapist || 'Unassigned Therapist'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Top 3-Column Grid ──────────────────────────────────────────────── */}
        {isLocked ? (
          <div className="standard-card p-10 rounded-2xl text-center space-y-5 bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
            <div className="w-16 h-16 bg-amber-100 dark:bg-amber-900/50 rounded-full flex items-center justify-center mx-auto">
              <Clock className="w-8 h-8 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Case Pending Approval</h2>
              <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto">
                This patient has requested a session. You must approve the request to unlock clinical tools, treatment plans, and session access.
              </p>
            </div>
            
            {isDoctor && (
              <div className="flex items-center justify-center gap-4 pt-4">
                <button
                  onClick={handleReject}
                  className="px-6 py-2.5 bg-white dark:bg-slate-900 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 font-bold rounded-xl hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  Reject Request
                </button>
                <button
                  onClick={handleApprove}
                  className="flex items-center gap-2 px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition-colors shadow-lg shadow-emerald-600/20"
                >
                  <CheckCircle2 size={18} />
                  Approve Case
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
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

          {/* Treatment Plan */}
          <div className="standard-card p-5 rounded-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <FileText size={16} className="text-emerald-500" /> Treatment Plan
              </h2>
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
                    <br /><span className="text-xs opacity-70">It will appear here once the doctor publishes it.</span>
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
                    {/* Goals */}
                    {p.goals && p.goals.length > 0 && (
                      <ul className="mt-2 space-y-1">
                        {p.goals.slice(0, 3).map((g, gi) => (
                          <li key={gi} className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                            <span className="text-emerald-500 mt-0.5">•</span>{g}
                          </li>
                        ))}
                        {p.goals.length > 3 && (
                          <li className="text-xs text-slate-400">+{p.goals.length - 3} more goals…</li>
                        )}
                      </ul>
                    )}
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

          {/* Session Notes */}
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

        {/* ── Sessions / Appointments ────────────────────────────────────────── */}
        <div className="standard-card p-5 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CalendarDays size={16} className="text-blue-500" /> Sessions & Appointments
          </h2>

          {sortedBookings.length === 0 && therapySessions.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No sessions recorded yet.</p>
          ) : (
            <div className="space-y-3">

              {/* Bookings (doctor or therapist appointments) */}
              {sortedBookings.map(bk => (
                <div
                  key={bk.id}
                  className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sessionStatusColor(bk.status)}`}>
                        {sessionStatusIcon(bk.status)}
                        <span className="capitalize">{bk.status || 'Pending'}</span>
                      </span>
                      <span className="text-xs text-slate-500 dark:text-slate-400 capitalize">
                        {bk.specialistType || 'appointment'}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {bk.specialistName || 'Specialist Appointment'}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDateTime(bk.appointmentDate, bk.appointmentTime)}
                      {bk.duration ? ` • ${bk.duration} min` : ''}
                    </p>
                    {bk.notes && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 italic mt-1">"{bk.notes}"</p>
                    )}
                  </div>

                  {/* Zoom join link */}
                  {(bk.joinLink || bk.zoomUrl) && (bk.status === 'confirmed' || bk.status === 'approved' || bk.status === 'scheduled') && (
                    <a
                      href={bk.joinLink || bk.zoomUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      <Video size={13} /> Join Zoom
                    </a>
                  )}
                </div>
              ))}

              {/* Therapy sessions from treatment plans */}
              {therapySessions.map(ts => (
                <div
                  key={ts.id}
                  className="p-4 bg-violet-50/60 dark:bg-violet-950/20 rounded-xl border border-violet-100 dark:border-violet-800/30 flex flex-col sm:flex-row sm:items-center gap-3"
                >
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${sessionStatusColor(ts.status)}`}>
                        {sessionStatusIcon(ts.status)}
                        <span className="capitalize">{ts.status || 'scheduled'}</span>
                      </span>
                      <span className="text-xs text-violet-600 dark:text-violet-400 font-semibold">Therapy</span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {ts.title || 'Therapy Session'}
                    </p>
                    {ts.description && (
                      <p className="text-xs text-slate-500 dark:text-slate-400">{ts.description}</p>
                    )}
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar size={11} />
                      {formatDateTime(ts.scheduledDate, ts.scheduledTime)}
                      {ts.duration ? ` • ${ts.duration} min` : ''}
                    </p>
                  </div>

                  {/* Zoom join link from therapy session */}
                  {ts.joinLink && (ts.status === 'scheduled' || ts.status === 'ongoing') && (
                    <a
                      href={ts.joinLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold rounded-xl transition-colors whitespace-nowrap flex-shrink-0"
                    >
                      <Video size={13} /> Join Session
                    </a>
                  )}
                </div>
              ))}

            </div>
          )}
        </div>

        {/* ── Patient Information ────────────────────────────────────────────── */}
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
                  <p className="text-slate-800 dark:text-slate-200">
                    {new Date(patient.dateOfBirth).toLocaleDateString()}
                  </p>
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

        {/* ── Add Session Note ───────────────────────────────────────────────── */}
        <div className="standard-card p-5 rounded-2xl space-y-4">
          <h2 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send size={16} className="text-primary-500" /> Add Session Note
          </h2>
          <div className="w-full sm:w-48">
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wider mb-1.5">Send To</label>
            <select
              value={receiverRole}
              onChange={e => setReceiverRole(e.target.value)}
              className="w-full p-2 border border-slate-200 dark:border-white/10 rounded-xl bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
            >
              {isDoctor     && <option value="parent">Parent</option>}
              {isDoctor     && <option value="therapist">Therapist</option>}
              {isTherapist  && <option value="doctor">Doctor</option>}
              {isTherapist  && <option value="parent">Parent</option>}
              {user?.role === 'parent' && <option value="doctor">Doctor</option>}
              {user?.role === 'parent' && <option value="therapist">Therapist</option>}
            </select>
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
        </>
        )}

      </div>
    </MainLayout>
  );
};
