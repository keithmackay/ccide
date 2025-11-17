import React, { useState, useEffect, useRef } from 'react';
import { Lock, AlertCircle, Clock } from 'lucide-react';
import { getAccountService } from '../../services/AccountService';

interface ReauthModalProps {
  isOpen: boolean;
  onSuccess: (password: string) => void;
  onCancel?: () => void;
  message?: string;
}

export const ReauthModal: React.FC<ReauthModalProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  message = 'Your session has expired due to inactivity. Please re-enter your password to continue.',
}) => {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef<HTMLInputElement>(null);

  // Focus password input when modal opens
  useEffect(() => {
    if (isOpen && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [isOpen]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setPassword('');
      setError('');
      setIsLoading(false);
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const accountService = getAccountService();

      // Verify password
      const isValid = await accountService.verifyPasswordOnly(password);

      if (!isValid) {
        setError('Invalid password');
        setIsLoading(false);
        return;
      }

      // Password is valid - pass it to parent
      onSuccess(password);

      // Clear password from local state
      setPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed');
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    if (onCancel) {
      setPassword('');
      setError('');
      onCancel();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md p-6 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="flex items-center justify-center w-12 h-12 rounded-full bg-yellow-600/20">
            <Clock className="w-6 h-6 text-yellow-500" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Session Expired</h2>
            <p className="text-sm text-gray-400">Re-authentication required</p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-6">
          <p className="text-sm text-gray-300">{message}</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Password Input */}
          <div>
            <label
              htmlFor="reauth-password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                ref={passwordInputRef}
                id="reauth-password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter your password"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-900/30 border border-red-500 rounded-md">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <p className="text-sm text-red-200">{error}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex gap-3">
            <button
              type="submit"
              disabled={isLoading || !password}
              className="flex-1 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              {isLoading ? 'Verifying...' : 'Continue'}
            </button>
            {onCancel && (
              <button
                type="button"
                onClick={handleCancel}
                disabled={isLoading}
                className="flex-1 py-2.5 px-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
              >
                Cancel
              </button>
            )}
          </div>
        </form>

        {/* Security Notice */}
        <div className="mt-4 pt-4 border-t border-gray-700">
          <p className="text-xs text-gray-500 text-center">
            For security, sessions expire after 30 minutes of conversation inactivity.
          </p>
        </div>
      </div>
    </div>
  );
};
