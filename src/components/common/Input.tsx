import type { InputHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Input = ({
  label,
  error,
  hint,
  icon,
  fullWidth = true,
  className,
  disabled,
  ...props
}: InputProps) => {
  const { isDark } = useTheme();

  return (
    <div className={clsx(fullWidth && 'w-full')}>
      {label && (
        <label className={clsx('block text-sm font-medium mb-2', isDark ? 'text-slate-300' : 'text-slate-700')}>
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <div className={clsx('absolute left-3 top-3', isDark ? 'text-slate-400' : 'text-slate-500')}>
            {icon}
          </div>
        )}
        <input
          className={clsx(
            'w-full px-4 py-3 min-h-[44px] border rounded-2xl transition-all duration-300',
            isDark
              ? 'bg-slate-950/90 text-slate-100 placeholder:text-slate-500 border-slate-700 focus:ring-blue-500 focus:border-blue-500 disabled:bg-slate-900 disabled:text-slate-500'
              : 'bg-white text-slate-900 placeholder:text-slate-400 border-slate-300 focus:ring-orange-500 focus:border-orange-500 disabled:bg-slate-100 disabled:text-slate-400',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'disabled:cursor-not-allowed',
            error && (isDark ? 'border-red-500 focus:ring-red-500' : 'border-red-400 focus:ring-red-400'),
            icon && 'pl-12',
            className
          )}
          disabled={disabled}
          {...props}
        />
      </div>
      {error && (
        <p className={clsx('mt-2 text-sm', isDark ? 'text-red-400' : 'text-red-500')}>
          {error}
        </p>
      )}
      {hint && !error && (
        <p className={clsx('mt-2 text-sm', isDark ? 'text-slate-400' : 'text-slate-600')}>
          {hint}
        </p>
      )}
    </div>
  );
};
