import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { childrenService } from '../../services/api/children';
import { ROUTES } from '../../utils/constants';

export const AddChild = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: 'Female',
    familyAutismHistory: false,
    jaundiceHistory: false,
    medicalHistory: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (key: string, value: any) => {
    setForm({ ...form, [key]: value });
    setError('');
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    try {
      const payload = {
        firstName: form.firstName,
        lastName: form.lastName,
        dateOfBirth: form.dateOfBirth,
        gender: form.gender,
        familyAutismHistory: form.familyAutismHistory,
        jaundiceHistory: form.jaundiceHistory,
        medicalHistory: form.medicalHistory,
      };

      const child = await childrenService.createChild(payload as any);
      // After creating, navigate to screening for this child
      navigate(`${ROUTES.PARENT_SCREENING}?childId=${child.id}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to add child');
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Add Child</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input label="First Name" value={form.firstName} onChange={(e) => handleChange('firstName', e.target.value)} fullWidth />
          <Input label="Last Name" value={form.lastName} onChange={(e) => handleChange('lastName', e.target.value)} fullWidth />
          <Input label="Date of Birth" type="date" value={form.dateOfBirth} onChange={(e) => handleChange('dateOfBirth', e.target.value)} fullWidth />
          <Select label="Gender" value={form.gender} onChange={(e) => handleChange('gender', e.target.value)} options={[{ value: 'Female', label: 'Female' }, { value: 'Male', label: 'Male' }]} fullWidth />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center gap-2">
            <input id="familyAutism" type="checkbox" checked={form.familyAutismHistory} onChange={(e) => handleChange('familyAutismHistory', e.target.checked)} />
            <label htmlFor="familyAutism">Family Autism History</label>
          </div>
          <div className="flex items-center gap-2">
            <input id="jaundice" type="checkbox" checked={form.jaundiceHistory} onChange={(e) => handleChange('jaundiceHistory', e.target.checked)} />
            <label htmlFor="jaundice">Neonatal Jaundice History</label>
          </div>
        </div>

        <Input label="Medical History" value={form.medicalHistory} onChange={(e) => handleChange('medicalHistory', e.target.value)} fullWidth />

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex gap-4">
          <Button onClick={handleSubmit} isLoading={loading}>Add Child & Start Screening</Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.PARENT_HOME)}>Cancel</Button>
        </div>
      </div>
    </MainLayout>
  );
};
