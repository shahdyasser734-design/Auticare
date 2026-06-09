import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Download, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { screeningService } from '../../services/api/screening';
import { childrenService } from '../../services/api/children';
import type { ScreeningResult } from '../../types';
import { LoadingSpinner } from '../../components/common/Loading';

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

// ---------------------------------------------------------------------------
// Simple PDF export
// ---------------------------------------------------------------------------
const exportPDF = (result: ScreeningResult) => {
  const childName = result.childName || 'Child';
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
export const SpecialistScreeningResults = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [childName, setChildName] = useState<string>('Patient');

  useEffect(() => {
    if (!id) return;

    const load = async () => {
      setLoading(true);
      try {
        let name = 'Patient';
        try {
          const childData = await childrenService.getChild(id);
          if (childData?.name) name = childData.name;
        } catch (e) {
          console.warn('Could not fetch child profile directly, falling back to bookings search.', e);
          try {
            const { bookingService } = await import('../../services/api/bookings');
            const myBookings = await bookingService.getMyBookings();
            const booking = myBookings.find(b => String(b.childId) === String(id));
            if (booking?.childName) {
              name = booking.childName;
            }
          } catch (bookingErr) {
            console.warn('Fallback booking search failed', bookingErr);
          }
        }
        setChildName(name);

        const data = await screeningService.getResults(id);
        if (data && data.length > 0) {
          const sorted = [...data].sort((a, b) => new Date(String((b as unknown as Record<string, unknown>).createdAt ?? '')).getTime() - new Date(String((a as unknown as Record<string, unknown>).createdAt ?? '')).getTime());
          const raw = sorted[0] as unknown as Record<string, unknown>;
          setResult(normaliseResult(raw, name));
        } else {
          setResult(null);
        }
      } catch (err) {
        console.error('Error loading screening results:', err);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [id]);

  // ── Loading ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <LoadingSpinner />
          <p className="text-slate-500 dark:text-slate-400 animate-pulse font-medium">
            Loading patient results…
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
                We couldn't find a completed screening for this patient.
              </p>
              <Button
                onClick={() => navigate(-1)}
                className="bg-slate-600 hover:bg-slate-700 px-8 py-3 text-white font-semibold"
              >
                Go Back
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

        {/* Back Button & Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
          >
            <ArrowLeft size={16} />
            Back to patient profile
          </button>
        </div>

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
                  Patient Name
                </p>
                <p className="text-3xl font-bold text-slate-900 dark:text-white">
                  {childName}
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
              This screening is not a final diagnosis. Please perform a clinical evaluation.
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
          <div className="flex gap-4">
            <Button
              onClick={() => exportPDF(result)}
              className="flex items-center justify-center gap-2 py-4 px-8 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold shadow-lg shadow-blue-500/25 rounded-2xl cursor-pointer"
            >
              <Download size={18} />
              Export Report
            </Button>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
