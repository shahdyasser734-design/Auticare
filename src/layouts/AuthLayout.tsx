import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Shield, Star, Puzzle, Stethoscope } from 'lucide-react';
import { GlobalLogo } from '../components/common/GlobalLogo';
import { ROUTES } from '../utils/constants';
import authHeroImg from '../assets/images/auth-hero.jpg';

interface AuthLayoutProps {
  children: ReactNode;
}

export const AuthLayout = ({ children }: AuthLayoutProps) => {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 overflow-hidden">
      {/* Subtle radial gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.15),_transparent_35%),radial-gradient(circle_at_bottom_right,_rgba(168,85,247,0.15),_transparent_30%)] pointer-events-none z-0" />

      <div className="relative z-10 min-h-screen grid grid-cols-1 lg:grid-cols-2">

        {/* ── LEFT PANEL: Professional image + brand overlay ── */}
        <div className="relative hidden lg:flex flex-col overflow-hidden">
          {/* Background image */}
          <img
            src={authHeroImg}
            alt="Compassionate autism therapy support"
            className="absolute inset-0 w-full h-full object-cover object-center"
          />

          {/* Dark overlay for readability */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-950/80 via-slate-900/60 to-blue-950/70" />

          {/* Floating animation elements */}
          <div className="absolute top-16 left-10 animate-puzzle-1 text-amber-400/30 pointer-events-none">
            <Puzzle size={48} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-24 right-12 animate-puzzle-2 text-cyan-400/25 pointer-events-none">
            <Puzzle size={36} strokeWidth={1.5} />
          </div>
          <div className="absolute top-1/3 right-8 animate-stethoscope text-blue-400/40 pointer-events-none">
            <Stethoscope size={42} strokeWidth={1.5} />
          </div>
          <div className="absolute bottom-1/3 left-8 animate-particle-2 text-rose-400/30 pointer-events-none">
            <Heart size={28} className="fill-current" />
          </div>

          {/* Soft floating particles */}
          <div className="absolute top-1/4 left-1/4 w-2 h-2 rounded-full bg-cyan-400/40 animate-particle-1 pointer-events-none" />
          <div className="absolute top-2/3 right-1/3 w-1.5 h-1.5 rounded-full bg-amber-400/50 animate-particle-3 pointer-events-none" />
          <div className="absolute top-1/2 left-1/2 w-1 h-1 rounded-full bg-purple-400/40 animate-particle-2 pointer-events-none" />

          {/* Brand content */}
          <div className="relative z-10 flex flex-col h-full p-10 justify-between">
            {/* Logo */}
            <Link to={ROUTES.ROOT} className="flex items-center gap-3">
              <GlobalLogo animated className="w-10 h-10" />
              <span className="text-xl font-bold tracking-wide text-white">AutiCare</span>
            </Link>

            {/* Main brand statement */}
            <div className="space-y-6">
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

              {/* Stats row */}
              <div className="flex gap-8 pt-4 border-t border-white/10">
                {[
                  { value: '5,000+', label: 'Families' },
                  { value: '800+', label: 'Specialists' },
                  { value: '98%', label: 'Satisfaction' },
                ].map((stat) => (
                  <div key={stat.label}>
                    <p className="text-xl font-bold text-white">{stat.value}</p>
                    <p className="text-xs text-slate-400">{stat.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Footer disclaimer */}
            <p className="text-xs text-slate-500">
              © 2025 AutiCare · Confidential · Professional · Specialized Care
            </p>
          </div>
        </div>

        {/* ── RIGHT PANEL: Auth form ── */}
        <div className="flex flex-col items-center justify-center min-h-screen p-6 sm:p-10 lg:p-12 relative">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-3 mb-8">
            <GlobalLogo animated className="w-10 h-10" />
            <span className="text-xl font-bold text-white">AutiCare</span>
          </div>

          <div className="w-full max-w-md">
            <div className="rounded-[2rem] border border-white/10 bg-slate-900/95 p-8 shadow-2xl backdrop-blur-xl">
              <div className="rounded-[1.5rem] bg-slate-950/90 p-8 shadow-inner">
                <div className="space-y-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
