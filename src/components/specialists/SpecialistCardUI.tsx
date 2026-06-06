// UI-only component; relies on the project's JSX runtime (no React symbol needed)

export type Availability = 'online' | 'offline' | 'busy';
export type SpecialistType = 'doctor' | 'therapist';

export type Specialist = {
  id: number;
  name: string;
  specialty: string;
  type?: SpecialistType; // Optional type field for better filtering
  years: number;
  rating: number;
  cases: number;
  availability: Availability;
  image?: string;
};

export const SpecialistCardUI = ({
  specialist,
  onBook,
}: {
  specialist: Specialist;
  onBook: (s: Specialist) => void;
}) => {
  const availColor =
    specialist.availability === 'online'
      ? 'bg-emerald-100 text-emerald-800'
      : specialist.availability === 'busy'
      ? 'bg-amber-100 text-amber-800'
      : 'bg-slate-100 text-slate-600';

  // Prefer type field if available, otherwise fall back to string matching
  const isDoctor = specialist.type === 'doctor' || (!specialist.type && (
    specialist.specialty.toLowerCase().includes('doctor') || 
    specialist.specialty.toLowerCase().includes('psychiatrist') || 
    specialist.specialty.toLowerCase().includes('pediatrician') ||
    specialist.specialty.toLowerCase().includes('psychologist') ||
    specialist.specialty.toLowerCase().includes('neurologist')
  ));

  const bgGradient = isDoctor 
    ? 'bg-gradient-to-br from-sky-50 to-white'
    : 'bg-gradient-to-br from-emerald-50 to-white';
  const borderColor = isDoctor ? 'border-sky-100' : 'border-emerald-100';
  const ringClass = isDoctor ? 'ring-sky-300' : 'ring-emerald-300';

  return (
    <div className={`${bgGradient} rounded-2xl shadow-sm hover:shadow-xl transform hover:-translate-y-1 transition p-5 flex flex-col border ${borderColor}`}>
      <div className="flex items-center gap-4">
        <div className={`w-16 h-16 rounded-full overflow-hidden bg-slate-200 flex-shrink-0 ring-2 ring-offset-2 ring-offset-white ${ringClass}`}>
          {specialist.image ? (
            <img src={specialist.image} alt={specialist.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-lg font-bold text-slate-600 bg-slate-300">
              {specialist.name.split(' ').map((n) => n[0]).slice(0,2).join('')}
            </div>
          )}
        </div>

        <div className="flex-1">
          <div className="flex items-center justify-between gap-2">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold text-slate-900">{specialist.name}</div>
              <div className="text-xs font-medium text-slate-600">{specialist.specialty}</div>
              {specialist.years > 0 && (
                <div className="text-xs text-slate-500 mt-1">
                  <span className="inline-block px-2 py-1 bg-slate-100 rounded text-xs">
                    {specialist.years}+ yrs exp
                  </span>
                </div>
              )}
            </div>

            <div className={`px-2 py-1 text-xs rounded-full font-medium whitespace-nowrap ${availColor}`}>
              {specialist.availability}
            </div>
          </div>

          {(specialist.rating > 0 || specialist.cases > 0) && (
            <div className="mt-3 flex items-center gap-2 flex-wrap">
              {specialist.rating > 0 && (
                <div className="flex items-center gap-1">
                  <div className="flex items-center text-amber-500 gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <svg key={i} className={`w-3.5 h-3.5 ${i < Math.round(specialist.rating) ? 'fill-current' : 'opacity-25'}`} viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.49 6.91l6.561-.954L10 0l2.949 5.956 6.561.954-4.755 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="text-xs font-semibold text-slate-700">{specialist.rating.toFixed(1)}</span>
                </div>
              )}
              
              {specialist.cases > 0 && (
                <div className="text-xs text-slate-600 font-medium">
                  <span className="inline-block px-2 py-0.5 bg-slate-100 rounded">
                    {specialist.cases}+ cases
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-4 pt-3 border-t border-slate-100">
        <button
          onClick={() => onBook(specialist)}
          className={`w-full inline-flex items-center justify-center gap-2 rounded-lg text-white font-medium py-2.5 px-3 transition hover:scale-105 ${
            isDoctor
              ? 'bg-sky-600 hover:bg-sky-700'
              : 'bg-emerald-600 hover:bg-emerald-700'
          }`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h18M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          Book Appointment
        </button>
      </div>
    </div>
  );
};

export default SpecialistCardUI;
