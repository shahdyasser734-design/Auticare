import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MessageSquare, ArrowUpRight, BookOpen, Users, Puzzle, Stethoscope, Brain, Sparkles, Activity, Menu, X } from 'lucide-react';
import { Button } from '../components/common/Button';
import { AutismLogo } from '../components/common/AutismLogo';
import { SpecialistCard } from '../components/common/SpecialistCard';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ROUTES, ROLES } from '../utils/constants';
import { useAuth } from '../context/useAuth';
import therapy1 from '../assets/images/therapy-1.jpg';
import therapy2 from '../assets/images/therapy-2.jpg';
import therapy3 from '../assets/images/therapy-3.jpg';
import therapy4 from '../assets/images/therapy-4.jpg';
import therapyOnline from '../assets/images/therapy-online.jpg';
import therapySupport from '../assets/images/therapy-support.jpg';
import therapySpeech from '../assets/images/therapy-speech.jpg';


const specialists = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Neurologist',
    rating: 4.9,
    reviewCount: 124,
    experience: 12,
    bio: 'Specializes in early autism diagnosis and family-centered care planning.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Dr. Ahmed Hassan',
    specialty: 'Speech Therapist',
    rating: 4.8,
    reviewCount: 98,
    experience: 10,
    bio: 'Expert in communication therapy and personalized speech development strategies.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    name: 'Dr. Emily Chen',
    specialty: 'Behavioral Therapist',
    rating: 4.9,
    reviewCount: 156,
    experience: 9,
    bio: 'Certified in ABA therapy with focus on positive behavioral interventions.',
    color: 'from-purple-500 to-purple-600',
  },
  {
    name: 'Dr. Marcus Webb',
    specialty: 'Autism Specialist',
    rating: 4.9,
    reviewCount: 204,
    experience: 15,
    bio: 'Comprehensive developmental assessments and customized intervention strategies.',
    color: 'from-orange-500 to-orange-600',
  }
];

const features = [
  {
    icon: <Heart size={24} />,
    title: 'Compassionate Care',
    description: 'Treatment plans designed with both heart and science.',
  },
  {
    icon: <Users size={24} />,
    title: 'Expert Network',
    description: 'Verified specialists across multiple disciplines.',
  },
  {
    icon: <MessageSquare size={24} />,
    title: 'Direct Communication',
    description: 'Secure messaging with your care team anytime.',
  },
  {
    icon: <BookOpen size={24} />,
    title: 'Progress Tracking',
    description: 'Real-time insights into your child\'s development.',
  },
];

const stats = [
  { value: '5,000+', label: 'Families Supported' },
  { value: '800+', label: 'Verified Specialists' },
  { value: '98%', label: 'Satisfaction Rate' },
];

const therapyServices = [
  {
    title: 'Pediatric Neurology',
    description: 'Expert neurological assessments and specialized diagnostic care for developmental brain conditions.',
    image: therapy4,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Speech & Communication',
    description: 'Personalized support to enhance verbal and non-verbal communication abilities.',
    image: therapyOnline,
    cssBackground: therapySpeech,
    color: 'from-emerald-500 to-emerald-600',
  },

  {
    title: 'Occupational Therapy',
    description: 'Helping children build independence through adaptive daily living skills.',
    image: therapySupport,
    color: 'from-purple-500 to-purple-600',
  },
  {
    title: 'Family Coaching',
    description: 'Empowering parents with strategies and guidance for home-based support.',
    image: therapy4,
    color: 'from-orange-500 to-orange-600',
  },
];

// Role-aware navigation helpers used by navbar and hero CTAs
const GetStartedNavButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handle = () => {
    if (user?.role === ROLES.PARENT) {
      navigate(ROUTES.PARENT_SCREENING);
      return;
    }
    if (user?.role === ROLES.DOCTOR) {
      navigate(ROUTES.DOCTOR_HOME);
      return;
    }
    // default: go to signup to capture role and start onboarding
    navigate(ROUTES.SIGNUP);
  };

  return (
    <Button onClick={handle} size="sm">
      Get Started
    </Button>
  );
};

