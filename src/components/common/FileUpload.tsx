import { useState } from 'react';
import { Upload, X, Check, AlertCircle } from 'lucide-react';
import { useTheme } from '../../context/useTheme';

interface FileUploadProps {
  label: string;
  accept?: string;
  maxSize?: number; // in MB
  onFileSelect: (file: File | null) => void;
  required?: boolean;
  error?: string;
  description?: string;
  hint?: string;
  allowedFormats?: string[];
}

export const FileUpload = ({
  label,
  accept = '.pdf,.jpg,.jpeg,.png',
  maxSize = 5,
  onFileSelect,
  required = false,
  error,
  description,
  hint,
  allowedFormats = ['PDF', 'JPG', 'JPEG', 'PNG'],
}: FileUploadProps) => {
  const { isDark } = useTheme();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string>('');

  const validateFile = (file: File): boolean => {
    // Check file size
    const fileSizeInMB = file.size / (1024 * 1024);
    if (fileSizeInMB > maxSize) {
      setValidationError(`File size must be less than ${maxSize}MB. Current size: ${fileSizeInMB.toFixed(2)}MB`);
      return false;
    }

    // Check file type
    const fileExtension = file.name.split('.').pop()?.toUpperCase() || '';
    if (!allowedFormats.includes(fileExtension)) {
      setValidationError(`Invalid file format. Allowed formats: ${allowedFormats.join(', ')}`);
      return false;
    }

    setValidationError('');
    return true;
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (!validateFile(file)) {
      onFileSelect(null);
      return;
    }

    setSelectedFile(file);
    onFileSelect(file);

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreview(null);
    setValidationError('');
    onFileSelect(null);
  };

  const displayError = error || validationError;

  return (
    <div className="w-full">
      <div className="flex items-center gap-1 mb-2">
        <label className={`text-sm font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
          {label}
        </label>
        {required && <span className="text-red-500">*</span>}
      </div>

      {description && (
        <p className={`text-xs mb-2 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
          {description}
        </p>
      )}

      {!selectedFile ? (
        <div
          className={`relative border-2 border-dashed rounded-lg p-6 transition-colors cursor-pointer ${
            displayError
              ? isDark
                ? 'border-red-500/50 bg-red-500/10'
                : 'border-red-300 bg-red-50'
              : isDark
              ? 'border-slate-600 bg-slate-800/30 hover:border-slate-500'
              : 'border-slate-300 bg-slate-50 hover:border-slate-400'
          }`}
        >
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            required={required}
          />
          <div className="flex flex-col items-center justify-center text-center pointer-events-none">
            <Upload size={32} className={`mb-2 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
            <p className={`font-semibold ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
              Click to upload or drag and drop
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
              {allowedFormats.join(', ')} up to {maxSize}MB
            </p>
          </div>
        </div>
      ) : (
        <div className={`rounded-lg p-4 transition-colors ${
          isDark ? 'bg-slate-800 border border-slate-700' : 'bg-slate-100 border border-slate-200'
        }`}>
          <div className="flex items-start gap-3">
            {preview ? (
              <img src={preview} alt="Preview" className="w-16 h-16 rounded object-cover" />
            ) : (
              <div className={`w-16 h-16 rounded flex items-center justify-center ${
                isDark ? 'bg-slate-700' : 'bg-slate-200'
              }`}>
                <Upload size={24} className={isDark ? 'text-slate-400' : 'text-slate-500'} />
              </div>
            )}

            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <p className={`font-semibold truncate ${isDark ? 'text-slate-200' : 'text-slate-900'}`}>
                  {selectedFile.name}
                </p>
                <Check size={18} className="text-green-500 flex-shrink-0" />
              </div>
              <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                {(selectedFile.size / 1024).toFixed(2)} KB
              </p>
            </div>

            <button
              type="button"
              onClick={handleRemove}
              className={`p-1 rounded transition-colors ${
                isDark 
                  ? 'hover:bg-slate-700 text-slate-400 hover:text-slate-200' 
                  : 'hover:bg-slate-200 text-slate-600 hover:text-slate-900'
              }`}
              aria-label="Remove file"
            >
              <X size={20} />
            </button>
          </div>
        </div>
      )}

      {displayError && (
        <div className={`flex items-center gap-2 mt-2 p-2 rounded text-sm ${
          isDark 
            ? 'bg-red-500/10 text-red-400' 
            : 'bg-red-50 text-red-600'
        }`}>
          <AlertCircle size={16} className="flex-shrink-0" />
          <span>{displayError}</span>
        </div>
      )}

      {hint && (
        <p className={`text-xs mt-2 ${isDark ? 'text-slate-500' : 'text-slate-600'}`}>
          {hint}
        </p>
      )}
    </div>
  );
};
