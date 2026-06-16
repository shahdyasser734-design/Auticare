import { useRef, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Calendar, TrendingUp, Clock, User, FileText } from 'lucide-react';
import type { PatientCard } from '../../services/api/dashboard';
import { getFormattedImageUrl } from '../../utils/stringUtils';
import { Badge } from '../common/Badge';
import { Button } from '../common/Button';


interface PatientCarouselProps {
  patients: PatientCard[];
  isDoctor: boolean;
  onPatientClick?: (patientId: string) => void;
}

const getRiskLevelColor = (risk?: string): string => {
  switch (risk?.toLowerCase()) {
    case 'high':
      return 'bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800';
    case 'medium':
      return 'bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800';
    case 'low':
      return 'bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800';
    default:
      return 'bg-slate-50 border-slate-200 dark:bg-slate-950/20 dark:border-slate-800';
  }
};

const getRiskLevelBadge = (risk?: string) => {
  const riskLower = risk?.toLowerCase();
  switch (riskLower) {
    case 'high':
      return (
        <Badge variant="danger">
          <span>🔴</span> High Risk
        </Badge>
      );
    case 'medium':
      return (
        <Badge variant="warning">
          <span>🟡</span> Medium Risk
        </Badge>
      );
    case 'low':
      return (
        <Badge variant="success">
          <span>🟢</span> Low Risk
        </Badge>
      );
    default:
      return (
        <Badge variant="secondary">
          <span>⚪</span> Unknown
        </Badge>
      );
  }
};

