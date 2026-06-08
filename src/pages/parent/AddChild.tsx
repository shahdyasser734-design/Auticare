import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Input } from '../../components/common/Input';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { childrenService, type Child } from '../../services/api/children';
import { fileUploadService } from '../../services/api/fileUploadService';
import { ROUTES } from '../../utils/constants';
import { useAuth } from '../../context/useAuth';

export const AddChild = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
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
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState('');

  const canSubmit = Boolean(form.firstName.trim() && form.lastName.trim() && form.dateOfBirth);

  const handleChange = (key: keyof typeof form, value: string | boolean) => {
    setForm({ ...form, [key]: value });
    setError('');
  };

  const handleImageChange = (file?: File) => {
    if (!file) {
      setProfileImage(null);
      setPreviewUrl('');
      return;
    }
    setProfileImage(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async () => {
    if (!canSubmit) {
      setError('Please complete all required child details before starting the screening.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const payload: Omit<Child, 'id'> & { firstName?: string; lastName?: string } = {
        parentId: user?.id || '',
        name: `${form.firstName.trim()} ${form.lastName.trim()}`,
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        dateOfBirth: form.dateOfBirth,
        age: 0,
        gender: form.gender,
        familyAutismHistory: form.familyAutismHistory,
        jaundiceHistory: form.jaundiceHistory,
        medicalHistory: form.medicalHistory,
        profileImage: previewUrl,
        createdAt: new Date().toISOString(),
      };

      if (profileImage) {
        try {
          const upload = await fileUploadService.uploadFile(profileImage, 'specialist-document');
          const raw = upload as any;
          const imageUrl = (
            (typeof raw.url === 'string' && raw.url) ||
            (typeof raw.fileUrl === 'string' && raw.fileUrl) ||
            (typeof raw.imageUrl === 'string' && raw.imageUrl) ||
            (typeof raw.filePath === 'string' && raw.filePath) ||
            (typeof raw.path === 'string' && raw.path) ||
            (typeof raw.FileUrl === 'string' && raw.FileUrl) ||
            null
          );
          if (imageUrl) {
            payload.profileImage = imageUrl;
          }
        } catch (uploadError) {
          console.warn('Profile image upload failed; continuing without image.', uploadError);
        }
      }

      const child = await childrenService.createChild(payload);
      localStorage.setItem('latestChildId', child.id);
      localStorage.setItem('latestChildName', child.name);
      navigate(`${ROUTES.PARENT_SCREENING}?childId=${child.id}`);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Failed to add child';
      setError(errMsg);
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

        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">Child Profile Image (optional)</label>
          <input
            type="file"
            accept="image/*"
            onChange={(e) => handleImageChange(e.target.files?.[0])}
            className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm outline-none transition-colors duration-200 focus:border-orange-500 focus:ring-2 focus:ring-orange-200 dark:border-slate-700 dark:bg-slate-900 dark:text-white dark:focus:border-orange-400 dark:focus:ring-orange-500/20"
          />
          {previewUrl && (
            <img src={previewUrl} alt="Profile preview" className="mt-3 h-40 w-40 rounded-3xl object-cover border border-slate-200 dark:border-slate-700" />
          )}
        </div>

        {error && <div className="text-sm text-red-500">{error}</div>}

        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={handleSubmit} isLoading={loading} disabled={!canSubmit}>
            Add Child & Start Screening
          </Button>
          <Button variant="outline" onClick={() => navigate(ROUTES.PARENT_HOME)}>
            Cancel
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
