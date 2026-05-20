import clsx from 'clsx';
import { useTheme } from '../../context/ThemeContext';

interface AlertProps {
  type: 'success' | 'error' | 'warning' | 'info';
  message: string;
  onClose?: () => void;
}

export const Alert = ({ type, message, onClose }: AlertProps) => {
  const { isDark } = useTheme();

  const darkStyles = {
    success: 'bg-emerald-950/70 border border-emerald-500/20 text-emerald-100',
    error: 'bg-rose-950/70 border border-rose-500/20 text-rose-100',
    warning: 'bg-amber-950/70 border border-amber-500/20 text-amber-100',
    info: 'bg-sky-950/70 border border-sky-500/20 text-sky-100',
  };

  const lightStyles = {
    success: 'bg-emerald-50 border border-emerald-200 text-emerald-900',
    error: 'bg-red-50 border border-red-200 text-red-900',
    warning: 'bg-amber-50 border border-amber-200 text-amber-900',
    info: 'bg-blue-50 border border-blue-200 text-blue-900',
  };

  const styles = isDark ? darkStyles : lightStyles;

  return (
    <div className={clsx(
      'rounded-3xl p-4 flex items-center justify-between shadow-lg transition-colors duration-300',
      isDark ? 'shadow-slate-950/30' : 'shadow-slate-200/30',
      styles[type]
    )}>
      <p className="font-medium">{message}</p>
      {onClose && (
        <button onClick={onClose} className="text-lg opacity-70 hover:opacity-100 transition-opacity">
          ×
        </button>
      )}
    </div>
  );
};
