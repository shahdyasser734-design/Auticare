import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/useAuth';
import { bookingsService } from '../../services/api/bookingsService';
import { treatmentPlansService } from '../../services/api/treatmentPlansService';
import { TreatmentPlanDescription } from '../../components/treatmentPlans/TreatmentPlanDescription';
import { specialistsService } from '../../services/api/specialistsService';
import { FileUpload } from '../../components/common/FileUpload';
import { fileUploadService } from '../../services/api/fileUploadService';
import { childrenService } from '../../services/api/children';
import { User, FileText, BarChart3, ArrowLeft, Loader2, Sparkles, Save, Download } from 'lucide-react';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const html2pdf: any = (await import('html2pdf.js')).default;
import type { Child, TreatmentPlan as TreatmentPlanType, Specialist } from '../../types';
import apiClient from '../../services/apiClient';



export const TreatmentPlan = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isDoctor    = user?.role?.toLowerCase() === 'doctor';
  const isParent    = user?.role?.toLowerCase() === 'parent';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [exporting, setExporting] = useState(false);

  // Ref for PDF export — targets only the treatment plan content card
  const pdfContentRef = useRef<HTMLDivElement>(null);
  
  const [exportToast, setExportToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (exportToast) {
      const timer = setTimeout(() => setExportToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [exportToast]);
  
  // Treatment Plan states
  const [plan, setPlan] = useState<TreatmentPlanType | null>(null);
  const [isEditingMode, setIsEditingMode] = useState(false);
  
  // Advanced fields
  const [clinicalAssessment, setClinicalAssessment] = useState('');
  const [diagnosisSummary, setDiagnosisSummary] = useState('');
  const [smartGoals, setSmartGoals] = useState('');
  const [interventionPlan, setInterventionPlan] = useState('');
  const [progressTracking, setProgressTracking] = useState('');
  const [generalNotes, setGeneralNotes] = useState('');

  const [progress, setProgress] = useState<'active' | 'completed' | 'paused'>('active');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');


  // File uploads
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadPlanData = async () => {
    if (!childId) return;
    try {
      setLoading(true);
      // 1. Fetch real child profile
      try {
        const childData = await childrenService.getChild(childId);
        if (childData) {
          setChild(childData);
        }
      } catch (err) {
        console.warn('Failed to load real child profile, fallback to booking data', err);
        const bookings = await bookingsService.getMyBookings();
        const booking = bookings.find(b => String(b.childId) === childId);
        if (booking) {
          setChild({
            id: booking.childId,
            name: booking.childName || 'Patient',
            parentId: booking.parentId || '',
            parentName: booking.parentName || 'Parent',
            age: null,
            gender: 'Unknown',
            dateOfBirth: '',
            status: 'active'
          } as unknown as Child);
        }
      }

      // 2. Fetch treatment plans for child
      const searchParams = new URLSearchParams(window.location.search);
      const isNewAction = searchParams.get('action') === 'new';
      
      let activePlan = null;
      
      if (!isNewAction) {
        const plans = await treatmentPlansService.getChildPlans(childId);
        if (plans && plans.length > 0) {
          // Backend is the authoritative gate. Whatever plan is returned is the one to show.
          activePlan = plans[0] as unknown as TreatmentPlanType;
        }
      }

      if (activePlan) {
        setPlan(activePlan);
        setIsEditingMode(activePlan.status !== 'PUBLISHED');
        try {
          const parsedGoal = JSON.parse(activePlan.goal || '{}');
          setSmartGoals(parsedGoal.smartGoals || '');
          setInterventionPlan(parsedGoal.interventionPlan || '');
        } catch {
          setSmartGoals(activePlan.goal || activePlan.goals?.join('\n') || '');
          setInterventionPlan('');
        }

        try {
          const parsedNotes = JSON.parse(activePlan.notes || '{}');
          setClinicalAssessment(parsedNotes.clinicalAssessment || '');
          setDiagnosisSummary(parsedNotes.diagnosisSummary || '');
          setProgressTracking(parsedNotes.progressTracking || '');
          setGeneralNotes(parsedNotes.generalNotes || '');
        } catch {
          setGeneralNotes(activePlan.notes || '');
          setClinicalAssessment('');
          setDiagnosisSummary('');
          setProgressTracking('');
        }
        setStartDate(activePlan.startDate ? activePlan.startDate.split('T')[0] : '');
        setEndDate(activePlan.endDate ? activePlan.endDate.split('T')[0] : '');
        setProgress((activePlan.progress || activePlan.status || 'active') as 'active' | 'completed' | 'paused');
        
        // Fetch specialist details who authored the plan
        if (activePlan.doctorId) {
          try {
            const specData = await specialistsService.getSpecialist(activePlan.doctorId);
            setSpecialist(specData);
          } catch (err) {
            console.warn('Could not load plan author details:', err);
          }
        }
      } else {
        // If no plan, child doesn't have one yet
        setPlan(null);
        setIsEditingMode(true);
      }
    } catch (err) {
      console.error('Error loading treatment plan:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */
  useEffect(() => {
    void loadPlanData();
  }, [childId]);
  /* eslint-enable react-hooks/set-state-in-effect, react-hooks/exhaustive-deps */

  const handleExportPdf = async () => {
    if (!plan || !pdfContentRef.current) return;
    setExporting(true);
    try {
      const element = pdfContentRef.current;
      
      const pdfHeader = document.getElementById('pdf-header');
      const pdfTitle = document.getElementById('pdf-title');
      const elementsToHide = document.querySelectorAll('[data-pdf-hide]');
      
      if (pdfHeader) pdfHeader.style.display = 'block';
      if (pdfTitle) pdfTitle.style.display = 'flex';
      elementsToHide.forEach(el => (el as HTMLElement).style.display = 'none');

      const htmlEl = document.documentElement;
      const wasDark = htmlEl.classList.contains('dark');
      if (wasDark) htmlEl.classList.remove('dark');
      
      // Ensure the DOM has time to apply the light mode styles before screenshotting
      await new Promise(resolve => setTimeout(resolve, 50));

      const opt = {
        margin:       [15, 15, 15, 15] as [number, number, number, number],
        filename:     `treatment-plan-${child?.name?.toLowerCase().replace(/\s+/g, '-') || 'patient'}.pdf`,
        image:        { type: 'jpeg' as const, quality: 1.0 },
        html2canvas:  { scale: 3, useCORS: true, backgroundColor: '#ffffff', windowWidth: 1024 },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(opt).from(element).save();

      if (wasDark) htmlEl.classList.add('dark');

      if (pdfHeader) pdfHeader.style.display = 'none';
      if (pdfTitle) pdfTitle.style.display = 'none';
      elementsToHide.forEach(el => (el as HTMLElement).style.display = '');

      setExportToast({ message: 'Treatment plan exported successfully', type: 'success' });
    } catch (err) {
      console.error('PDF export failed:', err);
      setExportToast({ message: 'Failed to export treatment plan. Please try again.', type: 'error' });
    } finally {
      setExporting(false);
    }
  };

  const handleSavePlan = async (targetStatus: 'DRAFT' | 'PUBLISHED') => {
    if (!childId) return;
    setSaving(true);
    try {
      const finalGoal = JSON.stringify({ smartGoals, interventionPlan });
      const finalNotes = JSON.stringify({ clinicalAssessment, diagnosisSummary, progressTracking, generalNotes });
      const finalEndDate = endDate ? new Date(endDate).toISOString() : null;

      let parentIds: string[] = [];
      let therapistIds: string[] = [];
      if (child) {
        parentIds = child.parentId ? [String(child.parentId)] : [];
      }
      try {
        const bookings = await bookingsService.getMyBookings();
        const childBookings = bookings.filter(b => String(b.childId) === childId);
        therapistIds = childBookings.filter(b => b.specialistType === 'therapist').map(b => String(b.specialistId)).filter(Boolean);
      } catch (err) {
        console.warn('Could not load therapist bookings for visibility check', err);
      }
      
      // Also include therapist IDs attached directly to the child profile
      if (child?.therapistId) therapistIds.push(String(child.therapistId));
      if (child?.specialistId) therapistIds.push(String(child.specialistId));
      if (child?.assignedTherapists) {
        therapistIds = [...therapistIds, ...child.assignedTherapists];
      }

      const doctorId = String(user?.id);
      const visibleTo = Array.from(new Set([...parentIds, ...therapistIds, doctorId]));

      if (plan?.id) {
        const updatePayload = {
          goal: finalGoal,
          notes: finalNotes,
          progress: progress,
          endDate: finalEndDate,
          visibleTo,
          status: targetStatus
        };
        
        console.log('[DEBUG] PUT Payload:', { planId: plan.id, payload: updatePayload });
        await treatmentPlansService.updatePlan(plan.id, updatePayload as Record<string, unknown>);
      } else {
        let finalSpecialistId: string | number = user?.id || 1;
        
        try {
          const bookings = await bookingsService.getMyBookings();
          const relevantBooking = bookings.find(b => 
            String(b.childId) === childId && b.specialistId
          ) || bookings.find(b => b.specialistId);
          
          if (relevantBooking?.specialistId) {
            finalSpecialistId = relevantBooking.specialistId;
          }
        } catch (err) {
          console.warn('[TREATMENT PLAN] Failed to get specialist from bookings:', err);
        }
        
        const createPayload = {
          childId: childId,
          specialistId: finalSpecialistId,
          startDate: new Date().toISOString(),
          endDate: finalEndDate,
          goal: finalGoal,
          notes: finalNotes,
          visibleTo,
          status: targetStatus
        };
        
        console.log('[DEBUG] POST Payload:', { childId, specialistId: finalSpecialistId, payload: createPayload });
        
          await treatmentPlansService.createPlan(createPayload as unknown as import('../../services/api/treatmentPlans').CreateTreatmentPlanRequest);
      }

      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
      
      try {
        if (targetStatus === 'PUBLISHED') {
          setIsEditingMode(false);
          // Notification to parent
          await apiClient.post('/notifications', {
            userId: child?.parentId || '',
            title: 'Treatment Plan Published',
            message: `Dr. ${user?.name || 'Specialist'} has published a new clinical plan for ${child?.name || 'your child'}.`,
            type: 'treatment-plan'
          });
        }
      } catch (err) {
        console.warn('Failed to dispatch notifications', err);
      }
      
      // Load current user profile details as author if new
      if (!specialist && user) {
        setSpecialist({
          id: user.id,
          name: user.name,
          type: user.role?.toLowerCase() === 'doctor' ? 'doctor' : 'therapist',
          specialization: user.role?.toLowerCase() === 'doctor' ? 'Pediatric Neurologist' : 'Clinical Therapist',
          yearsOfExperience: 8,
          rating: 4.9,
          reviewCount: 150,
          availableSlots: []
        });
      }

      // Wait for backend notifications (removed frontend mockState generation)

      // Refresh plan, child and dashboard data immediately
      await loadPlanData();

    } catch (err) {
      console.error('Error saving treatment plan:', err);
      const errMsg = err instanceof Error ? err.message : 'Failed to publish treatment plan. Please check all fields.';
      setPublishError(errMsg);
      setTimeout(() => setPublishError(null), 6000);
    } finally {
      setSaving(false);
    }
  };




  const handleFileUpload = async (file: File | null) => {
    if (!file) return;
    setUploading(true);
    try {
      const res = await fileUploadService.uploadFile(file, 'treatment-document');
      setUploadedDocs([...uploadedDocs, { name: res.fileName, url: res.url }]);
    } catch (err) {
      console.error('File upload failed:', err);
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="text-slate-500 animate-pulse font-medium">Loading clinical plans...</p>
        </div>
      </MainLayout>
    );
  }



  return (
    <MainLayout>
      <div className="max-w-6xl mx-auto space-y-6 pb-12">
        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to previous page
          </button>
          
          {!isEditingMode && plan && (
            <Button
              onClick={() => void handleExportPdf()}
              disabled={exporting}
              className="gap-2 bg-primary-600 hover:bg-primary-700 text-white shadow-md hover:shadow-lg transition-all px-5 py-2.5 rounded-full font-medium"
            >
              {exporting ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Exporting...</>
              ) : (
                <><Download className="h-4 w-4" /> Download Treatment Plan</>
              )}
            </Button>
          )}
        </div>

        {/* Success Banner */}
        {publishSuccess && (
          <div className="rounded-3xl border border-green-200 bg-green-50/50 dark:bg-green-950/20 p-5 flex items-start gap-4 animate-fade-in-down">
            <span className="text-2xl text-green-500">✅</span>
            <div>
              <p className="text-sm font-semibold text-green-800 dark:text-green-300 uppercase tracking-wider mb-1">
                Treatment Plan Published Successfully
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-350">
                The treatment plan has been saved successfully. Child profile and specialist dashboard have been updated.
              </p>
            </div>
          </div>
        )}


        {/* Error Banner */}
        {publishError && (
          <div className="rounded-3xl border border-red-200 bg-red-50/50 dark:bg-red-950/20 p-5 flex items-start gap-4 animate-fade-in-down">
            <span className="text-2xl text-red-500">❌</span>
            <div>
              <p className="text-sm font-semibold text-red-800 dark:text-red-300 uppercase tracking-wider mb-1">
                Failed to Publish Treatment Plan
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-350">
                {publishError}
              </p>
            </div>
          </div>
        )}

        {/* Clinical Disclaimer for Parents */}
        {isParent && (
          <div className="rounded-3xl border border-orange-200 bg-orange-50/50 dark:bg-orange-950/20 p-5 flex items-start gap-4">
            <span className="text-2xl text-orange-500">🛡️</span>
            <div>
              <p className="text-sm font-semibold text-orange-800 dark:text-orange-300 uppercase tracking-wider mb-1">
                Parent Development Support
              </p>
              <p className="text-sm text-slate-700 dark:text-slate-300">
                This plan is authored by certified professionals to assist your child's learning and clinical progression. Consult your pediatrician before altering therapy frequencies.
              </p>
            </div>
          </div>
        )}

        {/* Unified Layout */}
        {isDoctor && isEditingMode ? (
          /* Create & Edit Plan Mode (For Specialists) - Centered layout properly */
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <Card className="border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-primary-600" />
                  {plan?.id ? 'Edit Treatment Plan' : 'Create Treatment Plan'}
                </h3>
                <Badge variant="secondary">Specialist Editor</Badge>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Clinical Assessment</label>
                  <textarea
                    placeholder="Enter clinical assessment details..."
                    value={clinicalAssessment}
                    onChange={(e) => setClinicalAssessment(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Diagnosis Summary</label>
                  <textarea
                    placeholder="Enter diagnosis summary..."
                    value={diagnosisSummary}
                    onChange={(e) => setDiagnosisSummary(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={2}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">SMART Goals</label>
                  <textarea
                    placeholder="Enter SMART goals..."
                    value={smartGoals}
                    onChange={(e) => setSmartGoals(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Intervention Plan</label>
                  <textarea
                    placeholder="Enter intervention plan..."
                    value={interventionPlan}
                    onChange={(e) => setInterventionPlan(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Progress Tracking</label>
                  <textarea
                    placeholder="Enter progress tracking metrics..."
                    value={progressTracking}
                    onChange={(e) => setProgressTracking(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input
                    label="Start Date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                  />
                  <Input
                    label="End Date (Optional)"
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Progress</label>
                  <select
                    value={progress}
                    onChange={(e) => setProgress(e.target.value as 'active' | 'completed' | 'paused')}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                <div className="border-t pt-5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Notes / Comments</label>
                  <textarea
                    placeholder="Add personal internal consultation notes..."
                    value={generalNotes}
                    onChange={(e) => setGeneralNotes(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={3}
                  />
                </div>

                {/* Document Upload section */}
                <div className="border-t pt-5">
                  <FileUpload
                    label="Attach Treatment Documents / Reports"
                    onFileSelect={handleFileUpload}
                    description="Upload any reports or medical assessments to support this plan."
                    hint="Allowed formats: PDF, JPG, PNG up to 5MB"
                  />
                  {uploading && <p className="text-xs text-primary-500 mt-2 animate-pulse">Uploading file to server...</p>}
                  <div className="mt-3 space-y-1">
                    {uploadedDocs.map((doc, idx) => (
                      <div key={idx} className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <span>📎</span>
                        <a href={doc.url} target="_blank" rel="noreferrer" className="underline hover:text-primary-500 truncate max-w-[250px]">{doc.name}</a>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-6 border-t">
                <div className="flex justify-end gap-3 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => navigate(-1)} disabled={saving}>
                    Cancel
                  </Button>
                  {isDoctor && (
                    <div className="flex gap-2">
                      <Button onClick={(e) => { e.preventDefault(); void handleSavePlan('DRAFT'); }} disabled={saving} variant="outline" className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Saving...' : 'Save Draft'}
                      </Button>
                      <Button onClick={(e) => { e.preventDefault(); void handleSavePlan('PUBLISHED'); }} disabled={saving} className="gap-2">
                        <Save className="h-4 w-4" />
                        {saving ? 'Publishing...' : (plan?.id ? 'Publish Updates' : 'Publish Plan')}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          </div>
        ) : (
          /* View Mode Layout */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column: Summary Card */}
            <div className="lg:col-span-1 space-y-6">
              {/* Child Profile Widget */}
              {child && (
                <Card className="overflow-hidden border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl p-6 bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900/30 rounded-2xl flex items-center justify-center text-primary-600 font-bold text-lg">
                      {child.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white truncate">{child.name}</h3>
                      <div className="mt-1">
                        <Badge variant="secondary">Child Profile</Badge>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3 pt-3 border-t border-slate-200 dark:border-white/10 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Age</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{child.age ?? 'N/A'} yrs</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Gender</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 capitalize">{child.gender}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Medical History</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 text-right truncate max-w-[150px]" title={child.medicalHistory}>
                        {child.medicalHistory || 'None reported'}
                      </span>
                    </div>
                  </div>
                </Card>
              )}

              {/* Specialist Author Card */}
              {specialist && (
                <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <User size={20} className="text-primary-500" />
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Authoring Specialist</h4>
                  </div>
                  <div className="bg-slate-50 dark:bg-slate-950/40 rounded-2xl p-4 space-y-2">
                    <p className="font-bold text-slate-800 dark:text-slate-200">{specialist.name}</p>
                    <p className="text-xs text-primary-600 dark:text-primary-400 font-semibold">{specialist.specialization}</p>
                    <p className="text-xs text-slate-500">Experience: {specialist.yearsOfExperience} yrs · Rating: ★{specialist.rating}</p>
                  </div>
                </Card>
              )}

              {/* Progress Overview Section */}
              {plan && (
                <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                  <div className="flex items-center gap-3">
                    <BarChart3 size={20} className="text-green-500" />
                    <h4 className="font-bold text-lg text-slate-900 dark:text-white">Progress Overview</h4>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="flex justify-between text-xs font-semibold mb-1 text-slate-600 dark:text-slate-400">
                        <span>Goal Completion</span>
                        <span>{plan.progress === 'completed' ? 100 : plan.progress === 'active' ? 50 : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${plan.progress === 'completed' ? 100 : plan.progress === 'active' ? 50 : 0}%` }} />
                      </div>
                    </div>

                    <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-2xl border border-green-200/50 flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">Active Timeline</span>
                      <Badge variant="success">
                        <span className="capitalize">{plan.progress || plan.status || 'Active'}</span>
                      </Badge>
                    </div>
                  </div>
                </Card>
              )}
            </div>

            {/* Right Column: Main Treatment details */}
            <div className="lg:col-span-2 space-y-6">
              {!plan ? (
                <Card className="text-center py-20 border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl">
                  <div className="text-6xl mb-4">📋</div>
                  <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">No Treatment Plan</h2>
                  <p className="text-slate-600 dark:text-slate-400 max-w-md mx-auto mb-6">
                    A detailed clinical treatment plan hasn't been designed for this child profile yet.
                  </p>
                </Card>
              ) : (
                  <Card className="border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl p-6 md:p-8">
                    {/* PDF capture root */}
                    <div id="treatment-plan" ref={pdfContentRef}>
                    {/* PDF header visible only inside PDF — hidden from screen */}
                    <div className="hidden" style={{ display: 'none' }} aria-hidden="true" id="pdf-header">
                      <div style={{ padding: '20px', backgroundColor: '#f8fafc', borderRadius: '12px', marginBottom: '24px', border: '1px solid #e2e8f0' }}>
                        <h1 style={{ fontSize: '24px', color: '#0f172a', marginBottom: '16px', fontWeight: 'bold' }}>Treatment Plan Report</h1>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                          <div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>PATIENT INFORMATION</p>
                            <p style={{ fontSize: '16px', color: '#0f172a', margin: '0', fontWeight: 'bold' }}>{child?.name || 'N/A'}</p>
                            <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 0 0' }}>Age: {child?.age ?? 'N/A'} yrs | Gender: <span style={{textTransform: 'capitalize'}}>{child?.gender || 'N/A'}</span></p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>AUTHORING SPECIALIST</p>
                            <p style={{ fontSize: '16px', color: '#0f172a', margin: '0', fontWeight: 'bold' }}>{specialist?.name || 'N/A'}</p>
                            <p style={{ fontSize: '14px', color: '#475569', margin: '4px 0 0 0' }}>{specialist?.specialization || 'Clinical Specialist'}</p>
                          </div>
                        </div>

                        <hr style={{ borderColor: '#cbd5e1', margin: '16px 0', borderStyle: 'dashed' }} />
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                          <div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>TREATMENT STATUS</p>
                            <p style={{ fontSize: '14px', color: '#0f172a', margin: '0', fontWeight: 'bold', textTransform: 'capitalize' }}>
                              {plan?.status || 'Active'}
                            </p>
                          </div>
                          <div>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>PROGRESS OVERVIEW</p>
                            <p style={{ fontSize: '14px', color: '#0f172a', margin: '0', fontWeight: 'bold', textTransform: 'capitalize' }}>
                              {plan?.progress === 'completed' ? '100% (Completed)' : plan?.progress === 'active' ? '50% (Active)' : '0% (Paused)'}
                            </p>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 4px 0', fontWeight: 'bold' }}>REPORT DATE</p>
                            <p style={{ fontSize: '14px', color: '#0f172a', margin: '0', fontWeight: 'bold' }}>
                              {new Date().toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex justify-between items-center mb-6" data-pdf-hide>
                      <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <FileText className="text-primary-600" size={24} />
                        Treatment Plan Details
                      </h2>
                      {isDoctor && !isEditingMode && plan?.status === 'PUBLISHED' && (
                        <div className="flex gap-2">
                          <Button onClick={() => setIsEditingMode(true)} className="gap-2">
                            <Sparkles className="h-4 w-4" />
                            Edit Treatment Plan
                          </Button>
                        </div>
                      )}

                    </div>
                    {/* Title shown inside PDF */}
                    <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center gap-2 mb-6" style={{ display: 'none' }} id="pdf-title">
                      Treatment Plan Details {child ? `— ${child.name}` : ''}
                    </h2>
                    <div className="space-y-6">
                      <TreatmentPlanDescription plan={plan} fallbackText="No data available" />
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-4 border-t border-slate-200 dark:border-white/10">
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Progress</p>
                          <div className="capitalize inline-block">
                            <Badge variant="secondary">{plan.progress || plan.status || 'Active'}</Badge>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Start Date</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{plan.startDate ? new Date(plan.startDate).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">End Date</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{plan.endDate ? new Date(plan.endDate).toLocaleDateString() : 'Continuous'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Created Date</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">Last Updated</p>
                          <p className="font-semibold text-slate-800 dark:text-slate-200">{plan.updatedAt ? new Date(plan.updatedAt).toLocaleDateString() : 'N/A'}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Close pdfContentRef wrapper */}
                    </div>
                  </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Export Toast Notification */}
      {exportToast && (
        <div className={`fixed bottom-6 left-1/2 -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl flex items-center gap-3 z-[9999] animate-in slide-in-from-bottom-5 fade-in duration-300 ${
          exportToast.type === 'success' ? 'bg-green-600 text-white' : 'bg-red-600 text-white'
        }`}>
          {exportToast.type === 'success' ? '✅' : '❌'}
          <span className="font-semibold text-sm">{exportToast.message}</span>
        </div>
      )}
    </MainLayout>
  );
};
