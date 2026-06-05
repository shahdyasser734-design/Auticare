import clsx from 'clsx';
import type { ReactNode } from 'react';
import { useTheme } from '../../context/useTheme';

interface CardProps {
  children: ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card = ({ children, className, onClick, hoverable = false }: CardProps) => {
  const { isDark } = useTheme();

  return (
    <div
      className={clsx(
        'rounded-3xl border transition-colors duration-300 p-6 backdrop-blur-xl',
        isDark
          ? 'border-white/10 bg-slate-950/85 shadow-2xl shadow-slate-950/40 text-slate-100'
          : 'border-slate-200 bg-white shadow-lg shadow-slate-200/40 text-slate-900',
        hoverable && (isDark
          ? 'cursor-pointer transition-all hover:shadow-[0_20px_50px_-30px_rgba(15,23,42,0.8)] hover:-translate-y-1'
          : 'cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1'
        ),
        className
      )}
      onClick={onClick}
    >
      {children}
    </div>
  );
};
