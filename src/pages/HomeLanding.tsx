import { Link, useNavigate } from 'react-router-dom';
import { ArrowRight, Heart, MessageSquare, ArrowUpRight, BookOpen, Users, Puzzle, Stethoscope, Brain, Sparkles, Activity } from 'lucide-react';
import { Button } from '../components/common/Button';
import { AutismLogo } from '../components/common/AutismLogo';
import { SpecialistCard } from '../components/common/SpecialistCard';
import { ThemeToggle } from '../components/common/ThemeToggle';
import { ROUTES, ROLES } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import therapy1 from '../assets/images/therapy-1.jpg';
import therapy2 from '../assets/images/therapy-2.jpg';
import therapy3 from '../assets/images/therapy-3.jpg';
import therapy4 from '../assets/images/therapy-4.jpg';
import therapy5 from '../assets/images/therapy-5.jpg';
import therapyOnline from '../assets/images/therapy-online.jpg';
import therapySupport from '../assets/images/therapy-support.jpg';

const specialists = [
  {
    name: 'Dr. Sarah Johnson',
    specialty: 'Developmental Pediatrics',
    rating: 4.9,
    reviewCount: 124,
    experience: 12,
    bio: 'Specializes in early autism diagnosis and family-centered care planning.',
    color: 'from-blue-500 to-blue-600',
  },
  {
    name: 'Dr. Ahmed Hassan',
    specialty: 'Speech & Language Pathology',
    rating: 4.8,
    reviewCount: 98,
    experience: 10,
    bio: 'Expert in communication therapy and personalized speech development strategies.',
    color: 'from-emerald-500 to-emerald-600',
  },
  {
    name: 'Dr. Emily Chen',
    specialty: 'Behavioral Therapy',
    rating: 4.9,
    reviewCount: 156,
    experience: 9,
    bio: 'Certified in ABA therapy with focus on positive behavioral interventions.',
    color: 'from-purple-500 to-purple-600',
  },
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
    title: 'Behavioral Therapy',
    description: 'Evidence-based approaches to build positive behaviors and develop new skills.',
    image: therapy4,
    color: 'from-blue-500 to-blue-600',
  },
  {
    title: 'Speech & Communication',
    description: 'Personalized support to enhance verbal and non-verbal communication abilities.',
    image: therapyOnline,
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
    image: therapy5,
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
            <GetStartedNavButton />
          </div>
        </div>
      </nav>

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
                <div className="aspect-[4/3] sm:aspect-auto sm:h-72 lg:h-96 rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 bg-white/5 backdrop-blur-sm p-1.5">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <img src={therapy1} alt="Mother helping child with crafts" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }} />
                  </div>
                </div>
                <div className="aspect-[4/3] sm:aspect-auto sm:h-72 lg:h-96 rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 sm:mt-12 bg-white/5 backdrop-blur-sm p-1.5">
                  <div className="w-full h-full rounded-[1.5rem] overflow-hidden">
                    <img src={therapy2} alt="Child using tablet" className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105" style={{ imageRendering: 'auto', backfaceVisibility: 'hidden', transform: 'translateZ(0)' }} />
                  </div>
                </div>
                <div className="aspect-[4/3] sm:aspect-auto sm:h-72 lg:h-96 rounded-[2rem] overflow-hidden shadow-xl border border-slate-200/50 dark:border-white/10 group relative transform hover:-translate-y-2 transition-all duration-500 sm:col-span-2 lg:col-span-1 sm:mt-8 lg:mt-24 bg-white/5 backdrop-blur-sm p-1.5">
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
                  <div className="relative aspect-video sm:aspect-[4/3] lg:aspect-[16/9] overflow-hidden">
                    <img
                      src={service.image}
                      alt={service.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
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
                  className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 p-6 backdrop-blur-xl hover:shadow-xl dark:hover:border-blue-400/50 transition-all duration-300 hover:-translate-y-1"
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
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 backdrop-blur-xl p-8 sm:p-12 shadow-xl dark:shadow-none overflow-hidden relative">
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
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 border border-slate-200 dark:border-white/10 text-center">
                      <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-300">94%</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Completion Rate</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 border border-slate-200 dark:border-white/10 text-center">
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-300">12 wks</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Avg. Improvement</p>
                    </div>
                    <div className="rounded-lg bg-slate-50 dark:bg-white/10 p-4 border border-slate-200 dark:border-white/10 text-center">
                      <p className="text-2xl font-bold text-purple-600 dark:text-purple-300">3.2x</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Engagement ↑</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-2xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 p-6 h-80 flex items-center justify-center shadow-inner">
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

        {/* CTA SECTION */}
        <section className="py-20 lg:py-28 px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto">
            <div className="rounded-3xl border border-slate-200 dark:border-white/10 bg-gradient-to-br from-blue-50 dark:from-blue-900/40 to-purple-50 dark:to-purple-900/40 backdrop-blur-xl p-12 sm:p-16 text-center shadow-2xl relative overflow-hidden">
              <div className="absolute inset-0 opacity-10 dark:opacity-20 mix-blend-overlay">
                <img src={therapy5} alt="Background" className="w-full h-full object-cover" />
              </div>
              <div className="relative z-10">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 dark:text-white mb-6 tracking-tight">
                  Ready to Start Your Journey?
                </h2>
                <p className="text-lg text-slate-700 dark:text-slate-200 mb-8 max-w-2xl mx-auto">
                  Join thousands of families who are getting compassionate, expert autism care with AutiCare.
                </p>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Link to={ROUTES.SIGNUP}>
                    <Button size="lg" className="shadow-lg hover:shadow-xl transition-shadow w-full sm:w-auto">
                      Start Screening
                      <ArrowRight size={20} className="ml-2" />
                    </Button>
                  </Link>
                </div>

                <p className="text-sm text-slate-600 dark:text-slate-300 mt-8 font-medium">
                  Confidential • Professional • Specialized Care
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-slate-200 dark:border-white/10 bg-white dark:bg-navy-900 py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-7xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <AutismLogo size="sm" animated={false} glow={false} />
                  <span className="font-bold text-slate-900 dark:text-white text-lg">AutiCare</span>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-400 pr-4">
                  Compassionate, professional autism care for modern families. Connect, track, and thrive.
                </p>
              </div>
              {['Product', 'Company', 'Resources'].map((section) => (
                <div key={section}>
                  <h4 className="font-semibold text-slate-900 dark:text-white mb-4 text-sm uppercase tracking-wider">{section}</h4>
                  <ul className="space-y-3 text-sm">
                    <li>
                      <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Features
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Pricing
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-slate-600 dark:text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                        Blog
                      </a>
                    </li>
                  </ul>
                </div>
              ))}
            </div>

            <div className="border-t border-slate-200 dark:border-white/10 pt-8 flex flex-col sm:flex-row justify-between items-center text-sm text-slate-600 dark:text-slate-400">
              <p>&copy; 2024 AutiCare. All rights reserved.</p>
              <div className="flex gap-6 mt-4 sm:mt-0">
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Privacy Policy
                </a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="hover:text-slate-900 dark:hover:text-white transition-colors">
                  Contact Us
                </a>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
};
