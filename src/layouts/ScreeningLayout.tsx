import type { ReactNode } from 'react';
import { GlobalLogo } from '../components/common/GlobalLogo';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../utils/constants';

export const ScreeningLayout = ({ children }: { children: ReactNode }) => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-navy-900 text-white flex flex-col">
      <header className="h-20 border-b border-navy-800 flex items-center justify-between px-6 md:px-12">
        <div className="flex items-center gap-4 cursor-pointer" onClick={() => navigate(ROUTES.PARENT_HOME)}>
          <GlobalLogo className="w-10 h-10 scale-50 origin-left" />
          <span className="text-xl font-bold tracking-wide">AutiCare Screening</span>
        </div>
        <button 
          onClick={() => navigate(ROUTES.PARENT_HOME)}
          className="text-navy-300 hover:text-white transition-colors text-sm font-medium"
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
