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
        'standard-card p-6 transition-colors duration-300 backdrop-blur-xl',
        isDark ? 'text-slate-100' : 'text-slate-900',
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
