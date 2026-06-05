import { Card } from '../common/Card';
import clsx from 'clsx';
import type { ScreeningResult } from '../../types';

export const RiskBadge = ({ level }: { level: string }) => {
  const isHigh = level.toLowerCase() === 'high';
  const isMedium = level.toLowerCase() === 'medium';
  return (
    <div
      className={clsx(
        'px-4 py-2 rounded-full text-sm font-bold border-2 inline-block',
        isHigh
          ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border-red-300 dark:border-red-500/50'
          : isMedium
          ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 border-orange-300 dark:border-orange-500/50'
          : 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border-green-300 dark:border-green-500/50'
      )}
    >
      {level.toUpperCase()} RISK
    </div>
  );
};

export const ScoreCircle = ({
  score,
  label,
  colorClass,
}: {
  score: number;
  label: string;
  colorClass: string;
}) => (
  <div className="flex flex-col items-center justify-center p-4">
    <div
      className={clsx(
        'w-24 h-24 rounded-full flex items-center justify-center border-4 shadow-inner mb-2',
        colorClass
      )}
    >
      <span className="text-2xl font-bold">{score}%</span>
    </div>
    <span className="text-sm text-navy-600 font-medium text-center">{label}</span>
  </div>
);

export const CategoryBar = ({ label, value }: { label: string; value: number }) => (
  <div className="mb-6">
    <div className="flex justify-between items-center mb-2">
      <span className="text-base font-semibold text-slate-900 dark:text-white">{label}</span>
      <span className="text-base font-bold text-orange-600 dark:text-orange-400">{value}%</span>
    </div>
    <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3 overflow-hidden shadow-sm">
      <div
        className="bg-gradient-to-r from-orange-500 to-orange-400 h-3 rounded-full transition-all duration-1000 shadow-md shadow-orange-500/30"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const ResultsSummary = ({ result }: { result: ScreeningResult }) => {
  const childName = localStorage.getItem('latestChildName') || result.childName || 'Child';
  const createdAt = result.createdAt ? new Date(result.createdAt).toLocaleDateString('en-GB') : new Date().toLocaleDateString('en-GB');
  
  return (
    <div className="space-y-8">
      {/* Patient Info & Main Result */}
      <Card className="bg-gradient-to-br from-slate-50 to-white dark:from-slate-900 dark:to-slate-800 border border-slate-200 dark:border-white/10 shadow-xl rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row items-start justify-between gap-8">
            <div className="space-y-4 flex-1">
              <h2 className="text-4xl font-bold text-slate-900 dark:text-white">Screening Complete</h2>
              
              <div className="space-y-3 pt-4">
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Child Name:</span>
                  <span className="text-xl font-semibold text-slate-900 dark:text-white">{childName}</span>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-slate-600 dark:text-slate-400 font-medium">Created At:</span>
                  <span className="text-lg font-semibold text-slate-900 dark:text-white">{createdAt}</span>
                </div>
              </div>

              <div className="pt-2">
                <RiskBadge level={result.riskLevel} />
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 w-full md:w-auto">
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md">
                <div className="text-4xl font-bold text-slate-900 dark:text-white mb-2">{result.confidenceScore}%</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">Confidence</div>
              </div>
              <div className="flex flex-col items-center justify-center p-6 bg-white dark:bg-slate-700/50 rounded-2xl border border-slate-200 dark:border-white/10 shadow-md">
                <div className="text-4xl font-bold text-orange-600 dark:text-orange-400 mb-2">{result.aqScore}</div>
                <div className="text-sm font-medium text-slate-600 dark:text-slate-400">AQ Score</div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Behavioral Categories */}
      <Card className="bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl p-8 md:p-10">
        <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-8">Behavioral Analysis</h3>
        <div className="grid md:grid-cols-2 gap-8">
          <CategoryBar label="Social Attention" value={result.socialAttention} />
          <CategoryBar label="Joint Attention" value={result.jointAttention} />
          <CategoryBar label="Social Communication" value={result.socialCommunication} />
          <CategoryBar label="Language" value={result.language} />
          <CategoryBar label="Imagination" value={result.imagination} />
          <CategoryBar label="Repetitive Behavior" value={result.repetitiveBehavior} />
        </div>
      </Card>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-900/20 dark:to-slate-800 border border-orange-200 dark:border-orange-500/20 shadow-lg rounded-3xl p-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-orange-700 dark:text-orange-400">AI Prediction</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.predictionClass}</p>
          </div>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-slate-800 border border-blue-200 dark:border-blue-500/20 shadow-lg rounded-3xl p-8">
          <div className="space-y-2">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-blue-700 dark:text-blue-400">Probability</h3>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{result.probability}</p>
          </div>
        </Card>
      </div>
    </div>
  );
};
