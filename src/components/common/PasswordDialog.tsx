import React, { useState, useEffect, useRef } from 'react';
import { Eye, EyeOff, Lock, X } from 'lucide-react';
import { cn } from '../../utils/cn';

export interface PasswordDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string, remember: boolean) => void;
  error?: string;
  title?: string;
  description?: string;
  showRememberOption?: boolean;
}

export const PasswordDialog: React.FC<PasswordDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  error,
  title = 'Enter Password',
  description = 'Your password is required to decrypt your API keys and settings.',
  showRememberOption = true,
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberForSession, setRememberForSession] = useState(false);
  const [validationError, setValidationError] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setValidationError('');
      // Small delay to ensure modal is rendered
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  const validatePassword = (pwd: string): boolean => {
    if (!pwd) {
      setValidationError('Password is required');
      return false;
    }
    if (pwd.length < 8) {
      setValidationError('Password must be at least 8 characters');
      return false;
    }
    setValidationError('');
    return true;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(password)) {
      return;
    }

    onSubmit(password, rememberForSession);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    // Clear validation error when user starts typing
    if (validationError) {
      setValidationError('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 border border-gray-700"
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-600 bg-opacity-20 rounded-lg">
              <Lock className="w-5 h-5 text-blue-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-100">{title}</h2>
              <p className="text-sm text-gray-400 mt-1">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-300 transition-colors"
            aria-label="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <input
                ref={inputRef}
                id="password"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={handlePasswordChange}
                className={cn(
                  'w-full px-4 py-2 pr-10 bg-gray-900 border rounded-lg text-gray-200',
                  'placeholder-gray-500 focus:outline-none focus:ring-2',
                  error || validationError
                    ? 'border-red-500 focus:ring-red-500'
                    : 'border-gray-700 focus:ring-blue-500'
                )}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-300 transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>

            {/* Error Messages */}
            {(validationError || error) && (
              <p className="mt-2 text-sm text-red-400">
                {validationError || error}
              </p>
            )}
          </div>

          {/* Remember Checkbox */}
          {showRememberOption && (
            <div className="flex items-start">
              <input
                id="remember"
                type="checkbox"
                checked={rememberForSession}
                onChange={(e) => setRememberForSession(e.target.checked)}
                className="mt-1 w-4 h-4 bg-gray-900 border-gray-700 rounded text-blue-600 focus:ring-2 focus:ring-blue-500"
              />
              <label
                htmlFor="remember"
                className="ml-2 text-sm text-gray-300"
              >
                Remember for this session
                <span className="block text-xs text-gray-500 mt-1">
                  Password will be cleared when you close this tab
                </span>
              </label>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!password}
            >
              Unlock
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