export const PatientCarousel: React.FC<PatientCarouselProps> = ({ patients, isDoctor, onPatientClick }) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScroll = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(container.scrollLeft < container.scrollWidth - container.clientWidth - 10);
    }
  };

  useEffect(() => {
    checkScroll();
    const container = scrollContainerRef.current;
    if (container) {
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [patients]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 400;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  if (patients.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 px-6 bg-slate-50 dark:bg-slate-900/30 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
        <div className="text-center">
          <User className="mx-auto h-12 w-12 text-slate-400 mb-3" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">No patients assigned yet</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Carousel Controls */}
      <div className="relative group">
        {/* Scroll Buttons */}
        <div className="absolute inset-y-0 left-0 right-0 flex justify-between items-center pointer-events-none z-10">
          {canScrollLeft && (
            <button
              onClick={() => scroll('left')}
              className="pointer-events-auto ml-2 p-2 rounded-full standard-card hover:shadow-xl transition-all opacity-0 group-hover:opacity-100"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
          )}
          {canScrollRight && (
            <button
              onClick={() => scroll('right')}
              className="pointer-events-auto mr-2 ml-auto p-2 rounded-full standard-card hover:shadow-xl transition-all opacity-0 group-hover:opacity-100"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5 text-slate-900 dark:text-white" />
            </button>
          )}
        </div>

        {/* Carousel Container */}
        <div
          ref={scrollContainerRef}
          className="flex gap-4 overflow-x-auto scroll-smooth pb-2 px-1"
          style={{ scrollBehavior: 'smooth', scrollbarWidth: 'thin' }}
        >
          {patients.map((patient) => (
            <div
              key={patient.id}
              className={`flex-shrink-0 w-96 rounded-2xl border-2 p-5 space-y-4 cursor-pointer transition-all hover:shadow-xl hover:scale-[1.02] ${getRiskLevelColor(
                patient.lastScreening?.riskLevel
              )}`}
              onClick={() => onPatientClick?.(patient.id)}
            >
              {/* Header with Name and Risk Level */}
              <div className="space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{patient.name}</h3>
                    {(() => {
                      const ageStr = patient.age ? `Age ${patient.age}` : '';
                      const isUnknownGender = !patient.gender || patient.gender.toString().toLowerCase() === 'unknown' || patient.gender.toString().toLowerCase() === 'undefined' || patient.gender.toString().toLowerCase() === 'null';
                      const genderStr = !isUnknownGender ? patient.gender : '';
                      const info = [ageStr, genderStr].filter(Boolean).join(' • ');
                      return info ? (
                        <p className="text-sm text-slate-600 dark:text-slate-400">
                          {info}
                        </p>
                      ) : null;
                    })()}
                  </div>
                  {patient.profileImage && (
                    <img
                      src={getFormattedImageUrl(patient.profileImage)}
                      alt={patient.name}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  )}
                </div>
                {patient.lastScreening && getRiskLevelBadge(patient.lastScreening.riskLevel)}
              </div>

              {/* Divider */}
              <div className="h-px bg-slate-200 dark:bg-white/10" />

              {/* Latest Screening Result */}
              {patient.lastScreening && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Latest Screening</p>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(patient.lastScreening.date).toLocaleDateString()}
                    </span>
                    {patient.lastScreening.score !== undefined && (
                      <span className="text-sm font-bold text-slate-900 dark:text-white">Score: {patient.lastScreening.score}</span>
                    )}
                  </div>
                </div>
              )}

              {/* Treatment Plan Status */}
              {isDoctor && patient.treatmentPlan && (
                <div className="space-y-2">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Treatment Plan</p>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-slate-700 dark:text-slate-300">{patient.treatmentPlan.title}</span>
                      <Badge
                        variant={
                          patient.treatmentPlan.status === 'active'
                            ? 'success'
                            : patient.treatmentPlan.status === 'completed'
                            ? 'success'
                            : 'warning'
                        }
                      >
                        {patient.treatmentPlan.status}
                      </Badge>
                    </div>
                    {patient.treatmentPlan.progressPercentage !== undefined && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-600 dark:text-slate-400">Progress</span>
                          <span className="font-bold text-slate-900 dark:text-white">{patient.treatmentPlan.progressPercentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                            style={{ width: `${patient.treatmentPlan.progressPercentage}%` }}
                          />
                        </div>
                      </div>
                    )}
                    {patient.treatmentPlan.goalsCompleted !== undefined && patient.treatmentPlan.totalGoals !== undefined && (
                      <div className="flex items-center gap-1 text-xs text-slate-600 dark:text-slate-400">
                        <CheckCircleIcon /> {patient.treatmentPlan.goalsCompleted}/{patient.treatmentPlan.totalGoals} goals
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Upcoming Session */}
              {patient.upcomingSession && (
                <div className="space-y-1">
                  <p className="text-xs font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider">Upcoming Session</p>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    <span className="text-sm text-slate-700 dark:text-slate-300">
                      {new Date(patient.upcomingSession.date).toLocaleDateString()} at {patient.upcomingSession.time}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        patient.upcomingSession.status === 'confirmed'
                          ? 'success'
                          : patient.upcomingSession.status === 'pending'
                          ? 'warning'
                          : 'secondary'
                      }
                    >
                      {patient.upcomingSession.status}
                    </Badge>
                  </div>
                </div>
              )}

              {/* Last Activity */}
              {patient.lastActivityDate && (
                <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  <span>Last activity: {new Date(patient.lastActivityDate).toLocaleDateString()}</span>
                </div>
              )}

              {/* Quick Actions */}
              <div className="flex gap-2 pt-2 border-t border-slate-200/50 dark:border-white/5">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1 text-xs cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate(`/patients/${patient.id}`);
                  }}
                >
                  <User className="w-3 h-3 mr-1" /> Profile
                </Button>
                {isDoctor ? (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/treatment-plan/${patient.id}`);
                      }}
                    >
                      <TrendingUp className="w-3 h-3 mr-1" /> Plan
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate('/chat');
                      }}
                    >
                      💬 Chat
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/${isDoctor ? 'doctor' : 'therapist'}/sessions`);
                      }}
                    >
                      <Calendar className="w-3 h-3 mr-1" /> Sessions
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="flex-1 text-xs cursor-pointer"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/patients/${patient.id}`);
                      }}
                    >
                      <FileText className="w-3 h-3 mr-1" /> Notes
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll Indicator */}
      {canScrollRight && (
        <div className="text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">Scroll to see more patients →</p>
        </div>
      )}
    </div>
  );
};

function CheckCircleIcon() {
  return <TrendingUp className="w-3 h-3 inline mr-1" />;
}
