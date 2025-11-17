import React, { useState } from 'react';

interface ChangePasswordDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (oldPassword: string, newPassword: string) => Promise<void>;
  username: string;
}

export default function ChangePasswordDialog({
  open,
  onClose,
  onConfirm,
  username,
}: ChangePasswordDialogProps) {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!oldPassword || !newPassword || !confirmPassword) {
      setError('All fields are required');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (oldPassword === newPassword) {
      setError('New password must be different from old password');
      return;
    }

    setIsLoading(true);

    try {
      await onConfirm(oldPassword, newPassword);
      // Success - dialog will be closed by parent
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setError('');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-gray-700">
        <h2 className="text-xl font-bold text-gray-100 mb-4">Change Password</h2>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              disabled
              className="w-full px-3 py-2 bg-gray-700 text-gray-400 border border-gray-600 rounded focus:outline-none cursor-not-allowed"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={oldPassword}
              onChange={(e) => {
                setOldPassword(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder="Enter current password"
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              autoComplete="current-password"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder="Enter new password (min 8 characters)"
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              autoComplete="new-password"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder="Re-enter new password"
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
              autoComplete="new-password"
            />
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700 rounded text-red-300 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-4 py-2 bg-gray-700 text-gray-200 rounded hover:bg-gray-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
