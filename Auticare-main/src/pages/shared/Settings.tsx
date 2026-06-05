import { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { useTheme } from '../../context/useTheme';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const [settings, setSettings] = useState({
    emailNotifications: true,
    pushNotifications: false,
    language: 'en',
  });
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = () => {
    localStorage.setItem('appSettings', JSON.stringify(settings));
    setAlert({ type: 'success', message: 'Settings saved successfully!' });
    setTimeout(() => setAlert(null), 3000);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-white mb-2">Settings</h1>
          <p className="text-slate-400">Manage your account preferences and app appearance.</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        {/* Notifications */}
        <Card>
          <h3 className="text-xl font-semibold text-white mb-6">Notifications</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.emailNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    emailNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-200">Email Notifications</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.pushNotifications}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    pushNotifications: e.target.checked,
                  })
                }
                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-secondary-500 focus:ring-secondary-500"
              />
              <span className="text-slate-200">Push Notifications</span>
            </label>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h3 className="text-xl font-semibold text-white mb-6">Preferences</h3>
          <div className="space-y-4">
            <Select
              label="Theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              options={[
                { value: 'light', label: 'Light' },
                { value: 'dark', label: 'Dark' },
                { value: 'system', label: 'Auto' },
              ]}
            />
            <Select
              label="Language"
              value={settings.language}
              onChange={(e) => setSettings({ ...settings, language: e.target.value })}
              options={[
                { value: 'en', label: 'English' },
                { value: 'es', label: 'Spanish' },
                { value: 'fr', label: 'French' },
              ]}
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <h3 className="text-xl font-semibold text-white mb-6">Danger Zone</h3>
          <div className="space-y-4">
            <p className="text-slate-400">
              These actions cannot be undone. Please be careful.
            </p>
            <Button variant="danger" fullWidth>
              Delete Account
            </Button>
          </div>
        </Card>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Button fullWidth onClick={handleSave}>
            Save Settings
          </Button>
        </div>
      </div>
    </MainLayout>
  );
};
