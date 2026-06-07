import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { bookingService } from '../../services/api/bookings';
import type { Child } from '../../services/api/children';

export const DoctorPatients = () => {
  const navigate = useNavigate();
  const [patients, setPatients] = useState<Child[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      const bookings = await bookingService.getMyBookings();
      const uniqueChildren = new Map();
      
      bookings.forEach(b => {
        if (b.childId && !uniqueChildren.has(b.childId)) {
          uniqueChildren.set(b.childId, {
            id: b.childId,
            name: b.childName || 'Unknown Patient',
            age: null,
            gender: 'Unknown',
            parentId: b.parentId || '',
            dateOfBirth: '',
            status: 'active',
          });
        }
      });
      
      const mappedPatients = Array.from(uniqueChildren.values());
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
        const bookings = await bookingService.getMyBookings();
        const uniqueChildren = new Map();
        
        bookings.forEach(b => {
          if (b.childId && !uniqueChildren.has(b.childId)) {
            uniqueChildren.set(b.childId, {
              id: b.childId,
              name: b.childName || 'Unknown Patient',
              age: null,
              gender: 'Unknown',
              parentId: b.parentId || '',
              dateOfBirth: '',
              status: 'active',
            });
          }
        });
        const mappedPatients = Array.from(uniqueChildren.values());
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
                        <p className="text-sm text-slate-650 dark:text-slate-400">Age: {patient.age ?? 'N/A'}</p>
                        <p className="text-sm text-slate-650 dark:text-slate-400 capitalize">{patient.gender}</p>
                      </div>
                    </div>

                    <Button
                      fullWidth
                      onClick={() => navigate(`/doctor/patients/${patient.id}`)}
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
