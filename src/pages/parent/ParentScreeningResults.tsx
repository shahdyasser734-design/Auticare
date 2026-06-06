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

// ---------------------------------------------------------------------------
// Helper: build a normalised ScreeningResult from whatever the backend returns
// Backend contract: { predictionClass, confidenceScore, createdAt }
// All extra fields default to sensible values so the existing UI never crashes.
// ---------------------------------------------------------------------------
const normaliseResult = (raw: Record<string, unknown>, childName: string): ScreeningResult => {
  const predictionClass = String(raw.predictionClass ?? raw.prediction_class ?? 'NO');
  const confidenceScore = Number(raw.confidenceScore ?? raw.confidence_score ?? 0);
  const isPositive = predictionClass.toUpperCase() === 'YES';

  // Swap them to correctly map to expected types on frontend.
  const rawRisk = String(raw.riskLevel ?? (isPositive ? 'high' : 'low'));
  const rawProb = String(raw.probability ?? `${(confidenceScore * 100).toFixed(2)}%`);

  return {
    childName,
    predictionClass: isPositive ? 'ASD Positive' : 'ASD Negative',
    confidenceScore: Math.round(confidenceScore * 100), // fraction → percentage
    aqScore: Number(raw.aqScore ?? raw.aq_score ?? 0),
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

export type AnalyticsResponse = {
  totalScreenings?: number;
  totalTests?: number;
  averageScore?: number;
  latestConfidenceScore?: number;
  riskLevelDistribution?: {
    low?: number;
    medium?: number;
    high?: number;
  };
  highRiskCount?: number;
  lowRiskCount?: number;
  recentScreenings?: ScreeningResult[];
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
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [childId, setChildId] = useState<string | null>(null);
  const [hasTreatmentPlan, setHasTreatmentPlan] = useState(false);
  const [hasProgress, setHasProgress] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('childId') || localStorage.getItem('latestChildId');
        setChildId(id);

        const childName = localStorage.getItem('latestChildName') || 'Child';

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
            } catch {
              // corrupt cache
            }
          }
        }

        // ── 3. Load analytics ──
        if (id) {
          try {
            const analyticsData = await screeningService.getAnalytics(id);
            setAnalytics(analyticsData);
          } catch (analyticsError) {
            console.warn('Unable to load analytics data:', analyticsError);
          }
        }
      } catch (err) {
        console.error('Error loading screening results:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

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
          <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl">
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

  const analyticsData = (() => {
    const service: AnalyticsResponse = analytics ?? {};
    const totalTests = Number(service.totalScreenings ?? service.totalTests ?? 1);
    const highRisk = Number(service.riskLevelDistribution?.high ?? service.highRiskCount ?? 0);
    const lowRisk = Number(service.riskLevelDistribution?.low ?? service.lowRiskCount ?? 0);
    const mediumRisk = Number(
      service.riskLevelDistribution?.medium ?? Math.max(0, totalTests - highRisk - lowRisk),
    );

    return {
      totalScreenings: totalTests,
      averageScore: Number(service.averageScore ?? result.aqScore ?? 0),
      latestConfidence: Number(service.latestConfidenceScore ?? result.confidenceScore ?? 0),
      riskLevelDistribution: {
        low: lowRisk,
        medium: mediumRisk,
        high: highRisk,
      },
      recentScreenings: Array.isArray(service.recentScreenings)
        ? service.recentScreenings as ScreeningResult[]
        : [result],
    };
  })();

  const stats = {
    totalTests: analyticsData.totalScreenings,
    highRiskCount: analyticsData.riskLevelDistribution.high,
    lowRiskCount: analyticsData.riskLevelDistribution.low,
    lastPrediction: result.predictionClass,
    latestConfidence: result.confidenceScore,
  };

  // ── Result UI ─────────────────────────────────────────────────────────────
  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto space-y-6 pb-12">

        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white">
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
              <div className="bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5">
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
          <Card className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Prediction Class</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.predictionClass}</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">AQ Score</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.aqScore || 'N/A'}</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Confidence</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.confidenceScore}%</p>
          </Card>
          <Card className="p-6 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500 mb-3">Risk Level</p>
            <span className={`inline-flex items-center px-4 py-2 rounded-full font-semibold ${isPositive ? 'bg-red-500/10 text-red-700 dark:bg-red-500/20 dark:text-red-200' : 'bg-green-500/10 text-green-700 dark:bg-green-500/20 dark:text-green-200'}`}>
              {result.riskLevel || 'Unknown'}
            </span>
          </Card>
        </div>

        <section className="grid gap-6 xl:grid-cols-[1.4fr,_0.9fr]">
          <Card className="p-8 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <div className="flex items-center justify-between gap-4 mb-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Screening Analytics</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Performance by domain</h2>
              </div>
              <span className="text-sm text-slate-500 dark:text-slate-400">Last updated {date}</span>
            </div>

            <div className="space-y-4">
              {[
                { label: 'Social Attention', value: result.socialAttention },
                { label: 'Joint Attention', value: result.jointAttention },
                { label: 'Social Communication', value: result.socialCommunication },
                { label: 'Language', value: result.language },
                { label: 'Imagination', value: result.imagination },
                { label: 'Repetitive Behavior', value: result.repetitiveBehavior },
              ].map((item) => (
                <div key={item.label} className="space-y-2">
                  <div className="flex justify-between text-sm font-medium text-slate-600 dark:text-slate-400">
                    <span>{item.label}</span>
                    <span>{item.value}%</span>
                  </div>
                  <div className="h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full ${item.value >= 70 ? 'bg-green-500' : item.value >= 40 ? 'bg-orange-400' : 'bg-red-500'}`} style={{ width: `${Math.min(100, Math.max(0, item.value))}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-8 bg-white dark:bg-slate-900/90 border border-slate-200 dark:border-white/10 shadow-sm rounded-3xl">
            <div className="space-y-6">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Statistics</p>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Key results</h2>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {[
                  { label: 'Total Tests', value: stats.totalTests },
                  { label: 'High Risk Count', value: stats.highRiskCount },
                  { label: 'Low Risk Count', value: stats.lowRiskCount },
                  { label: 'Latest Confidence', value: `${stats.latestConfidence}%` },
                ].map((card) => (
                  <div key={card.label} className="rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-800/80 p-5">
                    <p className="text-sm text-slate-500 dark:text-slate-400">{card.label}</p>
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{card.value}</p>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </section>

        <Card className="p-8 bg-gradient-to-r from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-slate-400 dark:text-slate-500">Last prediction</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">{stats.lastPrediction}</h3>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
              <div className="rounded-3xl bg-white dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Average AQ score</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{analyticsData.averageScore || result.aqScore || 'N/A'}</p>
              </div>
              <div className="rounded-3xl bg-white dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Latest confidence</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{stats.latestConfidence}%</p>
              </div>
              <div className="rounded-3xl bg-white dark:bg-slate-800/80 p-5 border border-slate-200 dark:border-white/10">
                <p className="text-sm text-slate-500 dark:text-slate-400">Risk trend</p>
                <p className="mt-2 text-3xl font-bold text-slate-900 dark:text-white">{analyticsData.riskLevelDistribution.high > 0 ? 'High' : analyticsData.riskLevelDistribution.medium > 0 ? 'Medium' : 'Low'}</p>
              </div>
            </div>
          </div>
        </Card>

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
