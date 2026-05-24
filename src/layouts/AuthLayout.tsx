import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Star, Puzzle, Stethoscope } from 'lucide-react';
import { GlobalLogo } from '../components/common/GlobalLogo';
import { ROUTES } from '../utils/constants';
import { useTheme } from '../context/useTheme';
import { ThemeToggle } from '../components/common/ThemeToggle';
import authHeroImg from '../assets/images/auth-hero.jpg';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  const { isDark } = useTheme();

  return (
    <div className={`min-h-screen flex flex-col lg:grid lg:grid-cols-2 transition-colors duration-500 ${isDark ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggle />
      </div>
      {/* Subtle radial gradients (desktop only to save performance on mobile) */}
      <div className="hidden lg:block absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.15),_transparent_30%)] pointer-events-none z-0" />

      {/* ── IMAGE PANEL (Responsive Header on Mobile, Left Column on Desktop) ── */}
      <div className="relative flex flex-col overflow-hidden h-48 sm:h-64 lg:sticky lg:top-0 lg:h-screen w-full flex-shrink-0 z-10 lg:z-auto lg:self-start">
        {/* Background image */}
        <img
          src={authHeroImg}
          alt="Compassionate autism therapy support"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        {/* Dark overlay for readability */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/50 to-blue-950/60 lg:to-blue-950/70" />

        {/* Floating animation elements (Hidden on mobile for cleaner layout) */}
        <div className="hidden lg:block absolute top-16 left-10 animate-puzzle-1 text-amber-400/30 pointer-events-none">
          <Puzzle size={48} strokeWidth={1.5} />
        </div>
        <div className="hidden lg:block absolute bottom-24 right-12 animate-puzzle-2 text-cyan-400/25 pointer-events-none">
          <Puzzle size={36} strokeWidth={1.5} />
        </div>
        <div className="hidden lg:block absolute top-1/3 right-8 animate-stethoscope text-blue-400/40 pointer-events-none">
          <Stethoscope size={42} strokeWidth={1.5} />
        </div>
        <div className="hidden lg:block absolute bottom-1/3 left-8 animate-particle-2 text-rose-400/30 pointer-events-none">
          <Heart size={28} className="fill-current" />
        </div>

        {/* Brand content */}
        <div className="relative z-10 flex flex-col h-full p-6 lg:p-10 justify-between items-center lg:items-start text-center lg:text-left">
          {/* Logo - Center on mobile, Top-Left on desktop */}
          <Link to={ROUTES.ROOT} className="flex items-center gap-3 mt-auto mb-auto lg:mt-0 lg:mb-0">
            <GlobalLogo animated size="md" />
            <span className="text-2xl lg:text-xl font-bold tracking-wide text-white drop-shadow-md">AutiCare</span>
          </Link>

          {/* Main brand statement - Hidden on very small screens, visible on desktop */}
          <div className="hidden lg:block space-y-6 mt-8">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/15 text-xs font-semibold text-cyan-300 uppercase tracking-widest">
              <Star size={12} className="fill-current" />
              Trusted Autism Care Platform
            </div>

            <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-tight tracking-tight">
              Empowering Every<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                Breakthrough
              </span>
            </h1>

            <p className="text-slate-300 text-lg leading-relaxed max-w-sm">
              A warm, nurturing space connecting parents, doctors, and therapists for personalized autism care and developmental support.
            </p>

            {/* Trust badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/20 flex items-center justify-center">
                  <Shield size={16} className="text-cyan-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Early Support</p>
                  <p className="text-[10px] text-slate-400">AI-powered screening</p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-2xl bg-white/8 border border-white/10 backdrop-blur-sm p-4">
                <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center">
                  <Heart size={16} className="text-purple-400" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">Unified Care</p>
                  <p className="text-[10px] text-slate-400">Verified specialists</p>
                </div>
              </div>
            </div>
          </div>

          {/* Footer disclaimer */}
          <p className="hidden lg:block text-xs text-slate-500 mt-auto">
            © 2025 AutiCare · Confidential · Professional · Specialized Care
          </p>
        </div>
      </div>

      {/* ── RIGHT PANEL: Auth form ── */}
      <div className="flex flex-1 flex-col items-center justify-start lg:justify-center p-6 sm:p-10 lg:p-12 relative z-10 w-full -mt-6 lg:mt-0 lg:min-h-screen">
        <div className="w-full max-w-md relative">
          <div className={`rounded-[2rem] border p-6 sm:p-8 shadow-2xl backdrop-blur-xl ${isDark ? 'border-white/10 bg-slate-900/95' : 'border-slate-200 bg-white/95'}`}>
            <div className={`rounded-[1.5rem] p-6 sm:p-8 shadow-inner relative z-10 ${isDark ? 'bg-slate-950/90' : 'bg-slate-50/90'}`}>
              <div className="space-y-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
};
