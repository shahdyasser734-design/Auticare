import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { bookingService } from '../../services/api/bookings';
import type { Booking } from '../../services/api/bookings';
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
      
      // 1. Add all patients from Dashboard (this includes assigned patients with no bookings)
      patientCards.forEach((card: Record<string, unknown>) => {
        const id = card.id || card.childId;
        
        const childBookings = bookings.filter((b: Booking) => String(b.childId) === String(id));
        const hasOnlyPendingBookings = childBookings.length > 0 && childBookings.every((b: Booking) => {
          const s = (b.status || '').toLowerCase();
          return s === 'pending' || s === 'rejected';
        });

        if (id && !hasOnlyPendingBookings && !uniqueChildren.has(id)) {
          uniqueChildren.set(id, {
            id,
            name: card.name || card.childName || 'Unknown Patient',
            age: card.age ?? card.childAge ?? card.ageInYears ?? null,
            gender: card.gender ?? card.childGender ?? card.sex ?? 'Unknown',
            parentId: card.parentId || '',
            dateOfBirth: card.dateOfBirth ?? card.date_of_birth ?? card.dob ?? card.childDob ?? '',
            riskLevel: (card.lastScreening as Record<string, unknown>)?.riskLevel || card.riskLevel || null,
            status: card.status || 'active',
            assignedDoctor: card.assignedDoctor || '',
            assignedTherapist: card.assignedTherapist || '',
          });
        }
      });

      // 2. Add patients from Bookings (fallback for missing cards)
      bookings.forEach(b => {
        const status = (b.status || '').toLowerCase();
        if (status !== 'pending' && status !== 'rejected' && b.childId && !uniqueChildren.has(b.childId)) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
          const card = patientCards.find((c: any) => c.childName === b.childName || c.name === b.childName) as Record<string, unknown> | undefined;
          uniqueChildren.set(b.childId, {
            id: b.childId,
            name: b.childName || 'Unknown Patient',
            age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
            gender: card?.gender ?? card?.childGender ?? card?.sex ?? '',
            parentId: b.parentId || '',
            dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? card?.dob ?? card?.childDob ?? '',
            riskLevel: (card?.lastScreening as Record<string, unknown>)?.riskLevel || card?.riskLevel || null,
            status: 'active',
            assignedDoctor: card?.assignedDoctor || b.doctorName || '',
            assignedTherapist: card?.assignedTherapist || b.therapistName || '',
          });
        }
      });
      
      const mappedPatients = Array.from(uniqueChildren.values());
      setPatients(mappedPatients as Child[]);
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
        
        // 1. Add all patients from Dashboard
        patientCards.forEach((card: Record<string, unknown>) => {
          const id = card.id || card.childId;
          
          const childBookings = bookings.filter((b: Booking) => String(b.childId) === String(id));
          const hasOnlyPendingBookings = childBookings.length > 0 && childBookings.every((b: Booking) => {
            const s = (b.status || '').toLowerCase();
            return s === 'pending' || s === 'rejected';
          });

          if (id && !hasOnlyPendingBookings && !uniqueChildren.has(id)) {
            uniqueChildren.set(id, {
              id,
              name: card.name || card.childName || 'Unknown Patient',
              age: card.age ?? card.childAge ?? card.ageInYears ?? null,
              gender: card.gender ?? card.childGender ?? card.sex ?? '',
              parentId: card.parentId || '',
              dateOfBirth: card.dateOfBirth ?? card.date_of_birth ?? card.dob ?? card.childDob ?? '',
              riskLevel: (card.lastScreening as Record<string, unknown>)?.riskLevel || card.riskLevel || null,
              status: card.status || 'active',
              assignedDoctor: card.assignedDoctor || '',
              assignedTherapist: card.assignedTherapist || '',
            });
          }
        });

        // 2. Add patients from Bookings
        bookings.forEach(b => {
          const status = (b.status || '').toLowerCase();
          if (status !== 'pending' && status !== 'rejected' && b.childId && !uniqueChildren.has(b.childId)) {
// eslint-disable-next-line @typescript-eslint/no-explicit-any
            const card = patientCards.find((c: any) => c.childName === b.childName || c.name === b.childName) as Record<string, unknown> | undefined;
            uniqueChildren.set(b.childId, {
              id: b.childId,
              name: b.childName || 'Unknown Patient',
              age: card?.age ?? card?.childAge ?? card?.ageInYears ?? null,
              gender: card?.gender ?? card?.childGender ?? card?.sex ?? '',
              parentId: b.parentId || '',
              dateOfBirth: card?.dateOfBirth ?? card?.date_of_birth ?? card?.dob ?? card?.childDob ?? '',
              riskLevel: (card?.lastScreening as Record<string, unknown>)?.riskLevel || card?.riskLevel || null,
              status: 'active',
              assignedDoctor: card?.assignedDoctor || b.doctorName || '',
              assignedTherapist: card?.assignedTherapist || b.therapistName || '',
            });
          }
        });
        const mappedPatients = Array.from(uniqueChildren.values());
 
        setPatients(mappedPatients.filter((p: unknown) => ((p as Record<string, unknown>).name ?? '').toString().toLowerCase().includes(query.toLowerCase())) as Child[]);
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
                        {patient.gender && patient.gender.toLowerCase() !== 'unknown' && patient.gender.toLowerCase() !== 'undefined' && patient.gender.toLowerCase() !== 'null' && (
                          <span className="text-sm text-slate-500 dark:text-slate-400 capitalize">• {patient.gender}</span>
                        )}
                        <div className="mt-3 flex flex-col gap-1 text-sm text-xs text-slate-500 dark:text-slate-400">
                          {!!(patient as unknown as Record<string, unknown>).assignedDoctor && (
                            <p><strong className="text-slate-600 dark:text-slate-300">Doctor:</strong> {(patient as unknown as Record<string, unknown>).assignedDoctor as string}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    <Button
                      fullWidth
                      onClick={() => navigate(`/patients/${patient.id}`)}
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
