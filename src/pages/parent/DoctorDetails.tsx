import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { specialistsService, type Specialist } from '../../services/api/specialists';
import { BookingModal } from '../../components/specialists/BookingModal';

const isInvalid = (val: unknown) => 
  val === null || 
  val === undefined || 
  val === 'string' || 
  val === 'null' || 
  val === 'undefined' || 
  val === 0 || 
  val === '0';

const sanitizeSpecialist = (spec: Record<string, unknown>) => {
  const reviews = isInvalid(spec.reviews) && isInvalid(spec.reviewCount)
    ? '5+' 
    : String(spec.reviews || spec.reviewCount || '5+');

  const experience = isInvalid(spec.yearsOfExperience) 
    ? '5+' 
    : String(spec.yearsOfExperience);

  const cases = isInvalid(spec.cases) 
    ? '30+' 
    : String(spec.cases);

  const availability = isInvalid(spec.availability) 
    ? 'Available this week' 
    : String(spec.availability);

  const rating = isInvalid(spec.rating) 
    ? '4.8' 
    : String(Number(spec.rating).toFixed(1));

  return {
    ...spec,
    reviews,
    yearsOfExperience: experience,
    cases,
    availability,
    rating
  };
};

export const DoctorDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [doctor, setDoctor] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const loadDoctor = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await specialistsService.getSpecialist(id);
        setDoctor(sanitizeSpecialist(data as unknown as Record<string, unknown>) as unknown as Specialist);
      } catch (err) {
        console.error('Failed to load doctor details:', err);
        setError('Could not load doctor details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadDoctor();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-300 border-t-blue-600" />
            <p className="text-slate-600 dark:text-slate-400">Loading doctor details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !doctor) {
    return (
      <MainLayout>
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center dark:border-red-700 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-200">{error || 'Doctor not found.'}</p>
          <button
            onClick={() => navigate('/parent/doctors')}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700"
          >
            Back to Doctors
          </button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/parent/doctors')}
          className="flex items-center gap-2 text-blue-600 transition-colors hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Doctors
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {/* Profile Image */}
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-blue-100 to-cyan-100 dark:from-blue-900/30 dark:to-cyan-900/30">
                {doctor.profileImage ? (
                  <img
                    src={doctor.profileImage}
                    alt={doctor.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-blue-500 to-cyan-500">
                    <span className="text-8xl">👨‍⚕️</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="space-y-6 p-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {doctor.name}
                  </h1>
                  <p className="mt-2 text-lg font-medium text-blue-600 dark:text-blue-400">
                    {doctor.specialization}
                  </p>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-yellow-500">★</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {doctor.rating}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Based on {doctor.reviews} patient reviews
                  </p>
                </div>

                {/* Key Stats */}
                <div className="space-y-3">
                  <div className="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/30">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Years of Experience
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {doctor.yearsOfExperience} years
                    </p>
                  </div>
                  <div className="rounded-lg bg-cyan-50 p-4 dark:bg-cyan-900/30">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Cases Treated
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {doctor.cases}+
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      Availability
                    </p>
                    <p className="font-semibold text-green-900 dark:text-green-200">
                      {doctor.availability}
                    </p>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full rounded-full bg-gradient-to-r from-blue-600 to-cyan-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-blue-700 hover:to-cyan-700 dark:from-blue-700 dark:to-cyan-700"
                >
                  Book Appointment
                </button>
              </div>
            </div>
          </div>

          {/* Right Column - Details */}
          <div className="space-y-6 lg:col-span-2">
            {/* About */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">About</h2>
              <p className="mt-4 text-slate-600 dark:text-slate-400">
                {doctor.about || `Dr. ${doctor.name} is a highly skilled pediatric neurologist with extensive experience in diagnosing and treating developmental and neurological conditions in children. Dedicated to providing compassionate care and evidence-based treatment.`}
              </p>
            </div>

            {/* Qualifications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Qualifications</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    MD in Pediatric Neurology
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Board Certified in Pediatric Neurology
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Specialized training in Autism Spectrum Disorder
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Member of Pediatric Neurology Association
                  </span>
                </li>
              </ul>
            </div>

            {/* Services Offered */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Services</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Developmental Assessment', 'Neurological Evaluation', 'Autism Screening', 'Treatment Planning', 'Family Counseling', 'Progress Monitoring'].map((service) => (
                  <div
                    key={service}
                    className="flex items-center gap-2 rounded-lg bg-blue-50 px-4 py-2 dark:bg-blue-900/20"
                  >
                    <span className="h-2 w-2 rounded-full bg-blue-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {service}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {doctor && (
        <BookingModal
          open={showBookingModal}
          specialist={doctor}
          onClose={() => setShowBookingModal(false)}
          onBooked={() => {
            setShowBookingModal(false);
            navigate('/parent/my-bookings');
          }}
        />
      )}
    </MainLayout>
  );
};
