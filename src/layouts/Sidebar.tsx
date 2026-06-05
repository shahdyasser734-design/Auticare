import { Link, useLocation } from 'react-router-dom';
import { X, LogOut } from 'lucide-react';
import { useAuth } from '../context/useAuth';
import { useTheme } from '../context/useTheme';
import { useLanguage } from '../context/useLanguage';
import { Avatar } from '../components/common/Avatar';
import { AutismLogo } from '../components/common/AutismLogo';
import { ROUTES, ROLES } from '../utils/constants';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export const Sidebar = ({ isOpen, setIsOpen }: SidebarProps) => {
  const { user, logout } = useAuth();
  const { isDark } = useTheme();
  const { t } = useLanguage();
  const location = useLocation();

  const getMenuItems = () => {
    if (!user) return [];

    const baseItems = [
      { label: t.notifications, href: ROUTES.NOTIFICATIONS },
      { label: t.chat, href: ROUTES.CHAT },
      { label: t.settings, href: ROUTES.SETTINGS },
      { label: t.profile, href: ROUTES.PROFILE },
    ];

    const roleItems = {
      [ROLES.PARENT]: [
        { label: t.home, href: ROUTES.PARENT_HOME },
        { label: t.autismScreening, href: ROUTES.PARENT_SCREENING },
        { label: t.screeningResults, href: ROUTES.PARENT_SCREENING_RESULTS },
        { label: t.doctors, href: ROUTES.PARENT_DOCTORS },
        { label: t.therapists, href: ROUTES.PARENT_THERAPISTS },
        { label: t.myBookings, href: ROUTES.PARENT_MY_BOOKINGS },
        { label: t.sessions, href: ROUTES.PARENT_SESSIONS },
      ],
      [ROLES.DOCTOR]: [
        { label: t.home, href: ROUTES.DOCTOR_HOME },
        { label: t.sessions, href: ROUTES.DOCTOR_SESSIONS },
        { label: t.cases, href: ROUTES.DOCTOR_PATIENTS },
      ],
      [ROLES.THERAPIST]: [
        { label: t.home, href: ROUTES.THERAPIST_HOME },
        { label: t.sessions, href: ROUTES.THERAPIST_SESSIONS },
        { label: t.cases, href: ROUTES.THERAPIST_PATIENTS },
      ],
    };

    const roleKey = (user?.role || '') as keyof typeof roleItems | '';
    const roleMenu = roleKey ? roleItems[roleKey] || [] : [];
    return [...roleMenu, ...baseItems];
  };

  const isActive = (href: string) => location.pathname === href;
  const menuItems = getMenuItems();

  return (
    <>
      {/* Sidebar Overlay */}
      <div
        className={clsx(
          'fixed inset-0 backdrop-blur-sm z-40 transition-opacity duration-300',
          isDark ? 'bg-slate-950/70' : 'bg-black/20',
          isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'
        )}
        onClick={() => setIsOpen(false)}
      />

      {/* Sidebar Content */}
      <aside
        className={clsx(
          'fixed left-0 top-0 h-screen w-full max-w-xs sm:max-w-sm md:w-72 shadow-2xl overflow-y-auto transition-transform duration-300 z-50 flex flex-col',
          isDark
            ? 'bg-slate-950/95 border-white/10'
            : 'bg-white border-slate-200',
          'border-r',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="p-6 flex-1 flex flex-col">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <AutismLogo size="md" />
              <div>
                <h1 className={`text-2xl font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>AutiCare</h1>
                <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{t.careDashboard}</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-2 rounded-xl transition-colors ${
                isDark 
                  ? 'text-slate-200 hover:bg-white/10' 
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>

          {/* User Profile */}
          <div className={`mb-8 p-4 rounded-3xl border transition-colors ${
            isDark
              ? 'border-white/10 bg-white/5 backdrop-blur-xl'
              : 'border-slate-200 bg-slate-50'
          }`}>
            <div className="flex items-center gap-3 mb-3">
              <Avatar name={user?.name || ''} size="md" />
              <div>
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>{user?.name}</p>
                <p className={`text-xs capitalize ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>{user?.role}</p>
              </div>
            </div>
            <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>{t.secureConnection}</p>
          </div>

          {/* Navigation Menu */}
          <nav className="space-y-1.5 flex-1">
            {menuItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                onClick={() => setIsOpen(false)}
                className={clsx(
                  'flex items-center gap-3 px-4 py-3 rounded-2xl transition-all duration-200',
                  isActive(item.href)
                    ? isDark
                      ? 'bg-primary-700/20 text-white shadow-lg'
                      : 'bg-orange-100 text-orange-700 shadow-md'
                    : isDark
                    ? 'text-slate-300 hover:bg-white/10 hover:text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                )}
              >
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
          </nav>

          {/* Logout Button */}
          <div className={`pt-6 border-t mt-auto transition-colors ${
            isDark ? 'border-white/10' : 'border-slate-200'
          }`}>
            <button
              onClick={() => {
                logout();
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-colors font-medium ${
                isDark
                  ? 'text-orange-300 hover:bg-orange-500/10'
                  : 'text-orange-600 hover:bg-orange-50'
              }`}
            >
              <LogOut size={20} />
              {t.logout}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
