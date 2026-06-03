import { useMemo, useState, useEffect } from 'react';
import SpecialistCardUI from '../../components/specialists/SpecialistCardUI';
import type { Specialist } from '../../components/specialists/SpecialistCardUI';
import BookingModalUI from '../../components/specialists/BookingModalUI';
import SkeletonCard from '../../components/specialists/SkeletonCard';
import { specialistsService } from '../../services/api/specialists';
import type { Specialist as ApiSpecialist } from '../../services/api/specialists';
import { bookingService } from '../../services/api/bookings';
import { useBookings } from '../../context/BookingsContext';

const mockSpecialists: Specialist[] = [
  // DOCTORS
  {
    id: 1,
    name: 'Dr. Aisha Khan',
    specialty: 'Child Psychiatrist',
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
    years: a.yearsOfExperience || 0,
    rating: a.rating || 0,
    cases: a.reviewCount || 0,
    availability: 'online',
    image: a.profileImage || undefined,
  });

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const resp = await specialistsService.getSpecialists();
      console.log('Raw specialists API response:', resp);
      const data = Array.isArray(resp)
        ? resp
        : Array.isArray((resp as any)?.data)
        ? (resp as any).data
        : undefined;
      console.log('Extracted specialists data:', data);
      if (!data) {
        console.warn('Specialists API returned unexpected payload:', resp);
        throw new Error('Invalid specialists response');
      }
      const mapped = data.map((s: ApiSpecialist, i: number) => mapApiToUi(s, i));
      console.log('Mapped specialists:', mapped);
      setSpecialists(mapped);
    } catch (err) {
      console.error('Failed to load specialists', err);
      setError('Failed to load specialists. Showing fallback data.');
      // Fallback to mock data
      console.log('Using mock specialists:', mockSpecialists);
      setSpecialists(mockSpecialists);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (activeTab === 'doctors') return specialists.filter((s) => s.specialty.toLowerCase().includes('doctor') || s.specialty.toLowerCase().includes('psychiatrist') || s.specialty.toLowerCase().includes('neurologist'));
    return specialists.filter((s) => !s.specialty.toLowerCase().includes('psychiatrist') && !s.specialty.toLowerCase().includes('neurologist'));
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
      
      // Debug log the selected specialist
      console.log('Selected specialist object:', selected);
      console.log('Selected specialist keys:', Object.keys(selected));
      console.log('Selected specialist full dump:', JSON.stringify(selected));
      
      // Transform to fields that backend expects
      // Using PascalCase field names, keep as separate date/time
      const payload: any = {
        SpecialistId: typeof selected.id === 'number' ? selected.id : Number(selected.id),
        ChildId: childId || undefined,
        PreferredDate: bookingDate || undefined,
        PreferredTime: bookingTime || undefined,
        Reason: bookingReason || undefined,
      };

      setSubmitting(true);
      setApiError(null);
      try {
        console.log('Creating booking - request payload:', payload);
        const created = await bookingService.createBooking(payload as any);
        console.log('Booking API response:', created);

        // Add to global bookings context so UI updates across pages
        try {
          bookings.addBooking(created);
        } catch (e) {
          console.error('Failed to update bookings context:', e);
        }

        setOpen(false);
        setBookingDate('');
        setBookingTime('');
        setBookingReason('');
        setSelected(null);
        alert('Booking successful');
      } catch (err: any) {
        console.error('Booking error:', err);
        const status = err?.response?.status;
        if (status === 400) {
          setApiError(err.message || 'Validation error.');
        } else if (status === 403) {
          setApiError('You are not authorized to perform this action.');
        } else {
          setApiError(err.message || 'Network error. Please try again.');
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
        <div className="mt-4 inline-flex rounded-full bg-emerald-100 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-emerald-800 shadow-sm">
          OUR SPECIALISTS PAGE - LATEST VERSION LOADED
        </div>
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

        <div className="ml-auto flex items-center gap-3">
          <div className="text-xs text-slate-500">Smooth transitions</div>
          <div className="h-8 w-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400">✨</div>
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
