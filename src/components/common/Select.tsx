import type { SelectHTMLAttributes } from 'react';
import clsx from 'clsx';
import { useTheme } from '../../context/useTheme';

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: Array<{ value: string; label: string }>;
  fullWidth?: boolean;
}

export const Select = ({
  label,
  error,
  options,
  fullWidth = true,
  className,
  disabled,
  ...props
}: SelectProps) => {
  const { isDark } = useTheme();

  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label className={clsx('block text-sm font-semibold mb-2', isDark ? 'text-slate-300' : 'text-slate-900')}>
          {label}
        </label>
      )}
      <select
        className={clsx(
          'w-full px-4 py-3 min-h-[44px] border rounded-2xl transition-all duration-300 focus:outline-none focus:ring-2 focus:border-transparent',
          isDark
            ? 'bg-slate-950/90 text-slate-100 placeholder:text-slate-500 border-slate-700 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-900 disabled:text-slate-500'
            : 'bg-white text-slate-900 placeholder:text-slate-450 border-slate-400 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-400',
          'disabled:cursor-not-allowed',
          error && (isDark ? 'border-red-500 focus:ring-red-500' : 'border-red-400 focus:ring-red-400'),
          className
        )}
        disabled={disabled}
        {...props}
      >
        <option value="">Select an option</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && (
        <p className={clsx('mt-1 text-sm', isDark ? 'text-red-400' : 'text-red-500')}>
          {error}
        </p>
      )}
    </div>
  );
};
