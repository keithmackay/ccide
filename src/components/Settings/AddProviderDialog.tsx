import React, { useState } from 'react';

interface AddProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (config: {
    username: string;
    password: string;
    provider: string;
    apiKey: string;
    modelName: string;
    isDefault: boolean;
    endpoint?: string;
  }) => Promise<void>;
  username: string;
}

const AddProviderDialog: React.FC<AddProviderDialogProps> = ({
  open,
  onClose,
  onAdd,
  username,
}) => {
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'custom'>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [endpoint, setEndpoint] = useState('');
  const [error, setError] = useState('');
  const [isAdding, setIsAdding] = useState(false);

  const providerModels = {
    anthropic: [
      'claude-sonnet-4-5-20250929',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    openai: [
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    custom: [],
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add LLM Provider</h2>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            disabled
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as any);
              setModelName('');
            }}
            className="form-control"
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="model">Model</label>
          {provider === 'custom' ? (
            <input
              id="model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="form-control"
              placeholder="Enter model name"
              required
            />
          ) : (
            <select
              id="model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select model</option>
              {providerModels[provider].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
        </div>

        {provider === 'custom' && (
          <div className="form-group">
            <label htmlFor="endpoint">Custom Endpoint</label>
            <input
              id="endpoint"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="form-control"
              placeholder="https://api.example.com"
            />
          </div>
        )}

        <div className="form-group">
          <label htmlFor="setAsDefault">
            <input
              id="setAsDefault"
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            {' '}Use as default
          </label>
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={isAdding}>
            Cancel
          </button>
          <button
            onClick={async () => {
              setError('');
              setIsAdding(true);
              try {
                await onAdd({
                  username,
                  password: password.trim(),
                  provider,
                  apiKey: apiKey.trim(),
                  modelName,
                  isDefault,
                  endpoint: provider === 'custom' ? endpoint : undefined,
                });
                onClose();
              } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to add provider');
              } finally {
                setIsAdding(false);
              }
            }}
            className="btn btn-primary"
            disabled={!password || !apiKey || !modelName || isAdding}
          >
            {isAdding ? 'Adding...' : 'Add Provider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProviderDialog;
