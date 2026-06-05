import { useState } from 'react';
import { MainLayout } from '../../layouts/MainLayout';
import { Card } from '../../components/common/Card';
import { Button } from '../../components/common/Button';
import { Select } from '../../components/common/Select';
import { Alert } from '../../components/common/Alert';
import { useTheme } from '../../context/useTheme';
import { useLanguage } from '../../context/useLanguage';
import type { SupportedLanguage } from '../../context/LanguageContext';

export const Settings = () => {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();

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

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto space-y-8">
        <div>
          <h1 className="text-4xl font-semibold text-white mb-2">{t.settingsTitle}</h1>
          <p className="text-slate-400">{t.managePreferences}</p>
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
          <h3 className="text-xl font-semibold text-white mb-6">{t.notificationsSection}</h3>
          <div className="space-y-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={emailNotifications}
                onChange={(e) => setEmailNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-primary-500 focus:ring-primary-500"
              />
              <span className="text-slate-200">{t.emailNotifications}</span>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={pushNotifications}
                onChange={(e) => setPushNotifications(e.target.checked)}
                className="w-4 h-4 rounded border-slate-600 bg-slate-950 text-secondary-500 focus:ring-secondary-500"
              />
              <span className="text-slate-200">{t.pushNotifications}</span>
            </label>
          </div>
        </Card>

        {/* Preferences */}
        <Card>
          <h3 className="text-xl font-semibold text-white mb-6">{t.preferencesSection}</h3>
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
          <h3 className="text-xl font-semibold text-white mb-6">{t.dangerZone}</h3>
          <div className="space-y-4">
            <p className="text-slate-400">
              These actions cannot be undone. Please be careful.
            </p>
            <Button variant="danger" fullWidth>
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
    </MainLayout>
  );
};
