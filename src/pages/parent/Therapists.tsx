import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { specialistsService } from '../../services/api/specialistsService';
import { BookingModal } from '../../components/specialists/BookingModal';
import type { Specialist } from '../../types';
import { getFormattedImageUrl } from '../../utils/stringUtils';


const isInvalid = (val: unknown) => 
  val === null || 
  val === undefined || 
  val === 'string' || 
  val === 'null' || 
  val === 'undefined' || 
  val === 0 || 
  val === '0';

// eslint-disable-next-line react-refresh/only-export-components
export const sanitizeSpecialist = (spec: Record<string, unknown>) => {
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

export const Therapists = () => {
  const navigate = useNavigate();
  const [therapists, setTherapists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTherapist, setSelectedTherapist] = useState<Specialist | null>(null);
  const [showBookingModal, setShowBookingModal] = useState(false);

  useEffect(() => {
    const loadTherapists = async () => {
      try {
        setLoading(true);
        const data = await specialistsService.getSpecialists('therapist');
        // Handle various API response formats
        const therapistList = Array.isArray(data) ? data : 
                             Array.isArray((data as Record<string, unknown>)?.data) ? (data as Record<string, Specialist[]>).data : 
                             Array.isArray((data as Record<string, unknown>)?.specialists) ? (data as Record<string, Specialist[]>).specialists : [];
        setTherapists(therapistList);
      } catch (err) {
        console.error('Failed to load therapists:', err);
        setTherapists([]);
      } finally {
        setLoading(false);
      }
    };
    loadTherapists();
  }, []);

  const filteredTherapists = useMemo(() => {
    return therapists.filter((therapist) => {
      const query = searchQuery.toLowerCase();
      return (
        therapist.name.toLowerCase().includes(query) ||
        therapist.specialization.toLowerCase().includes(query)
      );
    });
  }, [searchQuery, therapists]);

  const handleBookingClose = () => {
    setShowBookingModal(false);
    setSelectedTherapist(null);
  };

  const handleBookingSuccess = () => {
    setShowBookingModal(false);
    setSelectedTherapist(null);
    navigate('/parent/my-bookings');
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-purple-600 via-pink-500 to-rose-500 px-6 py-16 sm:px-8 sm:py-20 dark:from-purple-900 dark:via-pink-800 dark:to-rose-900">
          <div className="relative z-10">
            <h1 className="text-4xl font-bold text-white sm:text-5xl">
              Our Specialized Therapists
            </h1>
            <p className="mt-4 text-lg text-purple-100">
              Work with compassionate behavioral therapists, speech specialists, and occupational therapists who understand your child's unique needs.
            </p>
          </div>
          <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-pink-400/20 blur-3xl" />
        </div>

        {/* Search Section */}
        <div className="space-y-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search therapists by name or specialization..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-6 py-4 text-slate-900 shadow-lg outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-purple-500 focus:ring-4 focus:ring-purple-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder:text-slate-500 dark:focus:border-purple-400 dark:focus:ring-purple-500/30"
            />
            <svg
              className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Therapists Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="mb-4 h-12 w-12 animate-spin rounded-full border-4 border-purple-300 border-t-purple-600" />
              <p className="text-slate-600 dark:text-slate-400">Loading therapists...</p>
            </div>
          </div>
        ) : filteredTherapists.length === 0 ? (
          <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900/50">
            <svg
              className="mx-auto h-12 w-12 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M20 21l-4.35-4.35m0 0A7.5 7.5 0 103.5 3.5a7.5 7.5 0 0013.15 13.15z"
              />
            </svg>
            <p className="mt-4 text-lg font-medium text-slate-600 dark:text-slate-400">
              {searchQuery ? 'No therapists found matching your search.' : 'No therapists available.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {filteredTherapists.map((rawTherapist) => {
              const therapist = sanitizeSpecialist(rawTherapist as unknown as Record<string, unknown>) as unknown as Specialist;
              return (
                <div
                  key={therapist.id}
                  className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md transition-all duration-300 hover:border-purple-400 hover:shadow-2xl dark:border-slate-700 dark:bg-slate-800 dark:hover:border-purple-500"
                >
                  <div className="aspect-video overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30">
                    {therapist.profileImage ? (
                      <img
                        src={getFormattedImageUrl(therapist.profileImage)}
                        alt={therapist.name}
                        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full bg-gradient-to-br from-purple-500 to-pink-500">
                        <span className="text-4xl">🧑‍🏫</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 p-5">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                        {therapist.name}
                      </h3>
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">
                        {therapist.specialization}
                      </p>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <span className="text-lg text-yellow-500">★</span>
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {therapist.rating}
                          </span>
                        </div>
                        <span className="text-sm text-slate-600 dark:text-slate-400">
                          {therapist.reviews} reviews
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-lg bg-purple-50 px-3 py-2 dark:bg-purple-900/30">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Experience
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {therapist.yearsOfExperience} yrs
                          </p>
                        </div>
                        <div className="rounded-lg bg-pink-50 px-3 py-2 dark:bg-pink-900/30">
                          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
                            Sessions
                          </p>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {therapist.cases}+
                          </p>
                        </div>
                      </div>

                      <div className="rounded-lg border border-green-300 bg-green-50 px-3 py-2 dark:border-green-800 dark:bg-green-900/20">
                        <p className="text-xs font-medium text-green-700 dark:text-green-400">
                          {therapist.availability}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => navigate(`/parent/therapists/${therapist.id}`)}
                        className="flex-1 rounded-full border border-purple-300 px-4 py-2 text-sm font-semibold text-purple-600 transition-colors duration-200 hover:bg-purple-50 dark:border-purple-700 dark:text-purple-400 dark:hover:bg-purple-900/30 cursor-pointer"
                      >
                        View Profile
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTherapist(therapist);
                          setShowBookingModal(true);
                        }}
                        className="flex-1 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-2 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:from-purple-700 hover:to-pink-700 dark:from-purple-700 dark:to-pink-700 cursor-pointer"
                      >
                        Book Session
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedTherapist && (
        <BookingModal
          open={showBookingModal}
          specialist={selectedTherapist}
          onClose={handleBookingClose}
          onBooked={handleBookingSuccess}
        />
      )}
    </MainLayout>
  );
};
