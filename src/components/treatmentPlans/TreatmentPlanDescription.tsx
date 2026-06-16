interface TreatmentPlanLike {
  description?: string;
  notes?: string;
  goal?: string;
  goals?: string[];
}

interface Props {
  plan?: TreatmentPlanLike;
  text?: string;
  fallbackText?: string;
}

export const TreatmentPlanDescription = ({ plan, text }: Props) => {
  const data: Record<string, string> = {};

  const tryParse = (str?: string) => {
    if (!str || typeof str !== 'string') return;
    if (str.trim().startsWith('{')) {
      try {
        const parsed = JSON.parse(str);
        if (typeof parsed === 'object' && parsed) {
          Object.assign(data, parsed);
        }
        return;
      } catch {
        // Fallback: extract using regex if JSON is broken (e.g. truncated)
        const regex = /"([^"]+)"\s*:\s*"([^"]*)"?/g;
        let match;
        while ((match = regex.exec(str)) !== null) {
          data[match[1]] = match[2];
        }
      }
    } else {
      // If there's raw text and we want to preserve it, we could put it somewhere,
      // but the requirement asks for strictly parsed fields.
    }
  };

  if (plan) {
    tryParse(plan.description);
    tryParse(plan.notes);
    tryParse(plan.goal);
    if (Array.isArray(plan.goals)) {
      plan.goals.forEach((g: string) => tryParse(g));
    }
  }

  if (text) {
    tryParse(text);
  }

  const fields = [
    { key: 'clinicalAssessment', label: 'Clinical Assessment' },
    { key: 'diagnosisSummary', label: 'Diagnosis Summary' },
    { key: 'progressTracking', label: 'Progress Tracking' },
    { key: 'generalNotes', label: 'General Notes' },
    { key: 'smartGoals', label: 'Smart Goals' },
    { key: 'interventionPlan', label: 'Intervention Plan' },
  ];

  return (
    <div className="space-y-4 mt-3 bg-white/40 dark:bg-slate-900/40 p-4 rounded-xl border border-slate-100 dark:border-white/5">
      {fields.map(({ key, label }) => {
        const value = data[key];
        const displayValue = value && typeof value === 'string' && value.trim() ? value.trim() : '—';
        return (
          <div key={key} className="text-sm">
            <span className="font-semibold text-slate-800 dark:text-slate-200 block mb-0.5">{label}:</span>
            <span className="text-slate-600 dark:text-slate-400 whitespace-pre-wrap leading-relaxed block">{displayValue}</span>
          </div>
        );
      })}
    </div>
  );
};
