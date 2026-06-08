import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Settings, Menu, Moon, SunMedium, MessageSquare } from 'lucide-react';
import { Avatar } from '../components/common/Avatar';
import { AutismLogo } from '../components/common/AutismLogo';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { ROUTES } from '../utils/constants';
import { notificationService } from '../services/notificationService';

interface TopNavProps {
  onMenuClick: () => void;
}

export const TopNav = ({ onMenuClick }: TopNavProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { theme, toggleTheme, isDark } = useTheme();
  const [unreadCount, setUnreadCount] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const prevUnreadRef = useRef(0);

  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const list = await notificationService.getNotifications();
        const unreadList = list.filter((n) => !n.isRead);
        const unread = unreadList.length;
        
        if (unread > prevUnreadRef.current && unreadList.length > 0) {
          // Trigger a toast for the newest notification
          const newest = unreadList[0];
          setToastMessage(newest.message || 'You have a new notification!');
          setTimeout(() => setToastMessage(null), 5000);
        }
        
        prevUnreadRef.current = unread;
        setUnreadCount(unread);
      } catch (err) {
        console.warn('Could not load notifications count', err);
      }
    };
    if (user) {
      void fetchUnread();
      const interval = setInterval(() => {
        void fetchUnread();
      }, 10000);
      return () => clearInterval(interval);
    }
  }, [user]);

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 right-6 z-50 p-4 bg-primary-600 text-white rounded-2xl shadow-xl flex items-center gap-3 animate-in slide-in-from-right-8 fade-in duration-300 max-w-sm">
          <Bell className="animate-bounce" size={20} />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}
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
            <AutismLogo size="sm" animated glow />
            <span className={`text-xl font-semibold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}>AutiCare</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 md:gap-5">
          <button 
            onClick={() => navigate(ROUTES.NOTIFICATIONS)}
            className={`relative p-2 rounded-xl transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-100 hover:bg-white/10' 
                : 'text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="View notifications"
          >
            <Bell size={22} />
            {unreadCount > 0 && (
              <span className="absolute top-0.5 right-0.5 px-1.5 py-0.5 text-[9px] font-bold bg-orange-500 text-white rounded-full leading-none flex items-center justify-center min-w-[14px]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Chat Icon */}
          <button
            onClick={() => navigate(ROUTES.CHAT)}
            className={`p-2 rounded-xl transition-colors cursor-pointer ${
              isDark 
                ? 'text-slate-100 hover:bg-white/10' 
                : 'text-slate-900 hover:bg-slate-100'
            }`}
            aria-label="Open chat"
          >
            <MessageSquare size={22} />
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

          <button
            onClick={() => navigate(ROUTES.SETTINGS)}
            className={`p-2 rounded-xl transition-colors hidden md:block cursor-pointer ${
            isDark 
              ? 'text-slate-100 hover:bg-white/10' 
              : 'text-slate-900 hover:bg-slate-100'
          }`}
            aria-label="Open settings"
          >
            <Settings size={22} />
          </button>

          <div className={`flex items-center gap-3 pl-4 md:pl-6 transition-colors ${
            isDark ? 'border-white/10' : 'border-slate-200'
          } border-l`}>
            <div className="text-right hidden sm:block">
              <p className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name || 'User'}</p>
              <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.role || 'Guest'}</p>
            </div>
            <Avatar name={user?.name || ''} size="md" image={user?.profileImage} />
          </div>
        </div>
      </div>
    </header>
    </>
  );
};
