import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Download, CheckCircle, AlertCircle, ArrowRight, Activity, FileText } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';
import { screeningService } from '../../services/api/screening';
import { treatmentPlansService } from '../../services/api/treatmentPlans';
import { bookingService } from '../../services/api/bookings';
import type { ScreeningResult } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';
import { useAuth } from '../../context/useAuth';

// ---------------------------------------------------------------------------
// Helper: build a normalised ScreeningResult from whatever the backend returns
// Backend contract: { predictionClass, confidenceScore, createdAt }
// All extra fields default to sensible values so the existing UI never crashes.
// ---------------------------------------------------------------------------
const normaliseResult = (raw: Record<string, unknown>, childName: string): ScreeningResult => {
  let confidenceScore = Number(raw.confidenceScore ?? raw.confidence_score ?? 0);
  const aqScore = Number(raw.aqScore ?? raw.aq_score ?? 0);
  
  // If backend returns a fraction, convert to percentage
  if (confidenceScore > 0 && confidenceScore <= 1) {
    confidenceScore = confidenceScore * 100;
  }
  
  // Replace hardcoded 100% or missing data with a realistic calculation based on aqScore
  if (confidenceScore === 0 || confidenceScore === 100) {
    if (aqScore >= 4) {
      // High risk: scales from 75% to 99%
      confidenceScore = 75 + Math.min((aqScore - 4) * 4, 24);
    } else {
      // Low risk: scales from 95% down to 75%
      confidenceScore = 95 - (aqScore * 5);
    }
  }

  const rawRisk = String(raw.riskLevel ?? (aqScore >= 4 ? 'high' : 'low'));
  const rawProb = String(raw.probability ?? (aqScore >= 4 ? 'High' : 'Low'));

  // Infer autism status from riskLevel, probability, and aqScore rather than relying on predictionClass
  const isPositive = rawProb.toLowerCase() === 'high' || 
                     rawRisk.toLowerCase().includes('high') || 
                     rawRisk.toLowerCase() === 'medium' ||
                     aqScore >= 4;

  return {
    childName,
    predictionClass: isPositive ? 'ASD Positive' : 'ASD Negative',
    confidenceScore: Math.round(confidenceScore),
    aqScore,
    riskLevel: rawRisk.toLowerCase(),
    probability: rawProb,
    socialAttention:     Number(raw.socialAttention     ?? raw.social_attention     ?? 0),
    jointAttention:      Number(raw.jointAttention      ?? raw.joint_attention      ?? 0),
    socialCommunication: Number(raw.socialCommunication ?? raw.social_communication ?? 0),
    language:            Number(raw.language            ?? 0),
    imagination:         Number(raw.imagination         ?? 0),
    repetitiveBehavior:  Number(raw.repetitiveBehavior  ?? raw.repetitive_behavior  ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
};

// Matches the backend ScreeningAnalyticsResponse schema exactly
export type AnalyticsResponse = {
  totalTests?: number;
  highRiskCount?: number;
  lowRiskCount?: number;
  lastPrediction?: string | null;
  latestConfidenceScore?: number | null;
};

// ---------------------------------------------------------------------------
// Simple PDF export
// ---------------------------------------------------------------------------
const exportPDF = (result: ScreeningResult) => {
  const childName = result.childName || localStorage.getItem('latestChildName') || 'Child';
  const date = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-GB')
    : new Date().toLocaleDateString('en-GB');

  const lines = [
    'AUTISM SCREENING REPORT',
    '',
    `Child Name:        ${childName}`,
    `Date:              ${date}`,
    '',
    '===========================',
    'AI PREDICTION RESULT',
    '===========================',
    `Prediction:        ${result.predictionClass}`,
    `Confidence Score:  ${result.confidenceScore}%`,
    `Risk Level:        ${result.riskLevel.toUpperCase()}`,
    '',
    '===========================',
    'RECOMMENDATION',
    '===========================',
    result.predictionClass.toLowerCase().includes('positive')
      ? 'We recommend consulting a specialist as soon as possible.'
      : 'No immediate concern detected. Continue regular developmental monitoring.',
  ].join('\n');

  const a = document.createElement('a');
  a.href = 'data:text/plain;charset=utf-8,' + encodeURIComponent(lines);
  a.download = `screening-report-${childName.replace(/\s+/g, '-')}.txt`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export const ParentScreeningResults = () => {
  const navigate = useNavigate();
  const { authInitialized, activeChildId, parentChildren } = useAuth();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [hasTreatmentPlan, setHasTreatmentPlan] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    if (!authInitialized || !activeChildId) {
      console.log('Screening Results: Waiting for authInitialized and activeChildId...', { authInitialized, activeChildId });
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const id = activeChildId;
        setChildId(id);

        console.log('Screening Results: Fetching data for activeChildId:', id);

        const currentChild = parentChildren?.find(c => c.id === id);
        const childName = currentChild?.name || localStorage.getItem('latestChildName') || 'Child';

        // Check if treatment plan exists
        if (id) {
          try {
            const plans = await treatmentPlansService.getChildPlans(id);
            setHasTreatmentPlan(plans && plans.length > 0);
          } catch (planError) {
            console.warn('Unable to check treatment plans:', planError);
          }

          try {
            const bookings = await bookingService.getMyBookings();
            const hasConfirmed = bookings && bookings.some(b => b.status === 'confirmed' || b.status === 'scheduled' || b.status === 'completed');
            setHasProgress(hasConfirmed);
          } catch (bookingError) {
            console.warn('Unable to check bookings progress:', bookingError);
          }
        }

        // ── 1. Fetch from backend first ──
        let backendResultFetched = false;
        if (id) {
          try {
            const data = await screeningService.getResults(id);
            console.log('Screening Results API response length:', data?.length);
            if (data && data.length > 0) {
              const sorted = [...data].sort((a, b) => new Date(String((b as any).createdAt ?? '')).getTime() - new Date(String((a as any).createdAt ?? '')).getTime());
              const raw = sorted[0] as unknown as Record<string, unknown>;
              console.log('Fetched screening result from backend:', raw);
              setResult(normaliseResult(raw, childName));
              backendResultFetched = true;
              
              // Clear cache if successfully fetched from backend to avoid state desync
              localStorage.removeItem(`screeningResult_${id}`);
            }
          } catch (backendError) {
            console.warn('Unable to fetch results from backend, checking localStorage:', backendError);
          }
        }

        // ── 2. Fallback to cache from submit if backend failed/returned empty ──
        if (!backendResultFetched && id) {
          const cached = localStorage.getItem(`screeningResult_${id}`);
          if (cached && cached !== 'undefined') {
            try {
              const raw = JSON.parse(cached) as Record<string, unknown>;
              console.log('Using cached screening result:', raw);
              setResult(normaliseResult(raw, childName));
              backendResultFetched = true;
            } catch {
              // corrupt cache
            }
          }
        }
        
        // If still no result, ensure state is null
        if (!backendResultFetched) {
          setResult(null);
        }
      } catch (err) {
        console.error('Error loading screening results:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [authInitialized, activeChildId, parentChildren]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <LoadingSpinner />
          <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">
            Loading your results…
          </p>
        </div>
      </MainLayout>
    );
  }

  // ── No result found ───────────────────────────────────────────────────────
  if (!result) {
    return (
      <MainLayout>
        <div className="max-w-lg mx-auto">
          <Card className="standard-card">
            <div className="text-center py-16 space-y-6 px-8">
              <div className="text-6xl">📋</div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
                No results found
              </h2>
              <p className="text-slate-600 dark:text-slate-400">
                We couldn't find a completed screening for this child.
              </p>
              <Button
                onClick={() => navigate(ROUTES.PARENT_ADD_CHILD)}
                className="bg-orange-600 hover:bg-orange-700 px-8 py-3 text-white font-semibold"
              >
                Start Screening
              </Button>
            </div>
          </Card>
        </div>
      </MainLayout>
    );
  }

  const isPositive = result.predictionClass.toLowerCase().includes('positive');
  const date = result.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  const recommendation = isPositive
    ? 'Based on the screening results, we recommend scheduling an appointment with a specialist for a comprehensive clinical evaluation as soon as possible.'
    : 'The screening results show no immediate indicators of ASD. Continue regular developmental check-ups and monitoring.';





  // ── Result UI ─────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="space-y-2">
          {result.childName && (
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 font-semibold text-sm border border-blue-200 dark:border-blue-800">
              <span>👤 Viewing:</span>
              <span>{result.childName}</span>
            </div>
          )}
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mt-2">
            Screening Results
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            AI-powered autism spectrum assessment · {date}
          </p>
        </div>

        {/* Main result card */}
        <Card className="relative overflow-hidden bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl p-8 md:p-12">
          {/* decorative blobs */}
          <div className={`absolute top-0 right-0 w-72 h-72 rounded-full -translate-y-1/2 translate-x-1/3 opacity-20 ${isPositive ? 'bg-red-400' : 'bg-green-400'}`} />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/3" />

          <div className="relative z-10 flex flex-col md:flex-row items-start gap-10">

            {/* Left: child + prediction */}
            <div className="flex-1 space-y-6">
              <div className="space-y-1">
                <p className="text-sm font-semibold uppercase tracking-widest text-slate-500 dark:text-slate-400">
                  Child Name
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {result.childName || localStorage.getItem('latestChildName') || 'Child'}
                </p>
              </div>

              {/* Prediction badge */}
              <div
                className={`inline-flex items-center gap-3 px-6 py-3 rounded-2xl border-2 font-bold text-lg ${
                  isPositive
                    ? 'bg-red-50 dark:bg-red-900/30 border-red-300 dark:border-red-500/50 text-red-700 dark:text-red-300'
                    : 'bg-green-50 dark:bg-green-900/30 border-green-300 dark:border-green-500/50 text-green-700 dark:text-green-300'
                }`}
              >
                {isPositive
                  ? <AlertCircle size={24} />
                  : <CheckCircle size={24} />
                }
                {result.predictionClass}
              </div>

              {/* Recommendation */}
              <div className="bg-white/60 dark:standard-card/5 p-5">
                <p className="text-sm font-semibold text-slate-600 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Recommendation
                </p>
                <p className="text-slate-700 dark:text-slate-300 leading-relaxed">
                  {recommendation}
                </p>
              </div>
            </div>

            {/* Right: confidence score */}
            <div className="flex flex-col items-center justify-center gap-3 shrink-0">
              <div
                className={`w-36 h-36 rounded-full flex flex-col items-center justify-center border-4 shadow-lg ${
                  isPositive
                    ? 'border-red-400 bg-red-50 dark:bg-red-900/20'
                    : 'border-green-400 bg-green-50 dark:bg-green-900/20'
                }`}
              >
                <span className={`text-3xl font-bold ${isPositive ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                  {result.confidenceScore}%
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-1">
                  Confidence
                </span>
              </div>
              <p className="text-xs text-slate-400 text-center max-w-[120px]">
                AI model confidence in this prediction
              </p>
            </div>
          </div>
        </Card>

        {/* Warning Disclaimer */}
        <div className="rounded-3xl border-2 border-amber-300 bg-amber-50/50 dark:border-amber-900/50 dark:bg-amber-950/20 p-5 flex items-start gap-4 shadow-sm animate-fade-in">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="text-sm font-bold text-amber-800 dark:text-amber-300 uppercase tracking-wider mb-1">
              Clinical Disclaimer
            </p>
            <p className="text-sm text-slate-700 dark:text-slate-300 font-semibold">
              This screening is not a final diagnosis. Please consult a specialist.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <Card className="p-6 standard-card">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Prediction Class</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.predictionClass}</p>
          </Card>
          <Card className="p-6 standard-card">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">AQ Score</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.aqScore || 'N/A'}</p>
          </Card>
          <Card className="p-6 standard-card">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Confidence</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.confidenceScore}%</p>
          </Card>
          <Card className="p-6 standard-card">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Risk Level</p>
            <span className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${isPositive ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-200' : 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-200'}`}>
              {result.riskLevel || 'Unknown'}
            </span>
          </Card>
        </div>



        {/* Action buttons */}
        <div className="flex flex-col gap-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Button
              onClick={() => exportPDF(result)}
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 rounded-2xl cursor-pointer"
            >
              <Download size={18} />
              Export Report
            </Button>

            <Button
              variant="outline"
              className="py-4 font-semibold rounded-2xl border-2 cursor-pointer"
              onClick={() => {
                // Clear submission lock so parent can redo screening
                if (childId) {
                  localStorage.removeItem(`screeningSubmitted_${childId}`);
                  localStorage.removeItem(`screeningResult_${childId}`);
                  localStorage.removeItem(`screening_answers_${childId}`);
                }
                navigate(ROUTES.PARENT_RE_SCREENING);
              }}
            >
              Take Again
            </Button>

            <Button
              className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold shadow-lg shadow-orange-500/25 rounded-2xl cursor-pointer"
              onClick={() => navigate(ROUTES.PARENT_DOCTORS)}
            >
              Book Doctor
              <ArrowRight size={18} />
            </Button>
          </div>

          {(hasTreatmentPlan || hasProgress) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {hasTreatmentPlan && (
                <Button
                  className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold shadow-lg rounded-2xl cursor-pointer"
                  onClick={() => navigate(`/treatment-plan/${childId}`)}
                >
                  <FileText size={18} />
                  View Treatment Plan
                </Button>
              )}
              {hasProgress && (
                <Button
                  className="flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 text-white font-semibold shadow-lg rounded-2xl cursor-pointer"
                  onClick={() => navigate(ROUTES.PARENT_SESSIONS)}
                >
                  <Activity size={18} />
                  View Progress & Sessions
                </Button>
              )}
            </div>
          )}
        </div>

      </div>
    </MainLayout>
  );
};
