import React, { useState } from 'react';

interface ChangeDefaultModelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  currentDefault: {
    provider: string;
    model: string;
  };
  newDefault: {
    provider: string;
    model: string;
  };
}

const ChangeDefaultModelDialog: React.FC<ChangeDefaultModelDialogProps> = ({
  open,
  onClose,
  onConfirm,
  currentDefault,
  newDefault,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setIsChanging(true);

    try {
      await onConfirm(username.trim(), password.trim());
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsChanging(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Change Default Model</h2>

        <div className="change-summary">
          <div className="current-default">
            <strong>Current default:</strong>
            <p>{currentDefault.provider} ({currentDefault.model})</p>
          </div>
          <div className="arrow">→</div>
          <div className="new-default">
            <strong>New default:</strong>
            <p>{newDefault.provider} ({newDefault.model})</p>
          </div>
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
          <button onClick={onClose} className="btn btn-secondary" disabled={isChanging}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={!username || !password || isChanging}
          >
            {isChanging ? 'Changing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeDefaultModelDialog;
