import type { ButtonHTMLAttributes, ReactNode } from 'react';
import clsx from 'clsx';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  children: ReactNode;
  icon?: ReactNode;
  fullWidth?: boolean;
}

export const Button = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  children,
  icon,
  fullWidth = false,
  className,
  disabled,
  ...props
}: ButtonProps) => {
  const baseStyles = 'font-semibold rounded-full transition-all duration-300 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transform hover:-translate-y-0.5';

  const variants = {
    primary: 'bg-gradient-to-r from-amber-500 via-orange-500 to-orange-600 hover:from-amber-600 hover:via-orange-600 hover:to-orange-700 text-white shadow-[0_8px_20px_-6px_rgba(217,119,6,0.5)] hover:shadow-[0_12px_24px_-4px_rgba(217,119,6,0.6)] dark:bg-gradient-to-r dark:from-blue-600 dark:via-blue-500 dark:to-indigo-600 dark:hover:from-blue-500 dark:hover:via-blue-400 dark:hover:to-indigo-500 dark:text-white dark:shadow-[0_0_15px_rgba(59,130,246,0.4)] dark:hover:shadow-[0_0_25px_rgba(59,130,246,0.6)] border-none',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-500 active:bg-secondary-700 shadow-[0_16px_40px_-28px_rgba(168,85,247,0.8)]',
    outline: 'border-2 border-slate-300 dark:border-slate-600 text-slate-800 dark:text-white hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15',
    danger: 'bg-danger-600 text-white hover:bg-danger-500 active:bg-danger-700 shadow-[0_12px_32px_-24px_rgba(239,68,68,0.9)]',
    ghost: 'text-slate-700 dark:text-slate-100 hover:bg-slate-100 dark:hover:bg-white/10 active:bg-slate-200 dark:active:bg-white/15',
  };

  const sizes = {
    sm: 'px-3 py-2.5 text-sm min-h-[44px]',
    md: 'px-4 py-3 text-base min-h-[44px]',
    lg: 'px-6 py-3.5 text-lg min-h-[44px]',
  };

  return (
    <button
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          Loading...
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
};
