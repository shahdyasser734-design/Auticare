import { Bell, Settings, Menu, Moon, SunMedium } from 'lucide-react';
import { Avatar } from '../components/common/Avatar';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav = ({ onMenuClick }: TopNavProps) => {
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();

  return (
    <header className={`fixed top-0 right-0 left-0 h-16 transition-all duration-300 z-20 ${
      isDark
        ? 'bg-slate-950/80 border-slate-800/50 text-slate-100'
        : 'bg-white/80 border-slate-200 text-slate-900'
    } backdrop-blur-xl border-b shadow-sm`}>
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={onMenuClick}
            className={`p-2 rounded-xl transition-colors ${
              isDark 
                ? 'text-slate-100 hover:bg-white/10' 
                : 'text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Open navigation menu"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-center gap-2">
            <span className={`text-xl font-semibold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>AutiCare</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <button className={`relative p-2 rounded-xl transition-colors ${
            isDark 
              ? 'text-slate-100 hover:bg-white/10' 
              : 'text-slate-900 hover:bg-slate-100'
          }`}>
            <Bell size={22} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-400 rounded-full" />
          </button>

          {/* Enhanced Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-300 group border ${
              isDark
                ? 'bg-white/5 hover:bg-white/10 border-white/10'
                : 'bg-slate-100/50 hover:bg-slate-200 border-slate-300'
            }`}
            aria-label="Toggle theme"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            <div className="relative w-5 h-5 flex items-center justify-center">
              {theme === 'dark' ? (
                <Moon size={18} className={`transition-colors ${
                  isDark 
                    ? 'text-slate-300 group-hover:text-yellow-300' 
                    : 'text-slate-600 group-hover:text-yellow-500'
                }`} />
              ) : (
                <SunMedium size={18} className={`transition-colors ${
                  isDark 
                    ? 'text-slate-300 group-hover:text-yellow-300' 
                    : 'text-slate-600 group-hover:text-yellow-500'
                }`} />
              )}
            </div>
            <span className={`text-xs font-semibold uppercase tracking-wider hidden sm:inline transition-colors ${
              isDark ? 'text-slate-300' : 'text-slate-600'
            }`}>
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>

          <button className={`p-2 rounded-xl transition-colors hidden md:block ${
            isDark 
              ? 'text-slate-100 hover:bg-white/10' 
              : 'text-slate-900 hover:bg-slate-100'
          }`}>
            <Settings size={22} />
          </button>

          <div className={`flex items-center gap-3 pl-4 md:pl-6 transition-colors ${
            isDark ? 'border-white/10' : 'border-slate-200'
          } border-l`}>
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'User'}</p>
              <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.role || 'Guest'}</p>
            </div>
            <Avatar name={user?.name || ''} size="md" />
          </div>
        </div>
      </div>
    </header>
  );
};
