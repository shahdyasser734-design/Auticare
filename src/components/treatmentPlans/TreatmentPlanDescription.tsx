

interface Props {
  text?: string;
  fallbackText?: string;
}

export const TreatmentPlanDescription = ({ text, fallbackText = 'No description provided.' }: Props) => {
  if (!text) return <p className="text-xs text-slate-500 italic">{fallbackText}</p>;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let data: any = null;
  
  if (text.trim().startsWith('{')) {
    try {
      data = JSON.parse(text);
    } catch {
      // Fallback: extract using regex if JSON is broken (e.g. truncated)
      const regex = /"([^"]+)"\s*:\s*"([^"]*)"?/g;
      let match;
      const extracted: Record<string, string> = {};
      while ((match = regex.exec(text)) !== null) {
        extracted[match[1]] = match[2];
      }
      if (Object.keys(extracted).length > 0) {
        data = extracted;
      }
    }
  }

  if (data && typeof data === 'object' && Object.keys(data).length > 0) {
    const fields = [
      { key: 'clinicalAssessment', label: 'Clinical Assessment' },
      { key: 'diagnosisSummary', label: 'Diagnosis Summary' },
      { key: 'smartGoals', label: 'SMART Goals' },
      { key: 'interventionPlan', label: 'Intervention Plan' },
      { key: 'progressTracking', label: 'Progress Tracking' },
      { key: 'generalNotes', label: 'General Notes' },
      { key: 'notes', label: 'Notes / Comments' },
    ];

    const existingKeys = new Set(Object.keys(data));
    
    return (
      <div className="space-y-1.5 mt-2 bg-white/50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-100 dark:border-white/5">
        {fields.map(({ key, label }) => {
          if (existingKeys.has(key)) {
            existingKeys.delete(key);
            const value = data[key];
            const displayValue = value && typeof value === 'string' && value.trim() ? value.trim() : '—';
            return (
              <div key={key} className="text-xs flex flex-col sm:flex-row sm:gap-2">
                <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">{label}:</span>
                <span className="text-slate-600 dark:text-slate-400 flex-1 whitespace-pre-wrap">{displayValue}</span>
              </div>
            );
          }
          return null;
        })}
        {Array.from(existingKeys).map(key => {
          const val = data[key];
          const displayValue = val && typeof val === 'string' && val.trim() ? val.trim() : '—';
          const lbl = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str: string) => str.toUpperCase());
          return (
            <div key={key} className="text-xs flex flex-col sm:flex-row sm:gap-2">
              <span className="font-semibold text-slate-700 dark:text-slate-300 min-w-[140px]">{lbl}:</span>
              <span className="text-slate-600 dark:text-slate-400 flex-1 whitespace-pre-wrap">{displayValue}</span>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <p className="text-xs text-slate-600 dark:text-slate-350 line-clamp-2 mt-1 break-words">
      {text}
    </p>
  );
};
