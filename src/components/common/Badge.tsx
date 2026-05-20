import type { ReactNode } from 'react';
import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

interface BadgeProps {
  children: ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  size?: 'sm' | 'md';
}

export const Badge = ({ children, variant = 'primary', size = 'sm' }: BadgeProps) => {
  const { isDark } = useTheme();

  const darkVariants = {
    primary: 'bg-blue-500/20 text-blue-200 border border-blue-500/30',
    secondary: 'bg-purple-500/20 text-purple-200 border border-purple-500/30',
    success: 'bg-emerald-500/20 text-emerald-200 border border-emerald-500/30',
    warning: 'bg-amber-500/20 text-amber-200 border border-amber-500/30',
    danger: 'bg-red-500/20 text-red-200 border border-red-500/30',
  };

  const lightVariants = {
    primary: 'bg-blue-100 text-blue-800',
    secondary: 'bg-purple-100 text-purple-800',
    success: 'bg-emerald-100 text-emerald-800',
    warning: 'bg-amber-100 text-amber-800',
    danger: 'bg-red-100 text-red-800',
  };

  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  const variants = isDark ? darkVariants : lightVariants;

  return (
    <span className={clsx('rounded-full font-medium transition-colors duration-300', variants[variant], sizes[size])}>
      {children}
    </span>
  );
};
