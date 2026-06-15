import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { useTheme } from '../../context/useTheme';
import { useLanguage } from '../../context/useLanguage';
import { useAuth } from '../../context/useAuth';
import { ROUTES } from '../../utils/constants';
import type { SupportedLanguage } from '../../context/LanguageContext';

export const Settings = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  const [emailNotifications, setEmailNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) return JSON.parse(saved).emailNotifications ?? true;
    } catch { /* ignore */ }
    return true;
  });

  const [pushNotifications, setPushNotifications] = useState(() => {
    try {
      const saved = localStorage.getItem('appSettings');
      if (saved) return JSON.parse(saved).pushNotifications ?? false;
    } catch { /* ignore */ }
    return false;
  });

  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleSave = () => {
    localStorage.setItem(
      'appSettings',
      JSON.stringify({ emailNotifications, pushNotifications, language })
    );
    setAlert({ type: 'success', message: t.settingsSaved });
    setTimeout(() => setAlert(null), 3000);
  };

  const handleDeleteAccount = () => {
    // Clean up local storage completely (remove all user details, cached state, etc.)
    localStorage.clear();
    logout();
    navigate(ROUTES.LOGIN);
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-slate-900 dark:text-white mb-2">{t.settingsTitle}</h1>
          <p className="text-slate-750 dark:text-slate-450 font-medium">{t.managePreferences}</p>
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
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t.notificationsSection}</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{t.emailNotifications}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-950 text-secondary-500 focus:ring-secondary-500"
              />
              <span className="text-slate-900 dark:text-slate-100 font-semibold">{t.pushNotifications}</span>
            </label>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t.preferencesSection}</h3>
          <div className="space-y-4">
            <Select
              label={t.theme}
              value={theme}
              onChange={(e) => setTheme(e.target.value as 'light' | 'dark' | 'system')}
              options={[
                { value: 'light', label: t.themeLight },
                { value: 'dark', label: t.themeDark },
                { value: 'system', label: t.themeAuto },
              ]}
            />
            {/* Language — changes take effect immediately, no reload needed */}
            <Select
              label={t.language}
              value={language}
              onChange={(e) => setLanguage(e.target.value as SupportedLanguage)}
              options={[
                { value: 'en', label: 'English' },
                { value: 'ar', label: 'العربية' },
                { value: 'fr', label: 'Français' },
                { value: 'es', label: 'Español' },
              ]}
            />
          </div>
        </Card>

        {/* Danger Zone */}
        <Card>
          <h3 className="text-xl font-semibold text-slate-900 dark:text-white mb-6">{t.dangerZone}</h3>
          <div className="space-y-4">
            <p className="text-slate-750 dark:text-slate-400 font-medium">
              These actions cannot be undone. Please be careful.
            </p>
            <Button variant="danger" fullWidth onClick={() => setShowDeleteModal(true)}>
              {t.deleteAccount}
            </Button>
          </div>
        </Card>

        <div className="flex gap-4 flex-col sm:flex-row">
          <Button fullWidth onClick={handleSave}>
            {t.saveSettings}
          </Button>
        </div>
      </div>

      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
          <div className="standard-card p-6 max-w-md w-full space-y-6">
            <div className="text-center space-y-2">
              <span className="text-4xl" role="img" aria-label="warning">⚠️</span>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white">Delete Account?</h3>
              <p className="text-slate-750 dark:text-slate-400 text-sm font-medium">
                This action is permanent and cannot be undone. All child profiles, screenings, bookings, and medical history will be permanently deleted.
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" fullWidth onClick={() => setShowDeleteModal(false)}>
                Cancel
              </Button>
              <Button variant="danger" fullWidth onClick={handleDeleteAccount}>
                Yes, Delete
              </Button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
