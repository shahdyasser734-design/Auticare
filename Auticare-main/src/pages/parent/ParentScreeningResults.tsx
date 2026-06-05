import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Download, AlertCircle, BarChart3, CheckCircle, ShieldCheck, Brain, Users, MessageSquare, Speaker, Lightbulb, RotateCw } from 'lucide-react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { ROUTES } from '../../utils/constants';
import { screeningService, type ScreeningAnalytics } from '../../services/api/screening';
import type { ScreeningResult } from '../../types';

const exportPDF = () => {
  if (window && window.print) {
    window.print();
  } else {
    console.warn('Export PDF is not available in this environment.');
  }
};

// Skeleton loader component
const SkeletonBox = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-slate-200 dark:bg-slate-700 rounded-lg ${className}`} />
);

const SkeletonMetricCard = () => (
  <div className="space-y-4">
    <SkeletonBox className="h-4 w-24" />
    <SkeletonBox className="h-12 w-32" />
    <SkeletonBox className="h-2 w-full" />
  </div>
);
const clampPercentage = (value: unknown) => {
  let numeric = Number(value ?? 0);
  if (Number.isNaN(numeric)) numeric = 0;
  if (numeric <= 1) numeric *= 100;
  return Math.min(100, Math.max(0, Math.round(numeric * 100) / 100));
};

const formatProbability = (value: unknown, fallback: number) => {
  if (value === undefined || value === null) {
    return `${Math.min(100, Math.max(0, fallback))}%`;
  }

  const raw = String(value).trim();
  if (/^\d+(\.\d+)?$/.test(raw)) {
    const parsed = Number(raw);
    if (!Number.isNaN(parsed)) {
      const percent = parsed <= 1 ? parsed * 100 : parsed;
      return `${Math.min(100, Math.max(0, Math.round(percent * 100) / 100))}%`;
    }
  }

  return raw;
};

const normaliseResult = (raw: Record<string, unknown>): ScreeningResult => {
  const predictionClass = String(raw.predictionClass ?? raw.prediction_class ?? raw.prediction ?? 'Unknown').trim();
  const confidenceScore = clampPercentage(raw.confidenceScore ?? raw.confidence_score ?? raw.confidence ?? 0);
  const isPositive = predictionClass.toLowerCase().includes('yes') || predictionClass.toLowerCase().includes('positive');

  return {
    childName: String(raw.childName ?? raw.child_name ?? 'Child'),
    predictionClass: isPositive ? 'ASD Positive' : predictionClass || 'ASD Negative',
    confidenceScore,
    aqScore: Number(raw.aqScore ?? raw.aq_score ?? raw.aq ?? 0),
    riskLevel: String(raw.riskLevel ?? raw.risk_level ?? raw.risk ?? (isPositive ? 'high' : 'low')),
    probability: formatProbability(raw.probability ?? raw.probability_score ?? raw.probabilityPercent, confidenceScore),
    socialAttention: Number(raw.socialAttention ?? raw.social_attention ?? 0),
    jointAttention: Number(raw.jointAttention ?? raw.joint_attention ?? 0),
    socialCommunication: Number(raw.socialCommunication ?? raw.social_communication ?? 0),
    language: Number(raw.language ?? 0),
    imagination: Number(raw.imagination ?? 0),
    repetitiveBehavior: Number(raw.repetitiveBehavior ?? raw.repetitive_behavior ?? 0),
    createdAt: String(raw.createdAt ?? raw.created_at ?? new Date().toISOString()),
  };
};

const sortByNewest = (results: ScreeningResult[]) =>
  [...results].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

// Domain metrics with icons
const DOMAIN_METRICS = [
  { id: 'social', label: 'Social Attention', icon: Users, description: 'Ability to attend to social cues' },
  { id: 'joint', label: 'Joint Attention', icon: Brain, description: 'Shared focus with others' },
  { id: 'communication', label: 'Social Communication', icon: MessageSquare, description: 'Communication abilities' },
  { id: 'language', label: 'Language', icon: Speaker, description: 'Language development' },
  { id: 'imagination', label: 'Imagination', icon: Lightbulb, description: 'Creative thinking' },
  { id: 'behavior', label: 'Repetitive Behavior', icon: RotateCw, description: 'Behavioral patterns' },
];

export const ParentScreeningResults = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [result, setResult] = useState<ScreeningResult | null>(null);
  const [analytics, setAnalytics] = useState<ScreeningAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [childId, setChildId] = useState<string | null>(null);
  const [childName, setChildName] = useState<string>('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const id = params.get('childId') || localStorage.getItem('latestChildId');
    setChildId(id);
    
    const name = localStorage.getItem('latestChildName') || 'Child';
    setChildName(name);

    if (!id) {
      setError('No child selected. Add a child and start the screening to populate this dashboard.');
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const [results, analyticsData] = await Promise.all([
          screeningService.getResults(id).catch(() => []),
          screeningService.getAnalytics(id).catch(() => null),
        ]);

        if (results?.length) {
          const latestResult = sortByNewest(results)[0];
          setResult(normaliseResult(latestResult as unknown as Record<string, unknown>));
        } else {
          setError('No screening results were found for this child. Dashboard placeholders are shown while you complete the screening.');
        }

        setAnalytics(analyticsData);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('Unable to load dashboard data at this time. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [location.search]);

  // Use result data or placeholders
  const displayName = result?.childName || childName || 'Child';
  const displayPrediction = result?.predictionClass || 'Pending Assessment';
  const displayRisk = result?.riskLevel || 'pending';
  const displayConfidence = result?.confidenceScore || 0;
  const displayAQ = result?.aqScore || 0;
  const displayProbability = result?.probability || '–';
  const isPositive = displayPrediction.toLowerCase().includes('positive');

  const date = result?.createdAt
    ? new Date(result.createdAt).toLocaleDateString('en-GB', {
        day: '2-digit', month: 'long', year: 'numeric',
      })
    : new Date().toLocaleDateString('en-GB');

  const progressWidth = `${Math.min(100, Math.max(0, displayConfidence))}%`;
  const showPlaceholder = !loading && !result;
  const shouldShowSkeleton = loading || showPlaceholder;

  // Domain metrics data
  const metricValues = [
    result?.socialAttention ?? 0,
    result?.jointAttention ?? 0,
    result?.socialCommunication ?? 0,
    result?.language ?? 0,
    result?.imagination ?? 0,
    result?.repetitiveBehavior ?? 0,
  ];

  // Statistics data
  const statsData = [
    { label: 'Total Tests', value: analytics?.totalScreenings ?? '–', color: 'from-blue-500 to-indigo-500' },
    { label: 'High Risk', value: analytics?.riskLevelDistribution?.high ?? '–', color: 'from-rose-500 to-pink-500' },
    { label: 'Low Risk', value: analytics?.riskLevelDistribution?.low ?? '–', color: 'from-emerald-500 to-teal-500' },
    { label: 'Latest Confidence', value: `${analytics?.recentScreenings?.[0]?.confidenceScore ?? displayConfidence}%`, color: 'from-amber-500 to-orange-500' },
  ];

  return (
    <MainLayout>
      <div className="space-y-8 pb-12">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-900 dark:text-white">Screening Dashboard</h1>
              <p className="mt-2 max-w-2xl text-base text-slate-600 dark:text-slate-400">
                View the latest screening outcome, prediction details, and domain analysis for your child.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button onClick={() => navigate(ROUTES.PARENT_HOME)} variant="outline">
                Back to Home
              </Button>
              <Button onClick={exportPDF}>
                <Download size={16} /> Export Report
              </Button>
            </div>
          </div>

          {(error || showPlaceholder) && (
            <Card className="rounded-3xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 dark:border-amber-500/30 p-4">
              <div className="flex items-start gap-3 text-amber-900 dark:text-amber-200">
                <AlertCircle size={20} />
                <div>
                  <p className="font-semibold">Dashboard preview</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">
                    {error || 'No screening results have been recorded yet. This dashboard layout shows the sections and placeholders that will populate once the assessment is complete.'}
                  </p>
                </div>
              </div>
            </Card>
          )}

          {/* Child Info Cards */}
          <div className="grid gap-4 sm:grid-cols-3">
            <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Child Name</p>
              {shouldShowSkeleton ? (
                <SkeletonBox className="mt-3 h-8 w-32" />
              ) : (
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{displayName}</p>
              )}
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400 uppercase tracking-widest">Child ID</p>
              {shouldShowSkeleton ? (
                <SkeletonBox className="mt-2 h-6 w-24" />
              ) : (
                <p className="mt-2 font-medium text-slate-700 dark:text-slate-200">{childId || '–'}</p>
              )}
            </Card>

            <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Screening Date</p>
              {shouldShowSkeleton ? (
                <SkeletonBox className="mt-3 h-8 w-40" />
              ) : (
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{date}</p>
              )}
              <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Latest assessment timestamp</p>
            </Card>

            <Card className="p-6 bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-white/10">
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Prediction</p>
              {shouldShowSkeleton ? (
                <SkeletonBox className="mt-3 h-8 w-40" />
              ) : (
                <p className="mt-3 text-2xl font-bold text-slate-900 dark:text-white">{displayPrediction}</p>
              )}
              {shouldShowSkeleton ? (
                <SkeletonBox className="mt-4 h-6 w-20" />
              ) : (
                <p className="mt-4 text-xs text-slate-500 dark:text-slate-400">Risk: <span className="font-semibold text-slate-700 dark:text-slate-200">{displayRisk.toUpperCase()}</span></p>
              )}
            </Card>
          </div>
        </div>

        {/* Main Prediction & Statistics */}
        <div className="grid gap-6 xl:grid-cols-[1.4fr_0.6fr]">
          <Card className="p-8 bg-gradient-to-br from-white to-slate-50 dark:from-slate-950 dark:to-slate-900 border-slate-200 dark:border-white/10">
            <div className="flex flex-col gap-6">
              {/* Prediction Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Main Prediction</p>
                  {loading ? (
                    <SkeletonBox className="mt-3 h-10 w-56" />
                  ) : (
                    <h2 className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{displayPrediction}</h2>
                  )}
                </div>
                {loading ? (
                  <SkeletonBox className="h-10 w-32 rounded-full" />
                ) : (
                  <div className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold text-white ${isPositive ? 'bg-red-500' : 'bg-emerald-500'}`}>
                    <ShieldCheck size={16} />
                    {displayRisk.toUpperCase()}
                  </div>
                )}
              </div>

              {/* Metric Cards Grid */}
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Left Column */}
                <div className="space-y-4">
                  {/* Confidence Score */}
                  <Card className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Confidence Score</p>
                    {loading ? (
                      <SkeletonMetricCard />
                    ) : (
                      <>
                        <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{displayConfidence}%</p>
                        <div className="mt-4 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-500 transition-all duration-500" style={{ width: progressWidth }} />
                        </div>
                      </>
                    )}
                  </Card>

                  {/* AQ Score */}
                  <Card className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">AQ Score</p>
                    {loading ? (
                      <SkeletonBox className="mt-4 h-10 w-20" />
                    ) : (
                      <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{displayAQ}</p>
                    )}
                  </Card>
                </div>

                {/* Right Column */}
                <div className="space-y-4">
                  {/* Probability */}
                  <Card className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Probability</p>
                    {loading ? (
                      <SkeletonBox className="mt-4 h-10 w-24" />
                    ) : (
                      <p className="mt-4 text-4xl font-bold text-slate-900 dark:text-white">{displayProbability}</p>
                    )}
                  </Card>

                  {/* Last Prediction */}
                  <Card className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70">
                    <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">Last Prediction</p>
                    {shouldShowSkeleton ? (
                      <>
                        <SkeletonBox className="mt-4 h-10 w-40" />
                        <SkeletonBox className="mt-2 h-4 w-32" />
                      </>
                    ) : (
                      <>
                        <p className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{displayPrediction}</p>
                        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Latest model confidence: <span className="font-semibold text-slate-700 dark:text-slate-200">{displayConfidence}%</span></p>
                      </>
                    )}
                  </Card>
                </div>
              </div>

              {/* Insight Section */}
              <Card className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/70">
                <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Insight</p>
                {loading ? (
                  <div className="mt-4 space-y-2">
                    <SkeletonBox className="h-4 w-full" />
                    <SkeletonBox className="h-4 w-5/6" />
                  </div>
                ) : (
                  <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">
                    {isPositive
                      ? 'The results indicate elevated risk and suggest follow-up with a specialist for a comprehensive clinical review and diagnostic assessment.'
                      : 'The results do not show significant immediate risk indicators. Continue with regular developmental monitoring and recommended checkups as per your pediatrician.'}
                  </p>
                )}
              </Card>
            </div>
          </Card>

          {/* Statistics Card */}
          <Card className="p-8 bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-white/10">
            <div className="flex items-center justify-between gap-3 mb-6">
              <div>
                <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Statistics</p>
                <h3 className="mt-2 text-xl font-bold text-slate-900 dark:text-white">Screening Analytics</h3>
              </div>
              <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
                <BarChart3 size={18} />
              </div>
            </div>
            <div className="grid gap-4">
              {statsData.map((item) => (
                <div key={item.label} className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 p-5">
                  <p className="text-xs uppercase tracking-widest text-slate-500 dark:text-slate-400 font-semibold">{item.label}</p>
                  {shouldShowSkeleton ? (
                    <SkeletonBox className="mt-3 h-8 w-16" />
                  ) : (
                    <p className="mt-3 text-3xl font-bold text-slate-900 dark:text-white">{item.value}</p>
                  )}
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Domain Analysis Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">Domain Analysis</p>
              <h2 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Detailed Skill Scores</h2>
            </div>
            <div className="inline-flex items-center gap-2 text-slate-500 dark:text-slate-400">
              <CheckCircle size={18} />
              <span className="text-sm font-medium hidden sm:inline">Performance by domain</span>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {DOMAIN_METRICS.map((metric, idx) => {
              const Icon = metric.icon;
              const value = metricValues[idx];
              const percentage = Math.min(100, Math.max(0, value));

              return (
                <Card key={metric.id} className="p-6 border-slate-200 dark:border-white/10 bg-white/80 dark:bg-slate-950/80 hover:border-slate-300 dark:hover:border-white/20 transition-colors">
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <p className="text-xs uppercase tracking-widest font-semibold text-slate-500 dark:text-slate-400">{metric.label}</p>
                      <p className="text-xs text-slate-600 dark:text-slate-500 mt-1">{metric.description}</p>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
                      <Icon size={16} className="text-slate-600 dark:text-slate-300" />
                    </div>
                  </div>

                  {loading ? (
                    <>
                      <SkeletonBox className="h-8 w-16" />
                      <SkeletonBox className="mt-3 h-2 w-full" />
                    </>
                  ) : (
                    <>
                      <p className="text-3xl font-bold text-slate-900 dark:text-white">{percentage}</p>
                      <div className="mt-3 h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-700"
                          style={{ width: `${percentage}%` }}
                        />
                      </div>
                      <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                        {result ? `Assessed score` : 'No data'}
                      </p>
                    </>
                  )}
                </Card>
              );
            })}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PARENT_SCREENING)}
            className="w-full"
          >
            Re-run Screening
          </Button>
          <Button
            onClick={() => navigate(ROUTES.PARENT_BOOK_SPECIALIST)}
            className="w-full"
          >
            Book Specialist
          </Button>
          <Button
            variant="outline"
            onClick={() => navigate(ROUTES.PARENT_HOME)}
            className="w-full"
          >
            Return Home
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
