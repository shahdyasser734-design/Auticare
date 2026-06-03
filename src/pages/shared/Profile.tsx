import { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { Avatar } from '../../components/common/Avatar';
import { Alert } from '../../components/common/Alert';
import { useAuth } from '../../context/useAuth';
import { profileService } from '../../services/api/profile';

export const Profile = () => {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileService.updateProfile({
        name: formData.name,
        phone: formData.phone,
      });
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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-bold text-neutral-900 mb-2">My Profile</h1>
          <p className="text-neutral-600">View and manage your profile information</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Avatar */}
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-6">
              <Avatar name={user?.name || ''} size="xl" image={user?.profileImage} />
              <div>
                <h2 className="text-2xl font-bold text-neutral-900">{user?.name}</h2>
                <p className="text-neutral-600 capitalize">{user?.role}</p>
                <p className="text-neutral-600">{user?.email}</p>
              </div>
            </div>
            {isEditing && (
              <div className="w-1/2">
                <p className="text-sm font-medium mb-2">Update Picture</p>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      setSaving(true);
                      try {
                        await profileService.updateProfilePicture(e.target.files[0]);
                        setAlert({ type: 'success', message: 'Profile picture updated successfully!' });
                      } catch (err) {
                        setAlert({ type: 'error', message: 'Failed to update profile picture.' });
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            )}
          </div>
        </Card>

        {/* Profile Information */}
        <Card>
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-bold text-neutral-900">Personal Information</h3>
            <Button
              variant={isEditing ? 'outline' : 'primary'}
              onClick={() => setIsEditing(!isEditing)}
              disabled={saving}
            >
              {isEditing ? 'Cancel' : 'Edit'}
            </Button>
          </div>

          <div className="space-y-4">
            <Input
              label="Full Name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              disabled={!isEditing}
            />
            <Input
              label="Email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              disabled={true} // Usually email isn't directly editable without verification
            />
            <Input
              label="Phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              disabled={!isEditing}
            />

            {isEditing && (
              <Button fullWidth onClick={handleSave} isLoading={saving} className="mt-4">
                Save Changes
              </Button>
            )}
          </div>
        </Card>

        {/* License Upload for Doctor/Therapist */}
        {(user?.role === 'doctor' || user?.role === 'therapist') && (
          <Card>
            <h3 className="text-xl font-bold text-neutral-900 mb-6">Professional Credentials</h3>
            <div className="space-y-4">
              <Input
                label="License Number"
                placeholder="Enter license number"
                onChange={(_e) => {
                  // In a real app we'd bind this to state
                }}
                id="licenseInput"
              />
              <div>
                <p className="text-sm font-medium mb-2">Upload License Document</p>
                <input
                  type="file"
                  accept=".pdf, image/png, image/jpeg, image/jpg"
                  onChange={async (e) => {
                    if (e.target.files && e.target.files[0]) {
                      const licenseNumber = (document.getElementById('licenseInput') as HTMLInputElement)?.value || 'UNKNOWN';
                      setSaving(true);
                      try {
                        await profileService.updateLicense(licenseNumber, e.target.files[0]);
                        setAlert({ type: 'success', message: 'License uploaded successfully!' });
                      } catch (err) {
                        setAlert({ type: 'error', message: 'Failed to upload license.' });
                      } finally {
                        setSaving(false);
                      }
                    }
                  }}
                  className="block w-full text-sm text-slate-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-full file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100"
                />
              </div>
            </div>
          </Card>
        )}

        {/* Account Information */}
        <Card>
          <h3 className="text-xl font-bold text-neutral-900 mb-6">Account Information</h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm text-neutral-600 mb-1">Account Type</p>
              <p className="text-lg font-semibold text-neutral-900 capitalize">{user?.role}</p>
            </div>
            <div>
              <p className="text-sm text-neutral-600 mb-1">Member Since</p>
              <p className="text-lg font-semibold text-neutral-900">
                {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
              </p>
            </div>
          </div>
        </Card>
      </div>
    </MainLayout>
  );
};
