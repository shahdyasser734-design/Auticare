import { Star, Calendar } from 'lucide-react';
import { Button } from './Button';

interface SpecialistCardProps {
  name: string;
  specialty: string;
  rating: number;
  reviewCount: number;
  experience: number;
  bio: string;
  avatar?: string;
  color?: string;
  onBook?: () => void;
}

export const SpecialistCard = ({
  name,
  specialty,
  rating,
  reviewCount,
  experience,
  bio,
  avatar,
  color = 'from-blue-500 to-blue-600',
  onBook,
}: SpecialistCardProps) => {
  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  return (
    <div className="group rounded-3xl border border-slate-100 dark:border-white/5 bg-white/80 dark:bg-gradient-to-br dark:from-white/5 dark:to-white/[0.02] backdrop-blur-xl p-8 shadow-sm dark:shadow-none hover:shadow-2xl dark:hover:border-white/10 transition-all duration-500 hover:-translate-y-1.5 overflow-hidden relative">
      {/* Animated gradient background on hover */}
      <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-[0.03] dark:group-hover:opacity-10 transition-opacity duration-500 from-blue-400 to-purple-500" />

      <div className="relative z-10">
        {/* Avatar */}
        <div className="flex items-center gap-5 mb-5">
          <div
            className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-xl shadow-lg group-hover:shadow-xl transition-shadow duration-500 flex-shrink-0 rotate-3 group-hover:rotate-0`}
          >
            {avatar ? (
              <img src={avatar} alt={name} className="w-full h-full rounded-full object-cover" />
            ) : (
              initials
            )}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white">{name}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400">{specialty}</p>
          </div>
        </div>

        {/* Rating and Experience */}
        <div className="flex items-center gap-4 mb-5 pb-5 border-b border-slate-100 dark:border-white/5">
          <div className="flex items-center gap-1.5">
            <Star size={16} className="fill-amber-400 text-amber-400" />
            <span className="text-sm font-semibold text-slate-900 dark:text-white">
              {rating > 0 ? rating.toFixed(1) : <span className="text-xs font-normal text-slate-500">No rating yet</span>}
            </span>
            {reviewCount > 0 && <span className="text-xs text-slate-500">({reviewCount})</span>}
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">
            {experience > 0 ? (
              <><span className="font-semibold text-slate-800 dark:text-slate-300">{experience}</span> years exp.</>
            ) : (
              <span className="text-sm font-normal text-slate-500">New Specialist</span>
            )}
          </div>
        </div>

        {/* Bio */}
        <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 line-clamp-2 min-h-[2.5rem] leading-relaxed">{bio}</p>

        {/* Book Button */}
        <Button
          size="sm"
          className="w-full group/btn shadow-md hover:shadow-lg transition-all rounded-xl py-2.5"
          onClick={onBook}
        >
          <Calendar size={16} className="mr-2" />
          <span>Book Session</span>
        </Button>
      </div>
    </div>
  );
};