const PrimaryHeroCta = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handle = () => {
    if (user?.role === ROLES.PARENT) {
      navigate(ROUTES.PARENT_SCREENING);
      return;
    }
    if (user?.role === ROLES.DOCTOR) {
      navigate(ROUTES.DOCTOR_HOME);
      return;
    }
    navigate(ROUTES.SIGNUP);
  };

  return (
    <div className="flex-1 sm:flex-none">
      <Button size="lg" className="w-full sm:w-auto shadow-lg hover:shadow-xl transition-shadow" onClick={handle}>
        Get Started
        <ArrowRight size={20} className="ml-2" />
      </Button>
    </div>
  );
};

export const HomeLanding = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Close menu when clicking links
  const handleNavClick = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-slate-100 to-slate-200 text-slate-800 overflow-hidden dark:from-navy-900 dark:via-navy-950 dark:to-navy-950 dark:text-slate-100 transition-colors duration-500">
      {/* Fixed animated navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-slate-50/80 dark:bg-navy-900/75 backdrop-blur-xl border-b border-slate-300/40 dark:border-white/10 shadow-sm transition-all duration-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            <AutismLogo size="md" animated glow />
            <span className="text-lg sm:text-xl font-bold tracking-wide text-slate-900 dark:text-white">AutiCare</span>
          </div>
          <div className="flex flex-1 items-center justify-end gap-2 sm:gap-4">
            <ThemeToggle />
            <div className="hidden sm:block">
              <Link to={ROUTES.SIGNUP}>
                <Button size="sm" variant="ghost">Sign Up</Button>
              </Link>
            </div>
            <div className="hidden sm:block">
              <Link to={ROUTES.LOGIN}>
                <Button variant="outline" size="sm">Login</Button>
              </Link>
            </div>
            <div className="hidden sm:block">
              <GetStartedNavButton />
            </div>
            <button
              className="sm:hidden p-2 -mr-2 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open menu"
            >
              <Menu size={24} />
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Drawer */}
      <div 
        className={`fixed inset-0 z-[60] bg-slate-900/50 backdrop-blur-sm transition-opacity duration-300 sm:hidden ${
          isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setIsMobileMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 bottom-0 z-[70] w-64 bg-white dark:bg-navy-900 shadow-2xl transition-transform duration-300 ease-in-out sm:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex flex-col h-full">
          <div className="p-4 flex justify-end border-b border-slate-200 dark:border-white/10">
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-2 text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white transition-colors rounded-full hover:bg-slate-100 dark:hover:bg-white/10"
              aria-label="Close menu"
            >
              <X size={24} />
            </button>
          </div>
          <div className="flex flex-col py-6 px-4 gap-2 overflow-y-auto">
            <a href="#" onClick={handleNavClick} className="p-3 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">Home</a>
            <a href="#" onClick={handleNavClick} className="p-3 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">About</a>
            <a href="#" onClick={handleNavClick} className="p-3 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">Services</a>
            <a href="#" onClick={handleNavClick} className="p-3 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">Specialists</a>
            
            <div className="h-px bg-slate-200 dark:bg-white/10 my-4 mx-2" />
            
            <Link to={ROUTES.LOGIN} onClick={handleNavClick} className="p-3 text-lg font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-white/5 rounded-xl transition-colors">Login</Link>
            <Link to={ROUTES.SIGNUP} onClick={handleNavClick} className="p-3 text-lg font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors">Sign Up</Link>
          </div>
        </div>
      </div>

      <main className="pt-16">
        {/* HERO SECTION */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* Subtle animated floating medical/autism-themed decorative elements */}
          <div className="absolute top-1/4 left-10 pointer-events-none animate-float-slow opacity-15 dark:opacity-25 text-amber-500 dark:text-blue-400">
            <Puzzle size={40} className="stroke-[1.5]" />
          </div>
          <div className="absolute top-1/3 right-1/4 pointer-events-none animate-float-delayed opacity-10 dark:opacity-20 text-indigo-500 dark:text-purple-400">
            <Brain size={48} className="stroke-[1.5]" />
          </div>
          <div className="absolute bottom-1/4 left-1/3 pointer-events-none animate-float-slow opacity-10 dark:opacity-20 text-emerald-500 dark:text-emerald-400">
            <Stethoscope size={36} className="stroke-[1.5]" />
          </div>
          <div className="absolute top-10 right-10 pointer-events-none animate-pulse-slow opacity-20 text-orange-400">
            <Sparkles size={32} />
          </div>
          <div className="absolute bottom-10 right-12 pointer-events-none animate-float-delayed opacity-15 text-rose-400">
            <Heart size={28} className="fill-current" />
          </div>
          <div className="absolute top-1/2 left-4 pointer-events-none animate-pulse-glow opacity-10 text-cyan-400">
            <Activity size={32} />
          </div>

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="grid lg:grid-cols-2 gap-16 items-center">
              <div className="space-y-6 animate-slide-up">
                <div>
                  <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-tight tracking-tight">
                    <span className="text-slate-900 dark:text-white">We help your child grow and communicate with confidence.</span>
                  </h1>
                </div>

                <p className="text-lg sm:text-xl text-slate-600 dark:text-slate-300 max-w-xl leading-relaxed">
                  AutiCare connects parents with trusted autism specialists, therapy support, developmental tracking, and AI-powered screening tools in one modern platform.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <PrimaryHeroCta />
                  <Link to={ROUTES.LOGIN} className="flex-1 sm:flex-none">
                    <Button size="lg" variant="outline" className="w-full sm:w-auto">
                      Login
                    </Button>
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-8 border-t border-slate-200/60 dark:border-white/10">
                  {stats.map((stat) => (
                    <div key={stat.label} className="space-y-1">
                      <p className="text-2xl font-bold text-amber-600 dark:text-blue-400">{stat.value}</p>
                      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Clean Responsive Grid Hero Visual */}
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 mt-12 lg:mt-0 relative z-20">
                <div className="aspect-[4/3] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 standard-card/5 backdrop-blur-sm p-1.5">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <img src={therapy1} alt="Mother helping child with crafts" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }} />
                  </div>
                </div>
                <div className="aspect-[4/3] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 sm:mt-12 standard-card/5 backdrop-blur-sm p-1.5">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <img src={therapy2} alt="Child using tablet" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }} />
                  </div>
                </div>
                <div className="aspect-[4/3] lg:aspect-[4/5] rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 sm:mt-8 lg:mt-24 standard-card/5 backdrop-blur-sm p-1.5 sm:justify-self-center sm:col-span-2 lg:col-span-1 lg:justify-self-auto sm:max-w-md lg:max-w-none w-full">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <img src={therapy3} alt="Mother teaching child at desk" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }} />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THERAPY SUPPORT SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative">
          {/* Subtle background element */}
          <div className="absolute inset-0 bg-blue-50/30 dark:bg-navy-800/30 -z-10" />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <span className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-sm font-semibold mb-4">
                Comprehensive Support
              </span>
              <h2 className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white mb-6">
                Therapy Services Built for Growth
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                From communication to behavioral support, we connect families with specialists who care.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              {therapyServices.map((service, idx) => (
                <div
                  key={service.title}
                  className="group rounded-3xl overflow-hidden border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl hover:shadow-2xl dark:hover:border-white/20 transition-all duration-500 hover:-translate-y-2 cursor-pointer"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="relative aspect-[4/3] lg:aspect-[16/9] w-full overflow-hidden">
                    {(service as unknown as { cssBackground?: string }).cssBackground ? (
                      // CSS background-image approach for crisp, sharp rendering
                      <div
                        className="absolute inset-0 w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-700"
                        style={{ backgroundImage: `url(${(service as unknown as { cssBackground?: string }).cssBackground})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
                      />
                    ) : (
                      <img
                        src={service.image}
                        alt={service.title}
                        className="absolute inset-0 w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                      />
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
                    <div className={`absolute inset-0 bg-gradient-to-br ${service.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500`} />
                  </div>
                  <div className="p-8 relative">
                    <div className="absolute -top-6 right-8 w-12 h-12 bg-white dark:bg-navy-800 rounded-full flex items-center justify-center shadow-lg group-hover:-translate-y-2 transition-transform duration-500">
                      <ArrowUpRight className="text-blue-600 dark:text-blue-400" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-3">{service.title}</h3>
                    <p className="text-slate-600 dark:text-slate-400">{service.description}</p>
                  </div>
                </div>
              ))}
            </div>

          </div>
        </section>

        {/* SPECIALISTS SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-50/50 dark:via-blue-500/5 to-transparent -z-10" />

          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <span className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-500/20 text-blue-700 dark:text-blue-300 text-xs font-semibold uppercase tracking-wider mb-4">
                Expert Team
              </span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                Meet Our Specialists
              </h2>
              <p className="text-xl text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
                Handpicked experts across multiple disciplines, all dedicated to providing compassionate, evidence-based autism care for your family.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {specialists.map((specialist, idx) => (
                <div key={specialist.name} style={{ animationDelay: `${idx * 75}ms` }}>
                  <SpecialistCard
                    name={specialist.name}
                    specialty={specialist.specialty}
                    rating={specialist.rating}
                    reviewCount={specialist.reviewCount}
                    experience={specialist.experience}
                    bio={specialist.bio}
                    color={specialist.color}
                    onBook={() => {
                      window.location.href = ROUTES.LOGIN;
                    }}
                  />
                </div>
              ))}
            </div>

            <div className="text-center mt-16">
              <Link to={ROUTES.SIGNUP}>
                <Button size="lg" className="shadow-lg">Browse All 800+ Specialists</Button>
              </Link>
            </div>
          </div>
        </section>

        {/* FEATURES SECTION */}
        <section className="py-20 px-4 sm:px-6 lg:px-8 relative">
          <div className="absolute inset-0 bg-slate-50/50 dark:bg-navy-800/50 -z-10" />
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl font-bold text-slate-900 dark:text-white mb-4">
                Why Families Choose AutiCare
              </h2>
              <p className="text-lg text-slate-600 dark:text-slate-300 max-w-2xl mx-auto">
                A comprehensive platform designed for every part of your autism care journey.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, idx) => (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:standard-card/5 p-6 backdrop-blur-xl hover: dark:hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-1"
                  style={{ animationDelay: `${idx * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">{feature.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-slate-400">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* PROGRESS PREVIEW */}
        <section className="py-16 lg:py-24 px-4 sm:px-6 lg:px-8 relative">
          <div className="max-w-7xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 dark:shadow-none overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-r from-blue-50/50 via-transparent to-purple-50/50 dark:from-blue-500/5 dark:to-purple-500/5" />
              <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
                <div>
                  <span className="inline-block px-4 py-2 rounded-full bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-sm font-semibold mb-4">
                    Track Progress
                  </span>
                  <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                    See Growth in Real Time
                  </h2>
                  <p className="text-lg text-slate-600 dark:text-slate-400 mb-8 leading-relaxed">
                    Visual dashboards and clear milestones help families track therapeutic progress. Celebrate every breakthrough, no matter how small.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">94%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completion Rate</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">12 wks</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Avg. Improvement</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">3.2x</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Engagement ↑</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 h-80 flex items-center justify-center -inner">
                  <div className="text-center text-slate-500 dark:text-slate-400">
                    <div className="w-32 h-32 rounded-full border-4 border-blue-500/20 mx-auto mb-4 flex items-center justify-center shadow-lg bg-white dark:bg-navy-900">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">89%</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Progress</p>
                      </div>
                    </div>
                    <p className="font-medium text-slate-700 dark:text-slate-300">Analytics Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA SECTION — premium redesign */}
        <section className="py-20 lg:py-32 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
          {/* CSS gradient background — visible in both light & dark */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-indigo-700 to-purple-800 dark:from-blue-900 dark:via-indigo-950 dark:to-purple-950" />
          {/* Soft inner glow */}
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-10%,rgba(120,119,198,0.35),transparent)]" />

          {/* SVG decorative puzzle-piece artwork — always visible */}
          <svg
            aria-hidden="true"
            className="absolute right-0 top-0 h-full w-1/2 opacity-[0.07] pointer-events-none"
            viewBox="0 0 500 500"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="250" cy="250" r="220" fill="none" stroke="white" strokeWidth="2" />
            <circle cx="250" cy="250" r="160" fill="none" stroke="white" strokeWidth="1.5" />
            <circle cx="250" cy="250" r="80"  fill="none" stroke="white" strokeWidth="1" />
            <line x1="30" y1="250" x2="470" y2="250" stroke="white" strokeWidth="1" />
            <line x1="250" y1="30" x2="250" y2="470" stroke="white" strokeWidth="1" />
            <g fill="white" opacity="0.5">
              <circle cx="250" cy="70"  r="8" />
              <circle cx="430" cy="250" r="8" />
              <circle cx="250" cy="430" r="8" />
              <circle cx="70"  cy="250" r="8" />
            </g>
            {/* Puzzle pieces */}
            <path d="M200 160 h40 a0 0 0 0 1 40 0 v40 a0 0 0 0 0 0 40 h-40 a0 0 0 0 1-40 0v-40a0 0 0 0 0 0-40z" fill="none" stroke="white" strokeWidth="2" />
            <path d="M280 240 h40 a0 0 0 0 1 40 0 v40 a0 0 0 0 0 0 40 h-40 a0 0 0 0 1-40 0v-40a0 0 0 0 0 0-40z" fill="none" stroke="white" strokeWidth="2" />
            <path d="M140 300 h40 a0 0 0 0 1 40 0 v40 a0 0 0 0 0 0 40 h-40 a0 0 0 0 1-40 0v-40a0 0 0 0 0 0-40z" fill="none" stroke="white" strokeWidth="2" />
          </svg>

          {/* Floating orbs */}
          <div className="absolute top-12 left-12 w-40 h-40 bg-white/5 rounded-full blur-2xl" />
          <div className="absolute bottom-16 right-24 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/4 w-32 h-32 bg-blue-400/10 rounded-full blur-2xl" />

          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/20 text-white/90 text-sm font-semibold mb-8 backdrop-blur-sm">
              <Heart size={14} className="fill-pink-300 text-pink-300" />
              Trusted by 5,000+ Families
            </div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white mb-6 leading-tight tracking-tight">
              Every Child Deserves<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-sky-300 to-violet-300">
                Expert Care &amp; Support
              </span>
            </h2>

            <p className="text-lg sm:text-xl text-blue-100/90 mb-10 max-w-2xl mx-auto leading-relaxed">
              Start with an AI-powered autism screening today. Get personalized treatment plans,
              connect with certified specialists, and track your child's progress — all in one place.
            </p>

            {/* Trust indicators */}
            <div className="flex flex-wrap justify-center gap-6 mb-10 text-sm text-white/70">
              {['🔒 Confidential', '🏥 Clinically Validated', '💬 Specialist-Reviewed', '🌍 Available 24/7'].map(t => (
                <span key={t} className="flex items-center gap-1 font-medium">{t}</span>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={ROUTES.SIGNUP}>
                <Button size="lg" className="bg-white text-indigo-700 hover:bg-blue-50 font-bold shadow-2xl shadow-black/30 hover:shadow-black/40 transition-all duration-300 w-full sm:w-auto px-10">
                  Begin Your Journey
                  <ArrowRight size={20} className="ml-2" />
                </Button>
              </Link>
              <Link to={ROUTES.LOGIN}>
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 backdrop-blur-sm font-semibold w-full sm:w-auto px-8">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>


        {/* FOOTER */}
        <footer className="border-t border-white/10 bg-slate-900 dark:bg-navy-950 py-16 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
              {/* Brand column */}
              <div className="sm:col-span-2 lg:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <AutismLogo size="sm" animated={false} glow={false} />
                  <span className="font-bold text-white text-xl">AutiCare</span>
                </div>
                <p className="text-sm text-slate-400 leading-relaxed pr-4">
                  Empowering families through AI-powered autism screening, specialist consultations,
                  therapy tracking, and personalized treatment planning.
                </p>
                <div className="mt-6 flex gap-3">
                  {/* Social icons as colored dots for style */}
                  {['💙','🟣','🟢'].map((c, i) => (
                    <span key={i} className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-sm cursor-pointer hover:bg-white/20 transition-colors">{c}</span>
                  ))}
                </div>
              </div>

              {/* Platform */}
              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Platform</h4>
                <ul className="space-y-3 text-sm">
                  {['Autism Screening', 'Specialists', 'Treatment Plans', 'Therapy Sessions'].map(link => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Support */}
              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Support</h4>
                <ul className="space-y-3 text-sm">
                  {['Contact Us', 'Help Center', 'Privacy Policy', 'Terms &amp; Conditions'].map(link => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors" dangerouslySetInnerHTML={{ __html: link }} />
                    </li>
                  ))}
                </ul>
              </div>

              {/* Resources */}
              <div>
                <h4 className="font-semibold text-white mb-5 text-sm uppercase tracking-wider">Resources</h4>
                <ul className="space-y-3 text-sm">
                  {['Parent Guidance', 'Autism Awareness', 'Care Tips', 'FAQs'].map(link => (
                    <li key={link}>
                      <a href="#" className="text-slate-400 hover:text-blue-400 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="border-t border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-sm text-slate-500">
              <p>© 2026 AutiCare. All rights reserved.</p>
              <div className="flex gap-6">
                <a href="#" className="hover:text-slate-300 transition-colors">Privacy Policy</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Terms of Service</a>
                <a href="#" className="hover:text-slate-300 transition-colors">Contact Us</a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
