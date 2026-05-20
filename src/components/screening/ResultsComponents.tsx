import { Card } from '../common/Card';
import clsx from 'clsx';
import type { ScreeningResult } from '../../types';

export const RiskBadge = ({ level }: { level: string }) => {
  const isHigh = level.toLowerCase() === 'high';
  const isMedium = level.toLowerCase() === 'medium';
  return (
    <div
      className={clsx(
        'px-4 py-1 rounded-full text-sm font-bold border',
        isHigh
          ? 'bg-red-100 text-red-700 border-red-200'
          : isMedium
          ? 'bg-orange-100 text-orange-700 border-orange-200'
          : 'bg-green-100 text-green-700 border-green-200'
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
  <div className="mb-4">
    <div className="flex justify-between items-center mb-1">
      <span className="text-sm font-semibold text-navy-800">{label}</span>
      <span className="text-sm font-bold text-navy-600">{value}%</span>
    </div>
    <div className="w-full bg-soft-gray rounded-full h-2.5">
      <div
        className="bg-orange-500 h-2.5 rounded-full transition-all duration-1000"
        style={{ width: `${value}%` }}
      />
    </div>
  </div>
);

export const ResultsSummary = ({ result }: { result: ScreeningResult }) => {
  return (
    <div className="space-y-6">
      <Card className="bg-white border-none shadow-xl rounded-3xl p-8 md:p-12 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500 opacity-5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-navy-500 opacity-5 rounded-full translate-y-1/2 -translate-x-1/3" />

        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="text-center md:text-left space-y-2">
            <h2 className="text-3xl font-bold text-navy-900">Screening Complete</h2>
            <p className="text-navy-500">Analysis for {result.childName || 'Child'}</p>
            <div className="mt-4 inline-block">
              <RiskBadge level={result.riskLevel} />
            </div>
          </div>

          <div className="flex gap-6">
            <ScoreCircle
              score={result.confidenceScore}
              label="Confidence"
              colorClass="border-navy-500 text-navy-700 bg-navy-50"
            />
            <ScoreCircle
              score={result.aqScore}
              label="AQ Score"
              colorClass="border-orange-500 text-orange-600 bg-orange-50"
            />
          </div>
        </div>
      </Card>

      <Card className="bg-white border-none shadow-lg rounded-3xl p-8">
        <h3 className="text-xl font-bold text-navy-900 mb-6">Behavioral Categories</h3>
        <div className="grid md:grid-cols-2 gap-x-12 gap-y-2">
          <CategoryBar label="Social Attention" value={result.socialAttention} />
          <CategoryBar label="Joint Attention" value={result.jointAttention} />
          <CategoryBar label="Social Communication" value={result.socialCommunication} />
          <CategoryBar label="Language" value={result.language} />
          <CategoryBar label="Imagination" value={result.imagination} />
          <CategoryBar label="Repetitive Behavior" value={result.repetitiveBehavior} />
        </div>
      </Card>

      <Card className="bg-navy-900 text-white border-none shadow-lg rounded-3xl p-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-orange-400 mb-1">AI Prediction</h3>
            <p className="text-navy-100">{result.predictionClass}</p>
          </div>
          <div className="text-right">
            <h3 className="text-lg font-bold text-orange-400 mb-1">Probability</h3>
            <p className="text-navy-100">{result.probability}</p>
          </div>
        </div>
      </Card>
    </div>
  );
};
