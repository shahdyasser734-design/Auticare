interface ProgressBarProps {

  percentage: number;
  className?: string;
  label?: string;
}

export const ProgressBar = ({ percentage, className, label }: ProgressBarProps) => {
  return (
    <div className={className}>
      {label && <p className="text-sm font-medium text-neutral-700 mb-2">{label}</p>}
      <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 transition-all"
          style={{ width: `${Math.min(percentage, 100)}%` }}
        />
      </div>
      {label && <p className="text-xs text-neutral-500 mt-1">{Math.round(percentage)}%</p>}
    </div>
  );
};
