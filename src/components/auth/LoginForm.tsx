import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Alert } from '../common/Alert';
import { useAuth } from '../../context/AuthContext';
import { validateEmail } from '../../utils/validation';
import { ROUTES, ROLES } from '../../utils/constants';

export const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const { login, loading, error: authError } = useAuth();
  const navigate = useNavigate();

  const getRoleHome = (role?: string) => {
    if (role === ROLES.DOCTOR)     return ROUTES.DOCTOR_HOME;
    if (role === ROLES.THERAPIST)  return ROUTES.THERAPIST_HOME;
    return ROUTES.PARENT_HOME; // parent — ProtectedRoute handles screening redirect
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newErrors: typeof errors = {};

    if (!email || !validateEmail(email)) {
      newErrors.email = 'Please enter a valid email';
    }
    if (!password || password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      await login(email, password);
      setAlert({ type: 'success', message: 'Login successful! Redirecting...' });
      // Give auth context time to update user, then navigate
      setTimeout(() => {
        const storedUser = localStorage.getItem('user');
        const parsedUser = storedUser ? JSON.parse(storedUser) : null;
        navigate(getRoleHome(parsedUser?.role), { replace: true });
      }, 300);
    } catch {
      setAlert({
        type: 'error',
        message: authError || 'Login failed. Please check your credentials.',
      });
    }
  };

  return (
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Welcome Back</h2>
        <p className="text-slate-400 text-sm">Sign in to your account to continue.</p>
      </div>

      {alert && (
        <Alert
          type={alert.type}
          message={alert.message}
          onClose={() => setAlert(null)}
        />
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors({ ...errors, email: undefined });
          }}
          error={errors.email}
          icon={<Mail size={18} />}
          fullWidth
        />

        <div className="relative">
          <Input
            label="Password"
            type={showPassword ? 'text' : 'password'}
            placeholder="Enter your password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              if (errors.password) setErrors({ ...errors, password: undefined });
            }}
            error={errors.password}
            icon={<Lock size={18} />}
            fullWidth
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-9 text-slate-400 hover:text-slate-200 transition-colors"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        <div className="flex justify-end">
          <Link
            to={ROUTES.FORGOT_PASSWORD}
            className="text-xs text-slate-400 hover:text-cyan-400 transition-colors"
          >
            Forgot password?
          </Link>
        </div>

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          size="lg"
          className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 font-semibold shadow-lg shadow-orange-500/25"
        >
          Sign In
        </Button>

        <div className="text-center text-sm text-slate-400">
          Don't have an account?{' '}
          <Link
            to={ROUTES.SIGNUP}
            className="font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
          >
            Sign up free
          </Link>
        </div>
      </form>
    </div>
  );
};
