import { useMemo, useState, useEffect } from 'react';
import SpecialistCardUI from '../../components/specialists/SpecialistCardUI';
import type { Specialist } from '../../components/specialists/SpecialistCardUI';
import BookingModalUI from '../../components/specialists/BookingModalUI';
import SkeletonCard from '../../components/specialists/SkeletonCard';
import { specialistsService } from '../../services/api/specialists';
import type { Specialist as ApiSpecialist } from '../../services/api/specialists';
import { bookingService, type BookingRequest } from '../../services/api/bookings';
import { useBookings } from '../../context/BookingsContext';

const mockSpecialists: Specialist[] = [
  // DOCTORS
  {
    id: 1,
    name: 'Dr. Aisha Khan',
    specialty: 'Child Psychiatrist',
    type: 'doctor',
    years: 14,
    rating: 4.8,
    cases: 1240,
    availability: 'online',
    image: '/assets/therapy-1-CClVf1Bu.jpg',
  },
  {
    id: 2,
    name: 'Dr. Michael Tan',
    specialty: 'Pediatric Neurologist',
    type: 'doctor',
    years: 11,
    rating: 4.7,
    cases: 860,
    availability: 'online',
    image: '/assets/therapy-3-B0Yhamef.jpg',
  },
  {
    id: 3,
    name: 'Dr. Fatima Noor',
    specialty: 'Developmental Pediatrician',
    type: 'doctor',
    years: 9,
    rating: 4.6,
    cases: 620,
    availability: 'online',
    image: '/assets/therapy-support-FISI4Xey.jpg',
  },
  {
    id: 4,
    name: 'Dr. Ahmed Hassan',
    specialty: 'Child Psychologist',
    type: 'doctor',
    years: 12,
    rating: 4.5,
    cases: 950,
    availability: 'online',
    image: '/assets/therapy-5-CQFwJ-qa.jpg',
  },
  // THERAPISTS
  {
    id: 5,
    name: 'Ms. Sara Gomez',
    specialty: 'Speech-Language Pathologist',
    type: 'therapist',
    years: 8,
    rating: 4.7,
    cases: 540,
    availability: 'online',
    image: '/assets/therapy-4-DvMeBM4z.jpg',
  },
  {
    id: 6,
    name: 'Mr. Daniel Lee',
    specialty: 'Occupational Therapist',
    type: 'therapist',
    years: 7,
    rating: 4.6,
    cases: 410,
    availability: 'online',
    image: '/assets/therapy-1-CClVf1Bu.jpg',
  },
  {
    id: 7,
    name: 'Ms. Hana Wong',
    specialty: 'Behavioral Therapist',
    type: 'therapist',
    years: 10,
    rating: 4.8,
    cases: 720,
    availability: 'online',
    image: '/assets/therapy-3-B0Yhamef.jpg',
  },
  {
    id: 8,
    name: 'Mr. Carlos Rodriguez',
    specialty: 'Sensory Integration Specialist',
    type: 'therapist',
    years: 6,
    rating: 4.5,
    cases: 380,
    availability: 'online',
    image: '/assets/therapy-support-FISI4Xey.jpg',
  },
];

