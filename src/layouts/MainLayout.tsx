import { useState, type ReactNode } from 'react';
import { useTheme } from '../context/ThemeContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isDark } = useTheme();

  return (
    <div className={`flex min-h-screen transition-colors duration-300 ${
      isDark 
        ? 'bg-slate-950 text-slate-100' 
        : 'bg-slate-50 text-slate-900'
    }`}>
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />
      <div className="flex-1 w-full flex flex-col min-h-screen">
        <TopNav onMenuClick={() => setIsSidebarOpen(true)} />
        <main className={`mt-16 p-5 md:p-8 lg:p-10 flex-1 transition-colors duration-300 ${
          isDark 
            ? 'bg-slate-950' 
            : 'bg-white'
        }`}>
          {children}
        </main>
      </div>
    </div>
  );
};
