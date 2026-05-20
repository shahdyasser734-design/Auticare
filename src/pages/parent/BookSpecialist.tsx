import { useState, useEffect } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import clsx from 'clsx';
import { specialistsService, type Specialist } from '../../services/api/specialists';
import { LoadingSpinner } from '../../components/common/Loading';

const SpecialistCard = ({ data, type }: { data: Specialist; type: string }) => (
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

      <div className="grid grid-cols-2 gap-4 bg-soft-bg p-4 rounded-2xl mt-auto">
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
      <Button className="w-full bg-orange-500 hover:bg-orange-600 shadow-md shadow-orange-500/20 text-white font-bold py-3 rounded-xl transition-all">
        Book Appointment
      </Button>
    </div>
  </Card>
);

export const BookSpecialist = () => {
  const [activeTab, setActiveTab] = useState<'doctors' | 'therapists'>('doctors');
  const [specialists, setSpecialists] = useState<Specialist[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <MainLayout>
      <div className="max-w-7xl mx-auto space-y-10">
        <div className="text-center max-w-2xl mx-auto">
          <h1 className="text-4xl font-bold text-navy-900 mb-4">Our Specialists</h1>
          <p className="text-navy-500 text-lg">
            Connect with our certified pediatric neurologists and specialized therapists to guide your child's journey.
          </p>
        </div>

        {/* Custom Segmented Control */}
        <div className="flex flex-col sm:flex-row flex-wrap justify-center gap-3">
          <div className="bg-white p-1.5 rounded-2xl shadow-sm border border-soft-gray inline-flex relative">
            <div 
              className="absolute top-1.5 bottom-1.5 w-[calc(50%-6px)] bg-navy-900 rounded-xl transition-all duration-300 ease-out"
              style={{ left: activeTab === 'doctors' ? '6px' : 'calc(50% + 3px)' }}
            />
            <button
              className={clsx(
                "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[120px] sm:min-w-[160px] w-full sm:w-auto",
                activeTab === 'doctors' ? "text-white" : "text-navy-600 hover:text-navy-900"
              )}
              onClick={() => setActiveTab('doctors')}
            >
              Doctors
            </button>
            <button
              className={clsx(
                "relative z-10 px-6 py-3 rounded-xl font-bold text-sm transition-colors duration-300 min-w-[120px] sm:min-w-[160px] w-full sm:w-auto",
                activeTab === 'therapists' ? "text-white" : "text-navy-600 hover:text-navy-900"
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
          <div className="text-center py-12 text-navy-500">
            <p>No specialists found.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {specialists.map(specialist => (
              <SpecialistCard 
                key={specialist.id} 
                data={specialist} 
                type={activeTab === 'doctors' ? 'doctor' : 'therapist'} 
              />
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
