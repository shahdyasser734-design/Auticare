import { useState, useEffect } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';
import { specialistsService, type Specialist } from '../../services/api/specialists';
import { BookingModal } from '../../components/specialists/BookingModal';
import { LoadingSpinner } from '../../components/common/Loading';
import { useBookings } from '../../context/BookingsContext';

const SpecialistCard = ({ data, type, onBook }: { data: Specialist; type: string; onBook: (s: Specialist) => void }) => (
  <Card className="bg-white border-none shadow-lg hover:shadow-2xl transition-all duration-300 rounded-3xl overflow-hidden group flex flex-col h-full">
    <div className="p-6 md:p-8 space-y-6 flex-grow">
      <div className="flex items-center gap-6">
        <div className="w-20 h-20 bg-soft-gray rounded-full flex items-center justify-center text-3xl shrink-0 text-navy-500 overflow-hidden">
          {data.profileImage ? (
            <img src={data.profileImage} alt={data.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-navy-100 flex items-center justify-center">
              {type === 'doctor' ? '👨‍⚕️' : '🧑‍🏫'}
            </div>
          )}
        </div>
        <div>
          <h3 className="text-xl font-bold text-navy-900 group-hover:text-orange-500 transition-colors">{data.name}</h3>
          <p className="text-sm font-semibold text-navy-500">{data.specialization}</p>
          <div className="flex items-center gap-1 mt-1">
            <span className="text-yellow-400">★</span>
            <span className="text-sm font-bold text-navy-800">{data.rating}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 bg-soft-bg dark:bg-navy-900 p-4 rounded-2xl mt-auto">
        <div>
          <p className="text-xs text-navy-400 mb-1">Experience</p>
          <p className="font-bold text-navy-900">{data.yearsOfExperience} Years</p>
        </div>
        <div>
          <p className="text-xs text-navy-400 mb-1">Reviews</p>
          <p className="font-bold text-navy-900">{data.reviewCount}</p>
        </div>
      </div>
    </div>
    
    <div className="px-6 pb-6 md:px-8 md:pb-8">
      <Button onClick={() => onBook(data)} className="w-full bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 text-white font-bold py-3 rounded-xl transition-all">
        Book Appointment
      </Button>
    </div>
  </Card>
);

export const BookSpecialist = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'therapists'>('doctors');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [selectedSpecialist, setSelectedSpecialist] = useState<Specialist | null>(null);
  const { myBookings, upcomingBookings, refreshBookings, addBooking } = useBookings();

  useEffect(() => {
    const fetchSpecialists = async () => {
      setLoading(true);
      try {
        const data = await specialistsService.getSpecialists(activeTab === 'doctors' ? 'doctor' : 'therapist');
        setSpecialists(data);
      } catch (err) {
        console.error('Failed to fetch specialists:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSpecialists();
  }, [activeTab]);

  useEffect(() => {
    // Ensure bookings are fresh when this page mounts
    void refreshBookings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-4">Our Specialists</h1>
          <p className="text-slate-600 dark:text-slate-400 text-lg">
            Connect with our certified pediatric neurologists and specialized therapists to guide your child's journey.
          </p>
        </div>

        {/* Custom Segmented Control */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <div className="bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-slate-200 dark:border-white/10 inline-flex relative">
            <div 
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-slate-900 dark:bg-blue-600 rounded-xl transition-all duration-300 ease-out"
              style={{ left: activeTab === 'doctors' ? '6px' : 'calc(50% + 3px)' }}
            />
            <button
              className={clsx(
                "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[120px] sm:min-w-[160px] w-full sm:w-auto",
                activeTab === 'doctors' ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              onClick={() => setActiveTab('doctors')}
            >
              Doctors
            </button>
            <button
              className={clsx(
                "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[120px] sm:min-w-[160px] w-full sm:w-auto",
                activeTab === 'therapists' ? "text-white" : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white"
              )}
              onClick={() => setActiveTab('therapists')}
            >
              Therapists
            </button>
          </div>
        </div>

        {/* Specialists Grid */}
        {loading ? (
          <div className="flex justify-center py-12">
            <LoadingSpinner />
          </div>
        ) : specialists.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 shadow-sm">
            <div className="w-20 h-20 bg-blue-50 dark:bg-blue-500/10 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
              {activeTab === 'doctors' ? '👨‍⚕️' : '🧑‍🏫'}
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">No {activeTab === 'doctors' ? 'Doctors' : 'Therapists'} Found</h3>
            <p className="text-slate-500 dark:text-slate-400">We couldn't find any {activeTab} at the moment. Please check back later.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialists.map(specialist => (
              <SpecialistCard 
                key={specialist.id} 
                data={specialist} 
                type={activeTab === 'doctors' ? 'doctor' : 'therapist'} 
                onBook={(s) => { setSelectedSpecialist(s); setBookingOpen(true); }}
              />
            ))}
          </div>
        )}

        {/* My Bookings & Upcoming Sessions */}
        <div className="grid md:grid-cols-2 gap-6 mt-10">
          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">My Bookings</h3>
            {myBookings.length === 0 ? (
              <p className="text-sm text-slate-500">You have no bookings yet.</p>
            ) : (
              <div className="space-y-3">
                {myBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">{b.specialistName || 'Specialist'}</div>
                      <div className="text-sm text-slate-500">{new Date(b.dateTime).toLocaleString()}</div>
                      <div className="text-sm text-slate-500">Status: {b.status}</div>
                    </div>
                    <div className="text-sm text-right">
                      <div>{b.reason}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="text-xl font-bold mb-4">Upcoming Sessions</h3>
            {upcomingBookings.length === 0 ? (
              <p className="text-sm text-slate-500">No approved sessions yet.</p>
            ) : (
              <div className="space-y-3">
                {upcomingBookings.map(b => (
                  <div key={b.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <div className="font-semibold">{b.specialistName || 'Specialist'}</div>
                      <div className="text-sm text-slate-500">{new Date(b.dateTime).toLocaleString()}</div>
                    </div>
                    <div>
                      <Button disabled>Join Session</Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Booking Modal */}
        {selectedSpecialist && (
          <BookingModal
            open={bookingOpen}
            specialist={selectedSpecialist}
            onClose={() => { setBookingOpen(false); setSelectedSpecialist(null); }}
            onBooked={(newBooking) => {
              try { addBooking(newBooking); } catch (e) { console.error(e); }
              setBookingOpen(false);
            }}
          />
        )}
      </div>
    </MainLayout>
  );
};
