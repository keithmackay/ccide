import React, { useState } from 'react';

interface DeleteAccountDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  username: string;
}

export default function DeleteAccountDialog({
  open,
  onClose,
  onConfirm,
  username,
}: DeleteAccountDialogProps) {
  const [enteredUsername, setEnteredUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmText, setConfirmText] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const CONFIRM_TEXT = 'DELETE';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validation
    if (!enteredUsername || !password) {
      setError('Username and password are required');
      return;
    }

    if (enteredUsername !== username) {
      setError('Username does not match');
      return;
    }

    if (confirmText !== CONFIRM_TEXT) {
      setError(`Please type "${CONFIRM_TEXT}" to confirm`);
      return;
    }

    setIsLoading(true);

    try {
      await onConfirm(enteredUsername, password);
      // Success - dialog will be closed by parent
      setEnteredUsername('');
      setPassword('');
      setConfirmText('');
      setError('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setEnteredUsername('');
      setPassword('');
      setConfirmText('');
      setError('');
      onClose();
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 max-w-md w-full border border-red-700">
        <h2 className="text-xl font-bold text-red-400 mb-4">⚠️ Delete Account</h2>

        <div className="mb-6 p-4 bg-red-900/20 border border-red-700 rounded">
          <p className="text-red-300 text-sm mb-2 font-semibold">Warning: This action cannot be undone!</p>
          <p className="text-gray-300 text-sm">
            Deleting your account will permanently remove:
          </p>
          <ul className="text-gray-300 text-sm mt-2 ml-4 list-disc space-y-1">
            <li>All encrypted API keys and LLM configurations</li>
            <li>All conversation history</li>
            <li>All projects and associated data</li>
            <li>Your account credentials</li>
          </ul>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Username
            </label>
            <input
              type="text"
              value={enteredUsername}
              onChange={(e) => {
                setEnteredUsername(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder={`Enter "${username}" to confirm`}
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              autoComplete="username"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder="Enter your password"
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              autoComplete="current-password"
            />
          </div>

          <div className="mb-4">
            <label className="block text-gray-300 text-sm font-medium mb-2">
              Type <span className="font-mono bg-gray-700 px-2 py-1 rounded">{CONFIRM_TEXT}</span> to confirm
            </label>
            <input
              type="text"
              value={confirmText}
              onChange={(e) => {
                setConfirmText(e.target.value);
                setError('');
              }}
              disabled={isLoading}
              placeholder={`Type "${CONFIRM_TEXT}"`}
              className="w-full px-3 py-2 bg-gray-900 text-gray-100 border border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50"
              autoComplete="off"
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
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Deleting...' : 'Delete Account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
