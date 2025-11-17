import React, { useState } from 'react';
import { Lock, User, AlertCircle, CheckCircle, Shield } from 'lucide-react';
import { getAccountService } from '../../services/AccountService';

interface AccountSetupProps {
  onSetupComplete: (password: string) => void;
  onCancel?: () => void;
}

export const AccountSetup: React.FC<AccountSetupProps> = ({
  onSetupComplete,
  onCancel,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Password validation checks
  const passwordChecks = {
    length: password.length >= 8,
    match: password.length > 0 && password === confirmPassword,
  };

  const isPasswordValid = passwordChecks.length && passwordChecks.match;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validate username
    if (username.trim().length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }

    // Validate password
    if (!passwordChecks.length) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (!passwordChecks.match) {
      setError('Passwords do not match');
      return;
    }

    setIsLoading(true);

    try {
      const accountService = getAccountService();

      // Create account
      await accountService.createAccount(username, password);

      // Account created successfully - pass password to parent for immediate login
      onSetupComplete(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="w-full max-w-md p-8 space-y-6 bg-gray-800 rounded-lg shadow-2xl border border-gray-700">
        {/* Logo/Title */}
        <div className="text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 mb-4 rounded-full bg-green-600">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Create Account</h1>
          <p className="mt-2 text-sm text-gray-400">
            Set up your local CCIDE account
          </p>
        </div>

        {/* Setup Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username Input */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <User className="w-5 h-5 text-gray-500" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Choose a username"
                required
                autoComplete="username"
                autoFocus
                minLength={3}
              />
            </div>
            <p className="mt-1 text-xs text-gray-500">
              Minimum 3 characters
            </p>
          </div>

          {/* Password Input */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Choose a strong password"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          {/* Confirm Password Input */}
          <div>
            <label
              htmlFor="confirmPassword"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Confirm Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Lock className="w-5 h-5 text-gray-500" />
              </div>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="Re-enter your password"
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
          </div>

          {/* Password Requirements */}
          <div className="space-y-2 p-3 bg-gray-700/50 rounded-md">
            <p className="text-xs font-medium text-gray-300 mb-2">
              Password Requirements:
            </p>
            <div className="space-y-1">
              <PasswordCheck
                checked={passwordChecks.length}
                label="At least 8 characters"
              />
              <PasswordCheck
                checked={passwordChecks.match}
                label="Passwords match"
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

          {/* Create Account Button */}
          <button
            type="submit"
            disabled={isLoading || !isPasswordValid || username.trim().length < 3}
            className="w-full py-2.5 px-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-gray-800"
          >
            {isLoading ? 'Creating Account...' : 'Create Account'}
          </button>

          {/* Cancel Button (if provided) */}
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="w-full py-2.5 px-4 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-800"
            >
              Cancel
            </button>
          )}
        </form>

        {/* Security Notice */}
        <div className="pt-4 border-t border-gray-700">
          <div className="flex items-start gap-2">
            <Shield className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-xs text-gray-400">
                <strong className="text-gray-300">Security Notice:</strong>
                <br />
                Your password will be used to encrypt your API keys and settings.
                <br />
                All data is stored locally in your browser.
                <br />
                <strong className="text-red-400">
                  If you forget your password, you will lose access to your encrypted data.
                </strong>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper component for password check indicators
const PasswordCheck: React.FC<{ checked: boolean; label: string }> = ({
  checked,
  label,
}) => (
  <div className="flex items-center gap-2">
    {checked ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <div className="w-4 h-4 rounded-full border-2 border-gray-600" />
    )}
    <span className={`text-xs ${checked ? 'text-green-400' : 'text-gray-500'}`}>
      {label}
    </span>
  </div>
);
