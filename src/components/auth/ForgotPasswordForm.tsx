import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, ArrowLeft } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { validateEmail } from '../../utils/validation';
import { ROUTES } from '../../utils/constants';

export const ForgotPasswordForm = () => {
  const { isDark } = useTheme();
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const { forgotPassword, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!email || !validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await forgotPassword(email);
      setAlert({
        type: 'success',
        message: 'Password reset link sent to your email',
      });
      setSubmitted(true);
    } catch {
      setAlert({
        type: 'error',
        message: authError || 'Failed to send reset link',
      });
    }
  };

  if (submitted) {
    return (
      <div className={`w-full max-w-md transition-colors duration-300 ${
        isDark ? 'bg-slate-900 rounded-2xl p-8' : 'standard-card p-8 '
      }`}>
        <div className="text-center space-y-4">
          <div className="text-5xl">📧</div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Check Your Email
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            We've sent a password reset link to <strong>{email}</strong>
          </p>
          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-500'}`}>
            Click the link in the email to reset your password. If you don't see it, check your
            spam folder.
          </p>
          <div className="pt-4 space-y-3">
            <Button fullWidth onClick={() => navigate(ROUTES.LOGIN)} variant="secondary">
              Back to Login
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-md transition-colors duration-300 ${
      isDark ? 'bg-slate-900 rounded-2xl p-8' : 'standard-card p-8 '
    }`}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            Forgot Password?
          </h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>
            Enter your email and we'll send you a link to reset your password
          </p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({});
          }}
          error={errors.email}
          icon={<Mail size={20} />}
          fullWidth
        />

        <Button type="submit" isLoading={loading} fullWidth size="lg" className="font-semibold">
          Send Reset Link
        </Button>

        <button
          type="button"
          onClick={() => navigate(ROUTES.LOGIN)}
          className={`w-full flex items-center justify-center gap-2 font-medium transition-colors ${
            isDark 
              ? 'text-blue-400 hover:text-blue-300' 
              : 'text-orange-600 hover:text-orange-700'
          }`}
        >
          <ArrowLeft size={20} />
          Back to Login
        </button>
      </form>
    </div>
  );
};
