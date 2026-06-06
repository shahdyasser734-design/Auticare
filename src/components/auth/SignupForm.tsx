import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Lock, User } from 'lucide-react';
import { Button } from '../common/Button';
import { Input } from '../common/Input';
import { Select } from '../common/Select';
import { Alert } from '../common/Alert';
import { FileUpload } from '../common/FileUpload';
import { useAuth } from '../../context/useAuth';
import { useTheme } from '../../context/useTheme';
import { validateEmail, validatePassword, validateName } from '../../utils/validation';
import { ROUTES, ROLES } from '../../utils/constants';
import type { UserRole } from '../../types';

export const SignupForm = () => {
  const { isDark } = useTheme();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: '' as UserRole | '',
    phone: '',
    nationalId: '',
    specialization: '',
    licenseNumber: '',
    yearsOfExperience: '',
    qualification: '',
  });
  const [files, setFiles] = useState<Record<string, File | null>>({
    certificateFile: null,
    graduationCertificateFile: null,
    professionalDocumentFile: null,
  });
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const { signup, login, loading } = useAuth();
  const navigate = useNavigate();

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    if (errors[field]) {
      setErrors({ ...errors, [field]: undefined });
    }
  };

  const handleFileChange = (fileName: string, file: File | null) => {
    setFiles({ ...files, [fileName]: file });
    if (errors[fileName]) {
      setErrors({ ...errors, [fileName]: undefined });
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newErrors: Record<string, string> = {};

    if (!validateName(formData.name)) {
      newErrors.name = 'Name must be between 2 and 100 characters';
    }
    if (!validateEmail(formData.email)) {
      newErrors.email = 'Please enter a valid email';
    }
    const passwordValidation = validatePassword(formData.password);
    if (!passwordValidation.valid) {
      newErrors.password = passwordValidation.errors[0];
    }
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    if (!formData.role) {
      newErrors.role = 'Please select a role';
    }
    if (!formData.phone) {
      newErrors.phone = 'Please enter a phone number';
    }

    // Validate National ID for all roles
    if (!formData.nationalId) {
      newErrors.nationalId = 'National ID is required';
    } else if (!/^\d{14}$/.test(formData.nationalId)) {
      newErrors.nationalId = 'National ID must be exactly 14 digits';
    }

    // Validate doctor/therapist fields
    if (formData.role === ROLES.DOCTOR || formData.role === ROLES.THERAPIST) {
      if (!formData.yearsOfExperience) {
        newErrors.yearsOfExperience = 'Years of experience is required';
      } else if (parseInt(formData.yearsOfExperience) < 0) {
        newErrors.yearsOfExperience = 'Years of experience must be 0 or greater';
      }
      
      if (!formData.qualification) {
        newErrors.qualification = 'Qualification/Degree is required';
      }
      
      if (!files.certificateFile) {
        newErrors.certificateFile = 'Professional certificate is required';
      }
      
      if (!files.graduationCertificateFile) {
        newErrors.graduationCertificateFile = 'Graduation/Bachelor degree certificate is required';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      // Build payload matching backend contract
      const payload: Record<string, unknown> = {
        fullName: formData.name,
        email: formData.email,
        password: formData.password,
        role: (formData.role as string).charAt(0).toUpperCase() + (formData.role as string).slice(1),
        phone: formData.phone,
        nationalId: formData.nationalId,
      };

      if (formData.role === ROLES.DOCTOR || formData.role === ROLES.THERAPIST) {
        payload.yearsOfExperience = parseInt(formData.yearsOfExperience);
        payload.qualification = formData.qualification;
        payload.specialization = formData.specialization;
        payload.licenseNumber = formData.licenseNumber;
        payload.nationalId = formData.nationalId;
        
        // Include file information
        if (files.certificateFile) {
          payload.certificateFileName = files.certificateFile.name;
          payload.certificateSize = files.certificateFile.size;
        }
        if (files.graduationCertificateFile) {
          payload.graduationCertificateFileName = files.graduationCertificateFile.name;
          payload.graduationCertificateSize = files.graduationCertificateFile.size;
        }
        if (files.professionalDocumentFile) {
          payload.professionalDocumentFileName = files.professionalDocumentFile.name;
          payload.professionalDocumentSize = files.professionalDocumentFile.size;
        }
      }

      // Sign up
      await signup(payload);

      // Try to auto-login
      setAlert({ type: 'success', message: 'Account created successfully. Logging in...' });
      
      try {
        const data = await login(formData.email, formData.password);
        
        setTimeout(() => {
          const role = data.user?.role || localStorage.getItem('role') || '';
          const normalizedRole = role.toLowerCase();
          
          let targetRoute = ROUTES.ROOT;
          if (normalizedRole === 'parent') {
            targetRoute = ROUTES.PARENT_ADD_CHILD;
          } else if (normalizedRole === 'doctor' || normalizedRole === 'specialist') {
            targetRoute = ROUTES.DOCTOR_HOME;
          } else if (normalizedRole === 'therapist') {
            targetRoute = ROUTES.THERAPIST_HOME;
          }
          
          console.log("AVAILABLE ROUTES:", ROUTES);
          console.log("NAVIGATING TO:", targetRoute);
          navigate(targetRoute, { replace: true });
        }, 1000);
      } catch {
        setAlert({ type: 'error', message: 'Auto-login failed. Please sign in manually.' });
        setTimeout(() => navigate(ROUTES.LOGIN), 1500);
      }
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : 'Signup failed. Please try again.';
      setAlert({
        type: 'error',
        message: errMsg,
      });
    }
  };

  return (
    <div className={`w-full max-w-2xl transition-colors duration-300 ${
      isDark ? 'bg-slate-900' : 'bg-white'
    } rounded-2xl p-6 md:p-8`}>
      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <h1 className={`text-3xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>Create Account</h1>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>Start with a secure autism care experience.</p>
        </div>

        {alert && (
          <Alert
            type={alert.type}
            message={alert.message}
            onClose={() => setAlert(null)}
          />
        )}

        <Input
          label="Full Name"
          placeholder="John Doe"
          value={formData.name}
          onChange={(e) => handleChange('name', e.target.value)}
          error={errors.name}
          icon={<User size={20} />}
          fullWidth
        />

        <Input
          label="Email"
          type="email"
          placeholder="your@email.com"
          value={formData.email}
          onChange={(e) => handleChange('email', e.target.value)}
          error={errors.email}
          icon={<Mail size={20} />}
          fullWidth
        />

        <Select
          label="Role"
          value={formData.role}
          onChange={(e) => handleChange('role', e.target.value)}
          error={errors.role}
          options={[
            { value: ROLES.PARENT, label: 'Parent' },
            { value: ROLES.DOCTOR, label: 'Doctor' },
            { value: ROLES.THERAPIST, label: 'Therapist' },
          ]}
          fullWidth
        />

        <Input
          label="Phone"
          placeholder="01012345678"
          value={formData.phone}
          onChange={(e) => handleChange('phone', e.target.value)}
          error={errors.phone}
          fullWidth
        />

        <Input
          label="National ID"
          placeholder="30201012233445"
          value={formData.nationalId}
          onChange={(e) => {
            const value = e.target.value.replace(/\D/g, '').slice(0, 14);
            handleChange('nationalId', value);
          }}
          error={errors.nationalId}
          hint="14 digits required"
          fullWidth
          required
        />

        {(formData.role === ROLES.DOCTOR || formData.role === ROLES.THERAPIST) && (
          <div className={`space-y-5 p-5 rounded-lg border ${
            isDark ? 'border-slate-700 bg-slate-800/30' : 'border-slate-200 bg-slate-50'
          }`}>
            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Professional Information
            </p>

            <Input
              label="Years of Experience"
              type="number"
              placeholder="5"
              value={formData.yearsOfExperience}
              onChange={(e) => handleChange('yearsOfExperience', e.target.value)}
              error={errors.yearsOfExperience}
              fullWidth
              required
            />

            <Input
              label="Qualification / Degree"
              placeholder="Master's in Psychology"
              value={formData.qualification}
              onChange={(e) => handleChange('qualification', e.target.value)}
              error={errors.qualification}
              fullWidth
              required
            />

            <Input
              label="Specialization"
              placeholder="Behavioral Therapy"
              value={formData.specialization}
              onChange={(e) => handleChange('specialization', e.target.value)}
              fullWidth
            />

            <Input
              label="License Number"
              placeholder="LIC-2026-001"
              value={formData.licenseNumber}
              onChange={(e) => handleChange('licenseNumber', e.target.value)}
              fullWidth
            />

            <FileUpload
              label="Professional Certificate"
              description="Upload your professional license or certificate"
              onFileSelect={(file) => handleFileChange('certificateFile', file)}
              error={errors.certificateFile}
              required
              allowedFormats={['PDF', 'JPG', 'JPEG', 'PNG']}
              maxSize={5}
              hint="Maximum file size: 5MB. Accepted formats: PDF, JPG, PNG"
            />

            <FileUpload
              label="Graduation / Bachelor's Degree Certificate"
              description="Upload your graduation or bachelor's degree certificate"
              onFileSelect={(file) => handleFileChange('graduationCertificateFile', file)}
              error={errors.graduationCertificateFile}
              required
              allowedFormats={['PDF', 'JPG', 'JPEG', 'PNG']}
              maxSize={5}
              hint="Maximum file size: 5MB. Accepted formats: PDF, JPG, PNG"
            />

            <FileUpload
              label="Additional Professional Document (Optional)"
              description="Upload any other relevant professional document"
              onFileSelect={(file) => handleFileChange('professionalDocumentFile', file)}
              allowedFormats={['PDF', 'JPG', 'JPEG', 'PNG']}
              maxSize={5}
              hint="Maximum file size: 5MB. Accepted formats: PDF, JPG, PNG"
            />
          </div>
        )}

        <Input
          label="Password"
          type="password"
          placeholder="Enter a strong password"
          value={formData.password}
          onChange={(e) => handleChange('password', e.target.value)}
          error={errors.password}
          icon={<Lock size={20} />}
          hint="At least 8 characters, 1 uppercase, 1 lowercase, 1 number"
          fullWidth
        />

        <Input
          label="Confirm Password"
          type="password"
          placeholder="Confirm your password"
          value={formData.confirmPassword}
          onChange={(e) => handleChange('confirmPassword', e.target.value)}
          error={errors.confirmPassword}
          icon={<Lock size={20} />}
          fullWidth
        />

        <Button
          type="submit"
          isLoading={loading}
          fullWidth
          size="lg"
          className="font-semibold"
        >
          Create Account
        </Button>

        <div className={`text-center text-sm ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          Already have an account?{' '}
          <a href={ROUTES.LOGIN} className={`font-medium transition-colors ${
            isDark ? 'text-blue-400 hover:text-blue-300' : 'text-orange-600 hover:text-orange-700'
          }`}>
            Sign in
          </a>
        </div>
      </form>
    </div>
  );
};