const OurSpecialists = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'therapists'>('doctors');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Specialist | null>(null);

  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [bookingReason, setBookingReason] = useState('');

  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const mapApiToUi = (a: ApiSpecialist, index: number): Specialist => ({
    id: Number(a.id) || (index + 1),
    name: a.name,
    specialty: a.specialization || 'General',
    type: a.type || 'doctor', // Use the API's type field
    years: (a.yearsExperience || a.yearsOfExperience) || 0,
    rating: a.rating || 0,
    cases: a.reviewCount || 0,
    availability: 'online',
    image: a.profileImage || undefined,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('[SPECIALISTS] Loading specialists from API...');
      const resp = await specialistsService.getSpecialists();
      console.log('[SPECIALISTS] Raw API response:', resp);
      const data = Array.isArray(resp)
        ? resp
        : Array.isArray((resp as Record<string, unknown>)?.data)
        ? ((resp as Record<string, unknown>).data as ApiSpecialist[])
        : undefined;
      console.log('[SPECIALISTS] Extracted specialists data:', data);
      if (!data) {
        console.warn('[SPECIALISTS] API returned unexpected payload:', resp);
        throw new Error('Invalid specialists response');
      }
      const mapped = data.map((s: ApiSpecialist, i: number) => mapApiToUi(s, i));
      console.log('[SPECIALISTS] Mapped specialists:', mapped);
      console.log(`[SPECIALISTS] Loaded ${mapped.filter((s: Specialist) => s.type === 'doctor').length} doctors and ${mapped.filter((s: Specialist) => s.type === 'therapist').length} therapists`);
      setSpecialists(mapped);
    } catch (err) {
      console.error('[SPECIALISTS] Failed to load specialists:', err);
      setError('Failed to load specialists. Showing fallback data.');
      // Fallback to mock data
      console.log('[SPECIALISTS] Using mock specialists:', mockSpecialists);
      setSpecialists(mockSpecialists);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    // Filter by specialist type instead of specialty string matching
    if (activeTab === 'doctors') {
      return specialists.filter((s) => s.type === 'doctor');
    }
    return specialists.filter((s) => s.type === 'therapist');
  }, [activeTab, specialists]);

  const handleBook = (s: Specialist) => {
    setSelected(s);
    setOpen(true);
  };

  const bookings = useBookings();

  const confirmBookingUI = () => {
    // Create booking via API
    (async () => {
      if (!selected) return;
      const childId = bookings.currentChildId;
      
      setSubmitting(true);
      setApiError(null);
      try {
        // Format date and time for C# deserialization
        const formattedDate = bookingDate 
          ? new Date(bookingDate.includes('T') ? bookingDate : `${bookingDate}T00:00:00Z`).toISOString() 
          : new Date().toISOString();
        const formattedTime = bookingTime 
          ? (bookingTime.length === 5 ? `${bookingTime}:00` : bookingTime) 
          : '00:00:00';

        const payload: BookingRequest = {
          specialistId: typeof selected.id === 'number' ? selected.id : Number(selected.id),
          childId: childId ? Number(childId) : undefined,
          bookingDate: formattedDate,
          bookingTime: formattedTime,
          reason: bookingReason || undefined,
        };
        
        console.log(`[BOOKING] Creating booking for specialist: ${selected.name} (ID: ${selected.id}, Type: ${selected.type})`);
        console.log('[BOOKING] Request payload:', payload);
        const created = await bookingService.createBooking(payload);
        console.log('[BOOKING] Booking created successfully:', created);

        // Add to global bookings context so UI updates across pages
        try {
          bookings.addBooking(created);
        } catch (e) {
          console.error('[BOOKING] Failed to update bookings context:', e);
        }

        setOpen(false);
        setBookingDate('');
        setBookingTime('');
        setBookingReason('');
        const specName = selected.name || 'Specialist';
        const isTherapist = selected.type === 'therapist';
        const formattedName = isTherapist
          ? (specName.startsWith('Speech Therapist') || specName.startsWith('Therapist') ? specName : `Speech Therapist ${specName}`)
          : (specName.startsWith('Dr.') ? specName : `Dr. ${specName}`);
        setSelected(null);
        alert(`Booking request sent to ${formattedName}`);
      } catch (err) {
        console.error('[BOOKING] Booking error:', err);
        const errorObj = err as { response?: { status?: number }; message?: string };
        const status = errorObj?.response?.status;
        if (status === 400) {
          setApiError(errorObj.message || 'Validation error.');
        } else if (status === 403) {
          setApiError('You are not authorized to perform this action.');
        } else {
          setApiError(errorObj.message || 'Network error. Please try again.');
        }
      } finally {
        setSubmitting(false);
      }
    })();
  };

  return (
    <div className="p-6 md:p-10">
      <header className="mb-6">
        <h1 className="text-2xl md:text-3xl font-semibold text-slate-900">Our Specialists</h1>
        <p className="text-sm text-slate-500 mt-1">Book appointments with doctors and therapists</p>
      </header>

      <div className="mb-6 flex items-center gap-4">
        <div className="rounded-full bg-white p-1 shadow-sm">
          <nav className="flex gap-1 bg-slate-50 rounded-full p-1">
            <button
              onClick={() => setActiveTab('doctors')}
              className={`px-4 py-2 rounded-full text-sm transition ${activeTab === 'doctors' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Doctors
            </button>
            <button
              onClick={() => setActiveTab('therapists')}
              className={`px-4 py-2 rounded-full text-sm transition ${activeTab === 'therapists' ? 'bg-white shadow text-slate-900' : 'text-slate-600 hover:bg-white/60'}`}
            >
              Therapists
            </button>
          </nav>
        </div>
      </div>

      <section>
        {error && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-700 flex items-center justify-between">
            <div>{error}</div>
            <div className="flex items-center gap-2">
              <button onClick={load} className="px-3 py-1 rounded bg-rose-100 text-rose-700">Retry</button>
            </div>
          </div>
        )}

        {apiError && (
          <div className="mb-4 p-4 rounded-lg bg-rose-50 border border-rose-100 text-rose-700">
            <div className="font-semibold">Booking failed</div>
            <div className="text-sm">{apiError}</div>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center">
            <div className="text-2xl text-slate-400">No specialists available</div>
            <p className="text-sm text-slate-500 mt-2">Try changing the filters or check back later.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((s) => (
              <SpecialistCardUI key={s.id} specialist={s} onBook={handleBook} />
            ))}
          </div>
        )}
      </section>

      <BookingModalUI
        open={open}
        specialistName={selected?.name}
        date={bookingDate}
        time={bookingTime}
        reason={bookingReason}
        setDate={setBookingDate}
        setTime={setBookingTime}
        setReason={setBookingReason}
        onClose={() => setOpen(false)}
        onConfirm={confirmBookingUI}
        submitting={submitting}
      />
    </div>
  );
};

export default OurSpecialists;
