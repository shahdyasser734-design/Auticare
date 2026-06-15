import type { ReactNode } from 'react';
import { GlobalLogo } from '../components/common/GlobalLogo';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

interface ScreeningLayoutProps {
  children: ReactNode;
  confirmExit?: () => Promise<boolean> | boolean;
}

export const ScreeningLayout = ({ children, confirmExit }: ScreeningLayoutProps) => {
  const navigate = useNavigate();

  const handleExit = async () => {
    if (confirmExit) {
      const shouldExit = await confirmExit();
      if (!shouldExit) return;
    }
    navigate(ROUTES.PARENT_HOME);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-navy-900 text-slate-900 dark:text-white flex flex-col transition-colors duration-300">
      <header className="h-20 border-b border-slate-200 dark:border-navy-800 flex items-center justify-between px-6 md:px-12 bg-white/80 dark:bg-navy-900/80 backdrop-blur-sm">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(ROUTES.PARENT_HOME)}>
          <GlobalLogo className="w-10 h-10 scale-50 origin-left" />
          <span className="text-xl font-bold tracking-wide">AutiCare Screening</span>
        </div>
        <button 
          onClick={handleExit}
          className="text-slate-500 dark:text-navy-300 hover:text-slate-900 dark:hover:text-white transition-colors text-sm font-medium"
        >
          Exit Screening
        </button>
      </header>
      <main className="flex-1 flex flex-col items-center justify-center p-6 md:p-12">
        {children}
      </main>
    </div>
  );
};
