import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export const Modal = ({ isOpen, onClose, title, children, footer }: ModalProps) => {
  const { isDark } = useTheme();

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 flex items-center justify-center z-50 transition-colors duration-300 ${
      isDark ? 'bg-black bg-opacity-50' : 'bg-black/30'
    }`}>
      <div className={`rounded-2xl shadow-xl max-w-md w-full mx-4 max-h-96 overflow-y-auto transition-colors duration-300 ${
        isDark ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-200'
      }`}>
        {title && (
          <div className={`flex items-center justify-between p-6 border-b transition-colors duration-300 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {title}
            </h2>
            <button
              onClick={onClose}
              className={`transition-colors ${
                isDark 
                  ? 'text-slate-400 hover:text-slate-200' 
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <X size={24} />
            </button>
          </div>
        )}
        <div className={isDark ? 'p-6 text-slate-100' : 'p-6 text-slate-900'}>{children}</div>
        {footer && (
          <div className={`p-6 border-t transition-colors duration-300 ${
            isDark ? 'border-slate-800' : 'border-slate-200'
          }`}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
