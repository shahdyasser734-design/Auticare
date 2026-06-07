import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Badge } from '../../components/common/Badge';
import { Input } from '../../components/common/Input';
import { useAuth } from '../../context/useAuth';
import { childrenService } from '../../services/api/childrenService';
import { treatmentPlansService } from '../../services/api/treatmentPlansService';
import { specialistsService } from '../../services/api/specialistsService';
import { FileUpload } from '../../components/common/FileUpload';
import { fileUploadService } from '../../services/api/fileUploadService';
import { Activity, Plus, Trash2, CheckCircle2, User, FileText, BarChart3, Edit, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import type { Child, TreatmentPlan as TreatmentPlanType, Specialist } from '../../types';
import { cleanIntId } from '../../utils/zoomHelper';
import { mockState } from '../../services/api/mockState';

export const TreatmentPlan = () => {
  const { childId } = useParams<{ childId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const isSpecialist = user?.role === 'doctor' || user?.role === 'therapist';

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [child, setChild] = useState<Child | null>(null);
  const [specialist, setSpecialist] = useState<Specialist | null>(null);
  const [publishSuccess, setPublishSuccess] = useState(false);
  const [publishError, setPublishError] = useState<string | null>(null);
  
  // Treatment Plan states
  const [plan, setPlan] = useState<TreatmentPlanType | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState('');
  const [goals, setGoals] = useState<string[]>([]);
  const [newGoal, setNewGoal] = useState('');
  const [homeActivities, setHomeActivities] = useState<string[]>([]);
  const [newActivity, setNewActivity] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [notes, setNotes] = useState('');
  const [status, setStatus] = useState<'active' | 'completed' | 'paused'>('active');
  const [assignedTherapists, setAssignedTherapists] = useState<string[]>([]);


  // File uploads
  const [uploadedDocs, setUploadedDocs] = useState<{ name: string; url: string }[]>([]);
  const [uploading, setUploading] = useState(false);

  const loadPlanData = async () => {
    if (!childId) return;
    try {
      setLoading(true);
      // 1. Fetch child profile
      const childData = await childrenService.getChild(childId);
      setChild(childData);

      // 2. Fetch treatment plans for child
      const plans = await treatmentPlansService.getChildPlans(childId);
      if (plans && plans.length > 0) {
        const activePlan = plans[0] as any; // Cast to any for type compatibility
        setPlan(activePlan);
        setTitle(activePlan.title);
        setDescription(activePlan.description || '');
        setStartDate(activePlan.startDate ? activePlan.startDate.split('T')[0] : '');
        setEndDate(activePlan.endDate ? activePlan.endDate.split('T')[0] : '');
        setGoals(activePlan.goals || []);
        setStatus(activePlan.status || 'active');
        
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
        // If no plan and not specialist, child doesn't have one yet
        setPlan(null);
      }
    } catch (err) {
      console.error('Error loading treatment plan:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPlanData();
  }, [childId]);

  const handleSavePlan = async () => {
    if (!childId || !title.trim()) return;
    setSaving(true);
    try {
      let savedPlan: TreatmentPlanType;
      const finalNotes = notes.trim() || description.trim() || 'Development and Clinical Treatment Plan';
      
      if (plan?.id) {
        // Update plan expects UpdateTreatmentPlanRequest
        const updatePayload = {
          goal: goals.length > 0 ? goals.join('\n') : 'Development Plan',
          notes: finalNotes,
          progress: plan.progressOverview ? JSON.stringify(plan.progressOverview) : '',
          endDate: endDate ? new Date(endDate).toISOString() : null
        };
        await treatmentPlansService.updatePlan(plan.id, updatePayload as any);
        
        // Re-fetch to populate full state
        const plans = await treatmentPlansService.getChildPlans(childId);
        if (plans && plans.length > 0) {
          savedPlan = plans[0] as any;
        } else {
          savedPlan = {
            ...plan,
            goals,
            notes: finalNotes,
            description: description || finalNotes,
            endDate: endDate || undefined,
            updatedAt: new Date().toISOString()
          } as any;
        }
      } else {
        // Create plan expects CreateTreatmentPlanRequest
        const createPayload = {
          childId: cleanIntId(childId),
          specialistId: cleanIntId(user?.id || 1),
          startDate: startDate ? new Date(startDate).toISOString() : new Date().toISOString(),
          endDate: endDate ? new Date(endDate).toISOString() : null,
          goal: goals.length > 0 ? goals.join('\n') : 'Development Plan',
          notes: finalNotes
        };
        savedPlan = await treatmentPlansService.createPlan(createPayload as any) as any;
      }

      setPlan(savedPlan);
      setEditMode(false);
      setPublishSuccess(true);
      setTimeout(() => setPublishSuccess(false), 5000);
      
      // Load current user profile details as author if new
      if (!specialist && user) {
        setSpecialist({
          id: user.id,
          name: user.name,
          type: user.role === 'doctor' ? 'doctor' : 'therapist',
          specialization: user.role === 'doctor' ? 'Pediatric Neurologist' : 'Clinical Therapist',
          yearsOfExperience: 8,
          rating: 4.9,
          reviewCount: 150,
          availableSlots: []
        });
      }

      // Role-specific notifications creation
      try {
        let docName = user?.name || specialist?.name || 'Specialist';
        if (docName.toLowerCase().startsWith('dr. ')) {
          docName = docName.substring(4);
        } else if (docName.toLowerCase().startsWith('dr.')) {
          docName = docName.substring(3);
        }
        const formattedDocName = `Dr. ${docName.trim()}`;
        const childName = child?.name || 'Child';
        
        // 1. Parent notification
        const parentNotif = {
          id: `notif-tp-parent-${Date.now()}`,
          userId: child?.parentId || 'parent-123',
          type: 'treatment-plan' as const,
          title: 'Treatment Plan Published',
          message: `${formattedDocName} created a Treatment Plan for ${childName}`,
          content: `${formattedDocName} created a Treatment Plan for ${childName}`,
          isRead: false,
          createdAt: new Date().toISOString()
        };
        
        // 2. Therapist notification
        const therapistNotifs = (assignedTherapists.length ? assignedTherapists : ['Sarah Jenkins (Speech Therapist)']).map((_, idx) => {
          return {
            id: `notif-tp-therapist-${Date.now()}-${idx}`,
            userId: 'therapist-1',
            type: 'treatment-plan' as const,
            title: 'New Assignment',
            message: `New Treatment Plan assigned for ${childName}`,
            content: `New Treatment Plan assigned for ${childName}`,
            isRead: false,
            createdAt: new Date().toISOString()
          };
        });
        
        mockState.addNotification(parentNotif as any);
        therapistNotifs.forEach(notif => mockState.addNotification(notif as any));
        console.log('Appended mock notifications successfully using mockState.');
      } catch (notifErr) {
        console.warn('Could not store mock notifications:', notifErr);
      }

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

  const handleAddGoal = () => {
    if (!newGoal.trim()) return;
    setGoals([...goals, newGoal.trim()]);
    setNewGoal('');
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  const handleAddActivity = () => {
    if (!newActivity.trim()) return;
    setHomeActivities([...homeActivities, newActivity.trim()]);
    setNewActivity('');
  };

  const handleRemoveActivity = (index: number) => {
    setHomeActivities(homeActivities.filter((_, i) => i !== index));
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

          {isSpecialist && !editMode && (
            <Button
              onClick={() => {
                setEditMode(true);
                if (plan) {
                  setHomeActivities(homeActivities.length ? homeActivities : ['Sensory integration activities', 'Daily schedules with visual supports']);
                  setAssignedTherapists(assignedTherapists.length ? assignedTherapists : ['Sarah Jenkins (Speech Therapist)', 'Michael Chang (Occupational Therapist)']);
                  setRecommendations(recommendations || 'Regular occupational therapy twice a week. Consistent structure at home.');
                  setNotes(notes || 'Child shows high engagement during visual activities.');
                }
              }}
              className="bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold flex items-center gap-2 rounded-2xl shadow-lg shadow-primary-500/20"
            >
              <Edit size={16} />
              {plan ? 'Modify Treatment Plan' : 'Create Treatment Plan'}
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
        {!isSpecialist && (
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
        {editMode ? (
          /* Create & Edit Plan Mode (For Specialists) - Centered layout properly */
          <div className="max-w-4xl mx-auto w-full space-y-6">
            <Card className="border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl p-6 md:p-8 space-y-6">
              <div className="flex justify-between items-center border-b pb-4">
                <h3 className="font-bold text-2xl text-slate-900 dark:text-white flex items-center gap-2">
                  <Sparkles className="text-primary-600" />
                  Configure Clinical Plan
                </h3>
                <Badge variant="secondary">Specialist Editor</Badge>
              </div>

              <div className="space-y-4">
                <Input
                  label="Plan Title"
                  placeholder="e.g. Behavioral & Sensory Development Plan"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  fullWidth
                />

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Description Summary (Optional)</label>
                  <textarea
                    placeholder="e.g. Custom clinical pathway focusing on language stimulation, joint attention milestones, and behavioral routines..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={3}
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
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as 'active' | 'completed' | 'paused')}
                    className="w-full p-3.5 rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none focus:border-primary-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white text-sm"
                  >
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="paused">Paused</option>
                  </select>
                </div>

                {/* Dynamic Goals Editor */}
                <div className="border-t pt-5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Goals Configuration</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add new development target (e.g. increase response to name by 80%)"
                      value={newGoal}
                      onChange={(e) => setNewGoal(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleAddGoal(); }}
                      fullWidth
                    />
                    <Button onClick={handleAddGoal} className="px-4 shrink-0 rounded-2xl">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {goals.map((goal, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{goal}</span>
                        <button onClick={() => handleRemoveGoal(idx)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Dynamic Home Activities Editor */}
                <div className="border-t pt-5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Assigned Home Activities</label>
                  <div className="flex gap-2 mb-3">
                    <Input
                      placeholder="Add daily routine / home homework"
                      value={newActivity}
                      onChange={(e) => setNewActivity(e.target.value)}
                      onKeyPress={(e) => { if (e.key === 'Enter') handleAddActivity(); }}
                      fullWidth
                    />
                    <Button onClick={handleAddActivity} className="px-4 shrink-0 rounded-2xl">
                      <Plus size={18} />
                    </Button>
                  </div>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {homeActivities.map((act, idx) => (
                      <div key={idx} className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-950/40 rounded-xl border border-slate-100">
                        <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{act}</span>
                        <button onClick={() => handleRemoveActivity(idx)} className="text-red-500 hover:text-red-700 p-1">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recommendations */}
                <div className="border-t pt-5">
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Recommendations & Notes</label>
                  <textarea
                    placeholder="Input direct clinical guidelines for parents and therapists..."
                    value={recommendations}
                    onChange={(e) => setRecommendations(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm mb-4"
                    rows={3}
                  />
                  <textarea
                    placeholder="Add personal internal consultation notes..."
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={2}
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

              <div className="flex justify-end gap-3 pt-6 border-t">
                <Button variant="outline" onClick={() => setEditMode(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button onClick={handleSavePlan} disabled={saving || !title.trim()} className="bg-green-600 hover:bg-green-700 text-white font-semibold">
                  {saving ? 'Saving Pathway...' : 'Publish Treatment Plan'}
                </Button>
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
                        <span>{goals.length > 0 ? Math.round((goals.length - 1) / goals.length * 100) : 0}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div className="bg-green-500 h-full rounded-full" style={{ width: `${goals.length > 0 ? Math.round((goals.length - 1) / goals.length * 100) : 0}%` }} />
                      </div>
                    </div>

                    <div className="p-3 bg-green-50/50 dark:bg-green-950/20 rounded-2xl border border-green-200/50 flex justify-between items-center text-xs">
                      <span className="text-slate-600 dark:text-slate-300 font-semibold">Active Timeline</span>
                      <Badge variant="success">
                        <span className="capitalize">{status}</span>
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
                  {isSpecialist && (
                    <Button onClick={() => setEditMode(true)} className="rounded-2xl">
                      Create Treatment Plan Now
                    </Button>
                  )}
                </Card>
              ) : (
                <div className="space-y-6">
                  {/* Title & Timeline Summary */}
                  <Card className="border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl p-6 md:p-8 bg-gradient-to-r from-primary-50/30 to-transparent">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2">
                        <h2 className="text-3xl font-bold text-slate-900 dark:text-white">{title}</h2>
                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-200 dark:border-white/10">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Creation Date</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{plan.createdAt ? new Date(plan.createdAt).toLocaleDateString() : new Date().toLocaleDateString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Start Date</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{startDate ? new Date(startDate).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">End Date</p>
                        <p className="font-bold text-slate-800 dark:text-slate-200">{endDate ? new Date(endDate).toLocaleDateString() : 'Continuous evaluation'}</p>
                      </div>
                    </div>
                  </Card>

                  {/* Goals Checklist */}
                  <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="text-primary-600" size={22} />
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Active Goals</h3>
                    </div>
                    <div className="grid gap-3 pt-2">
                      {goals.length === 0 ? (
                        <p className="text-slate-500 text-sm">No structured goals configured.</p>
                      ) : (
                        goals.map((goal, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-4 bg-slate-50 dark:bg-slate-900/40 rounded-2xl border border-slate-100 dark:border-white/5 transition-all hover:border-primary-200">
                            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-medium">{goal}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Assigned Therapists */}
                  <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <User className="text-purple-500" size={22} />
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Assigned Specialists & Therapists</h3>
                    </div>
                    <div className="flex flex-wrap gap-2 pt-2">
                      {assignedTherapists.length === 0 ? (
                        assignedTherapists.concat(['Sarah Jenkins (Speech Therapist)', 'Michael Chang (Occupational Therapist)']).map((therapist, idx) => (
                          <Badge key={idx} variant="secondary">
                            {therapist}
                          </Badge>
                        ))
                      ) : (
                        assignedTherapists.map((therapist, idx) => (
                          <Badge key={idx} variant="secondary">
                            {therapist}
                          </Badge>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Home Activities */}
                  <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <Activity className="text-orange-500" size={22} />
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Home Activities & Routines</h3>
                    </div>
                    <div className="grid gap-3 pt-2">
                      {homeActivities.length === 0 ? (
                        homeActivities.concat(['Structured visual timers', 'Speech stimulation cards daily']).map((activity, idx) => (
                          <div key={idx} className="p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100/50 rounded-2xl flex gap-3 items-center">
                            <span className="text-lg">🏡</span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{activity}</p>
                          </div>
                        ))
                      ) : (
                        homeActivities.map((activity, idx) => (
                          <div key={idx} className="p-4 bg-orange-50/30 dark:bg-orange-950/10 border border-orange-100/50 rounded-2xl flex gap-3 items-center">
                            <span className="text-lg">🏡</span>
                            <p className="text-slate-700 dark:text-slate-300 text-sm font-semibold">{activity}</p>
                          </div>
                        ))
                      )}
                    </div>
                  </Card>

                  {/* Recommendations & Notes */}
                  <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
                    <div className="flex items-center gap-2">
                      <FileText className="text-cyan-500" size={22} />
                      <h3 className="font-bold text-xl text-slate-900 dark:text-white">Recommendations & Notes</h3>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-900/40 rounded-2xl p-5 border border-slate-100 dark:border-white/5 space-y-4">
                      <div>
                        <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Clinical Recommendations</p>
                        <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                          {recommendations || plan.description || 'No direct clinical recommendation recorded. Continue current activities.'}
                        </p>
                      </div>
                      {notes && (
                        <div className="pt-4 border-t border-slate-200 dark:border-white/5">
                          <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Clinical Note</p>
                          <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-medium">{notes}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
};
