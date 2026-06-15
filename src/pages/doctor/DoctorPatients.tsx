import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { bookingService } from '../../services/api/bookings';
import { dashboardService } from '../../services/api/dashboard';
import type { Child } from '../../services/api/children';

export const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const [bookings, dashData] = await Promise.all([
        bookingService.getMyBookings(),
        dashboardService.getSpecialistDashboard().catch(() => null)
      ]);
      const uniqueChildren = new Map();
      const patientCards = dashData?.patientCards || [];
      
      bookings.forEach(b => {
        if (b.childId && !uniqueChildren.has(b.childId)) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          const card = patientCards.find((c: any) => c.childName === b.childName || c.name === b.childName);
          uniqueChildren.set(b.childId, {
            id: b.childId,
            name: b.childName || 'Unknown Patient',
            age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
            gender: card?.gender ?? card?.childGender ?? card?.sex ?? 'Unknown',
            parentId: b.parentId || '',
            dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? card?.dob ?? card?.childDob ?? '',
            riskLevel: card?.lastScreening?.riskLevel || card?.riskLevel || null,
            status: 'active',
          });
        }
      });
      
      const mappedPatients = Array.from(uniqueChildren.values());
// eslint-disable-next-line @typescript-eslint/no-explicit-any
      setPatients(mappedPatients as any[]);
    } catch (err) {
      console.error('Error fetching patients:', err);
    } finally {
      setLoading(false);
    }
  };

  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    fetchPatients();
  }, []);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.length >= 2) {
      try {
        const [bookings, dashData] = await Promise.all([
          bookingService.getMyBookings(),
          dashboardService.getSpecialistDashboard().catch(() => null)
        ]);
        const uniqueChildren = new Map();
        const patientCards = dashData?.patientCards || [];
        
        bookings.forEach(b => {
          if (b.childId && !uniqueChildren.has(b.childId)) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            const card = patientCards.find((c: any) => c.childName === b.childName || c.name === b.childName);
            uniqueChildren.set(b.childId, {
              id: b.childId,
              name: b.childName || 'Unknown Patient',
              age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
              gender: card?.gender ?? card?.childGender ?? card?.sex ?? 'Unknown',
              parentId: b.parentId || '',
              dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? card?.dob ?? card?.childDob ?? '',
              riskLevel: card?.lastScreening?.riskLevel || card?.riskLevel || null,
              status: 'active',
            });
          }
        });
        const mappedPatients = Array.from(uniqueChildren.values());
 
// eslint-disable-next-line @typescript-eslint/no-explicit-any
        setPatients(mappedPatients.filter((p: any) => (p.name ?? '').toLowerCase().includes(query.toLowerCase())) as any[]);
      } catch (err) {
        console.error('Error:', err);
      }
    } else if (query.length === 0) {
      fetchPatients();
    }
  };

  const getPatientName = (patient: Child) => {
    return patient.name || 'Patient';
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Patients</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage and view your patients' information</p>
        </div>

        <Input
          label="Search patients"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />

        {loading ? (
          <div>Loading...</div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {patients.map((patient) => {
              const patientName = getPatientName(patient);
              return (
                <Card key={patient.id} hoverable>
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <Avatar name={patientName} size="lg" />
                      <div>
                        <h3 className="font-bold text-slate-900 dark:text-white">{patientName}</h3>
                        {patient.riskLevel && patient.riskLevel.toLowerCase() !== 'unknown' && (
                          <div className="mb-1">
                            <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              patient.riskLevel.toLowerCase() === 'high' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' :
                              patient.riskLevel.toLowerCase() === 'medium' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' :
                              'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                            }`}>
                              {patient.riskLevel} Risk
                            </span>
                          </div>
                        )}
                        {patient.age && (
                          <p className="text-sm text-slate-650 dark:text-slate-400">
                            Age: {patient.age}
                          </p>
                        )}
                        {patient.gender && patient.gender.toLowerCase() !== 'unknown' && (
                          <p className="text-sm text-slate-650 dark:text-slate-400 capitalize">
                            Gender: {patient.gender}
                          </p>
                        )}
                      </div>
                    </div>

                    <Button
                      fullWidth
                      onClick={() => navigate(`/cases/${patient.id}`)}
                    >
                      View Details
                    </Button>
                  </div>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </MainLayout>
  );
};
