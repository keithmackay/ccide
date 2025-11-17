import React, { useState } from 'react';

interface ConfirmDeleteProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  providerName: string;
  modelName: string;
}

const ConfirmDeleteProviderDialog: React.FC<ConfirmDeleteProviderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  providerName,
  modelName,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await onConfirm(username.trim(), password.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Confirm Deletion</h2>

        <div className="warning-message">
          <p>Are you sure you want to delete this provider configuration?</p>
          <p><strong>{providerName}</strong> ({modelName})</p>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => {
              setUsername(e.target.value);
              setError('');
            }}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            className="form-control"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={isDeleting}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={!username || !password || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Provider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteProviderDialog;
