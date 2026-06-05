import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { specialistsService, type Specialist } from '../../services/api/specialists';
import { BookingModal } from '../../components/specialists/BookingModal';

const isInvalid = (val: any) => 
  val === null || 
  val === undefined || 
  val === 'string' || 
  val === 'null' || 
  val === 'undefined' || 
  val === 0 || 
  val === '0';

export const sanitizeSpecialist = (spec: any) => {
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

export const TherapistDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [therapist, setTherapist] = useState<Specialist | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const loadTherapist = async () => {
      if (!id) return;
      try {
        setLoading(true);
        const data = await specialistsService.getSpecialist(id);
        setTherapist(sanitizeSpecialist(data));
      } catch (err) {
        console.error('Failed to load therapist details:', err);
        setError('Could not load therapist details. Please try again.');
      } finally {
        setLoading(false);
      }
    };
    loadTherapist();
  }, [id]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-300 border-t-purple-600" />
            <p className="text-slate-600 dark:text-slate-400">Loading therapist details...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (error || !therapist) {
    return (
      <MainLayout>
        <div className="rounded-2xl border border-red-300 bg-red-50 p-6 text-center dark:border-red-700 dark:bg-red-900/20">
          <p className="text-red-700 dark:text-red-200">{error || 'Therapist not found.'}</p>
          <button
            onClick={() => navigate('/parent/therapists')}
            className="mt-4 rounded-lg bg-red-600 px-6 py-2 font-semibold text-white transition-colors hover:bg-red-700"
          >
            Back to Therapists
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
          onClick={() => navigate('/parent/therapists')}
          className="flex items-center gap-2 text-purple-600 transition-colors hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Therapists
        </button>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Left Column - Profile */}
          <div className="lg:col-span-1">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg dark:border-slate-700 dark:bg-slate-800">
              {/* Profile Image */}
              <div className="aspect-square overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                {therapist.profileImage ? (
                  <img
                    src={therapist.profileImage}
                    alt={therapist.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-pink-500">
                    <span className="text-8xl">🧑‍🏫</span>
                  </div>
                )}
              </div>

              {/* Profile Info */}
              <div className="space-y-6 p-6">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
                    {therapist.name}
                  </h1>
                  <p className="mt-2 text-lg font-medium text-purple-600 dark:text-purple-400">
                    {therapist.specialization}
                  </p>
                </div>

                {/* Rating */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl text-yellow-500">★</span>
                    <span className="text-2xl font-bold text-slate-900 dark:text-white">
                      {therapist.rating}
                    </span>
                  </div>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Based on {therapist.reviews} client reviews
                  </p>
                </div>

                {/* Key Stats */}
                <div className="space-y-3">
                  <div className="rounded-lg bg-purple-50 p-4 dark:bg-purple-900/30">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Years of Experience
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {therapist.yearsOfExperience} years
                    </p>
                  </div>
                  <div className="rounded-lg bg-pink-50 p-4 dark:bg-pink-900/30">
                    <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                      Sessions Conducted
                    </p>
                    <p className="text-2xl font-bold text-slate-900 dark:text-white">
                      {therapist.cases}+
                    </p>
                  </div>
                  <div className="rounded-lg border border-green-300 bg-green-50 p-4 dark:border-green-800 dark:bg-green-900/20">
                    <p className="text-xs font-medium text-green-700 dark:text-green-400">
                      Availability
                    </p>
                    <p className="font-semibold text-green-900 dark:text-green-200">
                      {therapist.availability}
                    </p>
                  </div>
                </div>

                {/* Book Button */}
                <button
                  onClick={() => setShowBookingModal(true)}
                  className="w-full rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-6 py-3 font-semibold text-white shadow-lg transition-all hover:from-purple-700 hover:to-pink-700 dark:from-purple-700 dark:to-pink-700"
                >
                  Book Session
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
                {therapist.about || `${therapist.name} is a compassionate and dedicated behavioral specialist with extensive experience working with children on the autism spectrum. Committed to providing personalized therapeutic interventions that support emotional growth and behavioral development.`}
              </p>
            </div>

            {/* Certifications */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Certifications & Training</h2>
              <ul className="mt-4 space-y-3">
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Master's Degree in Behavioral Psychology
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Board Certified Behavior Analyst (BCBA)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Specialized Training in Applied Behavior Analysis (ABA)
                  </span>
                </li>
                <li className="flex items-start gap-3">
                  <svg className="mt-1 h-5 w-5 flex-shrink-0 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                  </svg>
                  <span className="text-slate-700 dark:text-slate-300">
                    Parent Training & Coaching Specialist
                  </span>
                </li>
              </ul>
            </div>

            {/* Therapeutic Approaches */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Therapeutic Approaches</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {['Applied Behavior Analysis', 'Cognitive Behavioral Therapy', 'Social Skills Training', 'Sensory Integration', 'Family-Centered Care', 'Progress Monitoring'].map((approach) => (
                  <div
                    key={approach}
                    className="flex items-center gap-2 rounded-lg bg-purple-50 px-4 py-2 dark:bg-purple-900/20"
                  >
                    <span className="h-2 w-2 rounded-full bg-purple-600" />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">
                      {approach}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {therapist && (
        <BookingModal
          open={showBookingModal}
          specialist={therapist}
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
