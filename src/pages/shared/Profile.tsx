import { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/useAuth';
import { profileService } from '../../services/api/profile';
import { User, Briefcase, Award, Loader2, Upload } from 'lucide-react';

export const Profile = () => {
  const { user } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: (user as unknown as Record<string, unknown>)?.phone as string || '',
    bio: (user as unknown as Record<string, unknown>)?.bio as string || '',
    specialty: (user as unknown as Record<string, unknown>)?.specialization as string || (user as unknown as Record<string, unknown>)?.specialty as string || '',
    yearsOfExperience: (user as unknown as Record<string, unknown>)?.yearsOfExperience as string || '',
    licenseNumber: (user as unknown as Record<string, unknown>)?.licenseNumber as string || '',
  });
  
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingPic, setUploadingPic] = useState(false);
  const [uploadingLicense, setUploadingLicense] = useState(false);

  const isSpecialist = user?.role === 'doctor' || user?.role === 'therapist';

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        name: formData.name,
        phone: formData.phone,
      };

      if (isSpecialist) {
        payload.bio = formData.bio;
        payload.specialization = formData.specialty;
        payload.yearsOfExperience = formData.yearsOfExperience ? Number(formData.yearsOfExperience) : undefined;
      }

      await profileService.updateProfile(payload);
      setAlert({ type: 'success', message: 'Profile updated successfully!' });
      setIsEditing(false);
    } catch (err) {
      console.error(err);
      setAlert({ type: 'error', message: 'Failed to update profile.' });
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(null), 3000);
    }
  };

  const handlePictureUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingPic(true);
      try {
        await profileService.updateProfilePicture(e.target.files[0]);
        setAlert({ type: 'success', message: 'Profile picture updated successfully!' });
      } catch (err) {
        console.error(err);
        setAlert({ type: 'error', message: 'Failed to update profile picture.' });
      } finally {
        setUploadingPic(false);
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadingLicense(true);
      try {
        const licenseNum = formData.licenseNumber || 'UNKNOWN';
        await profileService.updateLicense(licenseNum, e.target.files[0]);
        setAlert({ type: 'success', message: 'License and credentials uploaded successfully!' });
      } catch (err) {
        console.error(err);
        setAlert({ type: 'error', message: 'Failed to upload license document.' });
      } finally {
        setUploadingLicense(false);
        setTimeout(() => setAlert(null), 3000);
      }
    }
  };

  return (
    <MainLayout>
      <div className="max-w-3xl mx-auto space-y-6 pb-12">
        <div>
          <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">My Profile</h1>
          <p className="text-slate-600 dark:text-slate-400">Manage your profile information and credentials</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Profile Card & Avatar */}
        <Card className="border border-slate-200 dark:border-white/10 shadow-lg rounded-3xl p-6">
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-between">
            <div className="flex flex-col sm:flex-row items-center gap-6 text-center sm:text-left">
              <Avatar name={user?.name || ''} size="xl" image={user?.profileImage} />
              <div>
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{user?.name}</h2>
                <p className="text-sm font-semibold text-primary-600 uppercase tracking-wider mt-1">{user?.role}</p>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">{user?.email}</p>
              </div>
            </div>
            
            <div className="w-full sm:w-auto flex flex-col items-center">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Update Avatar</label>
              <div className="relative">
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={handlePictureUpload}
                  disabled={uploadingPic}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <Button size="sm" variant="outline" disabled={uploadingPic} className="rounded-xl cursor-pointer">
                  {uploadingPic ? <Loader2 size={16} className="animate-spin mr-1" /> : <Upload size={16} className="mr-1" />}
                  Change Picture
                </Button>
              </div>
            </div>
          </div>
        </Card>

        {/* Personal & Specialty Information Form */}
        <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6">
          <div className="flex items-center justify-between mb-6 border-b pb-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <User className="text-primary-500" /> Personal Information
            </h3>
            <Button
              variant={isEditing ? 'outline' : 'primary'}
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
              className="rounded-xl cursor-pointer"
            >
              {isEditing ? 'Cancel Edit' : 'Edit Profile'}
            </Button>
          </div>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
              fullWidth
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Email Address"
                type="email"
                value={formData.email}
                disabled={true}
                fullWidth
              />
              <Input
                label="Phone Number"
                type="tel"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                disabled={!isEditing}
                fullWidth
              />
            </div>

            {/* Specialist Fields */}
            {isSpecialist && (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4 mt-4">
                  <Input
                    label="Specialization / Specialty"
                    placeholder="e.g. Pediatric Neurologist"
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    disabled={!isEditing}
                    fullWidth
                  />
                  <Input
                    label="Years of Experience"
                    type="number"
                    placeholder="e.g. 10"
                    value={formData.yearsOfExperience}
                    onChange={(e) => setFormData({ ...formData, yearsOfExperience: e.target.value })}
                    disabled={!isEditing}
                    fullWidth
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Clinical Bio</label>
                  <textarea
                    placeholder="Describe your clinical specialization and therapeutic philosophy..."
                    value={formData.bio}
                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                    disabled={!isEditing}
                    className="w-full p-4 border border-slate-300 rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none dark:bg-slate-900 dark:border-white/10 dark:text-white text-sm"
                    rows={4}
                  />
                </div>
              </>
            )}

            {isEditing && (
              <Button fullWidth onClick={handleSave} isLoading={saving} className="mt-6 rounded-2xl cursor-pointer bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-bold shadow-lg">
                Publish Changes
              </Button>
            )}
          </div>
        </Card>

        {/* License Upload for Doctor/Therapist */}
        {isSpecialist && (
          <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-4">
              <Award className="text-purple-500" /> Professional Credentials & License
            </h3>
            
            <div className="space-y-4">
              <Input
                label="License / Register Number"
                placeholder="Enter clinical license number"
                value={formData.licenseNumber}
                onChange={(e) => setFormData({ ...formData, licenseNumber: e.target.value })}
                fullWidth
              />
              
              <div>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Upload License Document (PDF / Image)</p>
                <div className="relative">
                  <input
                    type="file"
                    accept=".pdf, image/png, image/jpeg, image/jpg"
                    onChange={handleLicenseUpload}
                    disabled={uploadingLicense}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  <Button variant="outline" disabled={uploadingLicense} className="w-full rounded-2xl p-4 flex items-center justify-center gap-2 cursor-pointer border-dashed border-2">
                    {uploadingLicense ? <Loader2 size={20} className="animate-spin" /> : <Upload size={20} />}
                    Select License File to Upload
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Account Details */}
        <Card className="border border-slate-200 dark:border-white/10 shadow-md rounded-3xl p-6 space-y-4">
          <h3 className="text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2 border-b pb-4">
            <Briefcase className="text-slate-500" /> Account Security Summary
          </h3>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Account Role</p>
              <p className="text-base font-bold text-slate-900 dark:text-white capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mb-1">Creation Date</p>
              <p className="text-base font-bold text-slate-900 dark:text-white">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
