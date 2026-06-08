import clsx from 'clsx';
import { Puzzle, Stethoscope } from 'lucide-react';

/* ──────────────────────────────────────────────────────────
   CAPSULE / TUBE PROGRESS BAR
   ────────────────────────────────────────────────────────── */

interface ScreeningProgressProps {
  currentPage: number;
  totalPages: number;
}

export const ScreeningProgress = ({ currentPage, totalPages }: ScreeningProgressProps) => {
  const pct = Math.round((currentPage / totalPages) * 100);

  return (
    <div className="mb-12 w-full max-w-2xl">
      {/* Header row */}
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          {/* Floating puzzle piece */}
          <span className="text-orange-400 animate-puzzle-1 inline-block">
            <Puzzle size={18} strokeWidth={2} />
          </span>
          <span className="text-slate-300 text-sm font-semibold tracking-widest uppercase">
            Screening Progress
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-slate-400 text-sm font-medium">
            {currentPage} <span className="text-slate-600">/</span> {totalPages}
          </span>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 text-sm font-bold tabular-nums">
            {pct}%
          </span>
        </div>
      </div>

      {/* Outer capsule track */}
      <div className="relative w-full h-5 rounded-full overflow-hidden bg-slate-200 dark:bg-white/5 border border-slate-300 dark:border-white/10 backdrop-blur-sm shadow-inner shadow-slate-300 dark:shadow-slate-950/60"
      >
        {/* Glass inner track texture */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/5 to-transparent pointer-events-none" />

        {/* Filled tube */}
        <div
          className="absolute top-0 left-0 h-full rounded-full transition-all duration-700 ease-out overflow-hidden"
          style={{ width: `${pct}%` }}
        >
          {/* Main gradient */}
          <div className="absolute inset-0 bg-gradient-to-r from-orange-600 via-orange-400 to-cyan-400" />

          {/* Shimmer sweep */}
          <div
            className="absolute inset-0 opacity-60"
            style={{
              background:
                'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.35) 45%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.35) 55%, transparent 100%)',
              backgroundSize: '200% 100%',
              animation: 'tubeShimmer 2s linear infinite',
            }}
          />

          {/* Top gloss */}
          <div className="absolute inset-x-0 top-0 h-1/2 rounded-full bg-gradient-to-b from-white/30 to-transparent pointer-events-none" />

          {/* Right-edge glow dot */}
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full bg-white/80 shadow-[0_0_12px_4px_rgba(251,191,36,0.7)] blur-[1px]" />
        </div>

        {/* Tick marks */}
        {Array.from({ length: totalPages - 1 }, (_, i) => (
          <div
            key={i}
            className="absolute top-1/2 -translate-y-1/2 w-px h-2.5 bg-white/10"
            style={{ left: `${((i + 1) / totalPages) * 100}%` }}
          />
        ))}
      </div>

      {/* Step dots */}
      <div className="flex justify-between mt-3 px-0.5">
        {Array.from({ length: totalPages }, (_, i) => {
          const step = i + 1;
          const done = step <= currentPage;
          const active = step === currentPage;
          return (
            <div
              key={i}
              className={clsx(
                'w-2 h-2 rounded-full transition-all duration-500',
                active
                  ? 'bg-orange-400 scale-150 shadow-[0_0_8px_3px_rgba(251,146,60,0.7)]'
                  : done
                  ? 'bg-cyan-500 scale-110'
                  : 'bg-white/15'
              )}
            />
          );
        })}
      </div>

      {/* Floating decorations */}
      <div className="relative pointer-events-none mt-1">
        <span className="absolute -right-6 -top-8 text-cyan-400/20 animate-stethoscope">
          <Stethoscope size={22} strokeWidth={1.5} />
        </span>
      </div>
    </div>
  );
};

// Legacy alias
export const TestProgress = ScreeningProgress;

/* ──────────────────────────────────────────────────────────
   QUESTION CARD
   ────────────────────────────────────────────────────────── */

interface ScreeningQuestionProps {
  question: string;
  description?: string;
  options: Array<{ id: string; label: string; value: number }>;
  selectedAnswer?: string;
  onSelectAnswer: (optionId: string) => void;
  questionNumber?: number;
}

export const ScreeningQuestion = ({
  question,
  description,
  options,
  selectedAnswer,
  onSelectAnswer,
  questionNumber,
}: ScreeningQuestionProps) => {
  return (
    <div className="relative bg-slate-100 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl p-8 md:p-12 space-y-8 w-full max-w-2xl border border-slate-300 dark:border-white/15 shadow-xl dark:shadow-2xl dark:shadow-slate-950/80 overflow-hidden">
      {/* Subtle glow background */}
      <div className="absolute -top-20 -right-20 w-64 h-64 rounded-full bg-orange-500/8 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-cyan-500/8 blur-3xl pointer-events-none" />

      <div className="relative">
        {questionNumber && (
          <span className="inline-block mb-3 px-3 py-1 rounded-full bg-orange-600/25 border border-orange-500/40 text-orange-600 dark:text-orange-400 text-xs font-bold uppercase tracking-widest">
            Question {questionNumber}
          </span>
        )}
        <h2 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
          {question}
        </h2>
        {description && (
          <p className="mt-3 text-slate-600 dark:text-slate-400 text-base leading-relaxed">{description}</p>
        )}
      </div>

      <div className="space-y-3 relative">
        {options.map((option, idx) => {
          const isSelected = selectedAnswer === option.id;
          const letter = String.fromCharCode(65 + idx); // A, B, C...
          return (
            <button
              key={option.id}
              onClick={() => onSelectAnswer(option.id)}
              className={clsx(
                'w-full p-5 rounded-2xl border-2 transition-all duration-300 text-left flex items-center gap-4 group',
                isSelected
                  ? 'border-orange-600 bg-orange-300 dark:bg-orange-600/30 shadow-lg shadow-orange-500/30 dark:shadow-orange-500/20'
                  : 'border-slate-300 dark:border-white/15 standard-card hover:border-orange-600/60 hover:bg-orange-100 dark:hover:bg-slate-700/60'
              )}
            >
              {/* Letter badge */}
              <div
                className={clsx(
                  'flex-shrink-0 w-9 h-9 rounded-xl border-2 flex items-center justify-center text-sm font-bold transition-all duration-300',
                  isSelected
                    ? 'border-orange-600 bg-orange-600 text-white shadow-md shadow-orange-500/40'
                    : 'border-slate-400 dark:border-white/25 standard-card text-slate-600 dark:text-slate-300 group-hover:border-orange-600/70 group-hover:text-orange-600 dark:group-hover:text-orange-400'
                )}
              >
                {isSelected ? '✓' : letter}
              </div>

              {/* Label */}
              <span
                className={clsx(
                  'flex-1 text-base font-medium transition-colors duration-300',
                  isSelected ? 'text-slate-900 dark:text-white font-semibold' : 'text-slate-800 dark:text-slate-200 group-hover:text-slate-900 dark:group-hover:text-white'
                )}
              >
                {option.label}
              </span>

              {/* Selected indicator */}
              {isSelected && (
                <div className="flex-shrink-0 w-2 h-2 rounded-full bg-orange-600 dark:bg-orange-400 animate-pulse-slow" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// Legacy alias
export const TestQuestion = ScreeningQuestion;
