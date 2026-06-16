import { useState, useEffect, useMemo } from 'react';

import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';

import { specialistsService, type Specialist } from '../../services/api/specialists';
import { LoadingSpinner } from '../../components/common/Loading';
import { BookingModal } from '../../components/specialists/BookingModal';

import { getFormattedImageUrl } from '../../utils/stringUtils';


interface SpecialistDisplay extends Specialist {
  treatedCases: number;
  availability: string;
  rating: number;
  reviewCount: number;
  yearsOfExperience: number;
}

const normalizeSpecialist = (specialist: Specialist): SpecialistDisplay => {
  const experience = (specialist.yearsExperience || specialist.yearsOfExperience) || 0;
  const rating = specialist.rating || 0;
  const reviews = specialist.reviewCount || 0;
  const cases = 0; // The API does not return active cases
  const availability = 'Contact for availability'; // Placeholder since API does not return this

  return {
    ...specialist,
    yearsOfExperience: experience,
    rating,
    reviewCount: reviews,
    treatedCases: cases,
    availability,
  };
};

const SpecialistCard = ({ data, type, onBook }: { data: SpecialistDisplay; type: string; onBook: (specialist: SpecialistDisplay) => void }) => (
  <Card className="standard-card border-none hover:shadow-2xl transition-all duration-300 overflow-hidden group flex flex-col h-full">
    <div className="p-6 md:p-8 space-y-6 flex-grow">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-soft-gray dark:bg-slate-700 rounded-full flex items-center justify-center text-3xl shrink-0 text-navy-500 dark:text-slate-350 overflow-hidden">
          {data.profileImage ? (
            <img src={getFormattedImageUrl(data.profileImage)} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-navy-100 dark:bg-slate-900 flex items-center justify-center">
              {type === 'doctor' ? '👨‍⚕️' : '🧑‍🏫'}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy-900 dark:text-white group-hover:text-orange-500 transition-colors">{data.name}</h3>
          <p className="text-sm font-semibold text-navy-500 dark:text-slate-400">{data.specialization}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-bold text-navy-800 dark:text-slate-200">
              {data.rating > 0 ? data.rating : <span className="text-xs font-normal text-slate-500">No rating yet</span>}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-soft-bg dark:bg-slate-900/50 p-4 rounded-2xl mt-auto">
        <div>
          <p className="text-xs text-navy-400 dark:text-slate-500 mb-1">Experience</p>
          <p className="font-bold text-navy-900 dark:text-white">
            {data.yearsOfExperience > 0 ? `${data.yearsOfExperience} yrs` : <span className="text-sm font-normal text-slate-500">New Specialist</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-slate-500 mb-1">Reviews</p>
          <p className="font-bold text-navy-900 dark:text-white">
            {data.reviewCount > 0 ? data.reviewCount : <span className="text-sm font-normal text-slate-500">No reviews yet</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-slate-500 mb-1">Active Cases</p>
          <p className="font-bold text-navy-900 dark:text-white">
            {data.treatedCases > 0 ? `${data.treatedCases}+` : <span className="text-sm font-normal text-slate-500">-</span>}
          </p>
        </div>
        <div>
          <p className="text-xs text-navy-400 dark:text-slate-500 mb-1">Status</p>
          <p className="font-bold text-navy-900 dark:text-white">{data.availability}</p>
        </div>
      </div>
    </div>

    <div className="px-6 pb-6 md:px-8 md:pb-8">
      <Button
        className="w-full bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 text-white font-bold py-3 rounded-xl transition-all"
        onClick={() => onBook(data)}
      >
        Book Appointment
      </Button>
    </div>
  </Card>
);

export const BookSpecialist = () => {

  const [specialists, setSpecialists] = useState<SpecialistDisplay[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSpecialist, setSelectedSpecialist] = useState<SpecialistDisplay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'doctors' | 'therapists'>('doctors');

  const filteredSpecialists = useMemo(() => {
    return specialists.filter(s =>
      s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.specialization.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [specialists, searchTerm]);

  const doctors = filteredSpecialists.filter(s => s.type === 'doctor');
  const therapists = filteredSpecialists.filter(s => s.type === 'therapist');

  useEffect(() => {
    const fetchSpecialists = async () => {
      setLoading(true);
      try {
        const data = await specialistsService.getSpecialists();
        const normalized = data.map(normalizeSpecialist);
        setSpecialists(normalized);
      } catch (err) {
        console.error('Failed to fetch specialists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialists();
  }, []);

  return (
    <MainLayout>
      <div className="w-full">
        {/* Hero Section */}
        <div className="relative -mx-6 md:-mx-12 mb-10 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-600 dark:from-orange-900 dark:via-orange-800 dark:to-slate-900 rounded-b-3xl overflow-hidden">
          <div className="absolute inset-0 opacity-15">
            <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-white" />
            <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-white" />
          </div>
          <div className="relative z-10 px-6 md:px-12 py-16 md:py-20 text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Book Specialist</h1>
            <p className="text-lg md:text-xl text-white/90">
              Find and book appointments with our highly-qualified pediatric neurologists and specialized therapists.
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto space-y-8">

          {/* Search + Tab Controls */}
          <div className="space-y-6">
            <div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search by name or specialization..."
                className="w-full px-6 py-4 rounded-2xl border border-slate-300 bg-white shadow-sm placeholder-slate-400 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:placeholder-slate-500 dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
              />
            </div>

            {/* Custom Tab Control */}
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <div className="standard-card p-1.5 inline-flex relative">
                <div
                  className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 dark:bg-orange-500 rounded-xl transition-all duration-300 ease-out"
                  style={{ left: activeTab === 'doctors' ? '6px' : 'calc(50% + 3px)' }}
                />
                <button
                  className={clsx(
                    "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[140px]",
                    activeTab === 'doctors' ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                  onClick={() => { setActiveTab('doctors'); setSearchTerm(''); }}
                >
                  👨‍⚕️ Doctors
                </button>
                <button
                  className={clsx(
                    "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[140px]",
                    activeTab === 'therapists' ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
                  )}
                  onClick={() => { setActiveTab('therapists'); setSearchTerm(''); }}
                >
                  🧑‍🏫 Therapists
                </button>
              </div>
            </div>
          </div>

          {successMessage && (
            <div className="rounded-3xl border border-green-200 bg-green-50 p-4 text-sm text-green-800 dark:border-green-700 dark:bg-green-900/20 dark:text-green-200">
              ✓ {successMessage}
            </div>
          )}

          {/* Specialists List */}
          <div>
            {loading ? (
              <div className="flex justify-center py-16">
                <LoadingSpinner />
              </div>
            ) : activeTab === 'doctors' ? (
              /* Doctors Section */
              doctors.length === 0 ? (
                <div className="text-center py-16 standard-card">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    👨‍⚕️
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Doctors Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchTerm
                      ? `No results match "${searchTerm}". Try a different search term.`
                      : `We couldn't find any doctors at the moment. Please check back later.`}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {doctors.map(specialist => (
                    <SpecialistCard
                      key={specialist.id}
                      data={specialist}
                      type="doctor"
                      onBook={(item) => {
                        setSelectedSpecialist(item);
                        setIsModalOpen(true);
                        setSuccessMessage('');
                      }}
                    />
                  ))}
                </div>
              )
            ) : (
              /* Therapists Section */
              therapists.length === 0 ? (
                <div className="text-center py-16 standard-card">
                  <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                    🧑‍🏫
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No Therapists Found</h3>
                  <p className="text-slate-500 dark:text-slate-400">
                    {searchTerm
                      ? `No results match "${searchTerm}". Try a different search term.`
                      : `We couldn't find any therapists at the moment. Please check back later.`}
                  </p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                  {therapists.map(specialist => (
                    <SpecialistCard
                      key={specialist.id}
                      data={specialist}
                      type="therapist"
                      onBook={(item) => {
                        setSelectedSpecialist(item);
                        setIsModalOpen(true);
                        setSuccessMessage('');
                      }}
                    />
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </div>

      {selectedSpecialist ? (
        <BookingModal
          open={isModalOpen}
          specialist={selectedSpecialist}
          onClose={() => setIsModalOpen(false)}
          onBooked={() => {
            setIsModalOpen(false);
            const isTherapist = selectedSpecialist.type === 'therapist';
            const specName = selectedSpecialist.name || 'Specialist';
            const formattedName = isTherapist
              ? (specName.startsWith('Speech Therapist') || specName.startsWith('Therapist') ? specName : `Speech Therapist ${specName}`)
              : (specName.startsWith('Dr.') ? specName : `Dr. ${specName}`);
            setSuccessMessage(`Booking request sent to ${formattedName}`);
            setSearchTerm('');
          }}
        />
      ) : null}
    </MainLayout>
  );
};
