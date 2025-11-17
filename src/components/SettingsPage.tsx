/**
 * Settings Page Component for CCIDE
 * Manages LLM configurations, API keys (encrypted), and user preferences
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSettingsService } from '../services/SettingsService';
import { StoredLLMConfig, Settings } from '../types/models';
import { useAppStore } from '../stores/appStore';

interface SettingsPageProps {
  onClose?: () => void;
}

// Provider to models mapping
const PROVIDER_MODELS: Record<string, { id: string; name: string }[]> = {
  anthropic: [
    { id: 'claude-sonnet-4-5-20250929', name: 'Claude 4.5 Sonnet (Latest)' },
    { id: 'claude-3-7-sonnet-20250219', name: 'Claude 3.7 Sonnet' },
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-5-haiku-20241022', name: 'Claude 3.5 Haiku' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
  ],
  openai: [
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-4', name: 'GPT-4' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
    { id: 'gpt-4o', name: 'GPT-4o' },
    { id: 'gpt-4o-mini', name: 'GPT-4o Mini' },
  ],
  custom: [],
};

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'llm' | 'about'>('llm');
  const [settings, setSettings] = useState<Settings | null>(null);
  const [password, setPassword] = useState('');
  const [isPasswordSet, setIsPasswordSet] = useState(false);
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // LLM Config form state
  const [showAddLLM, setShowAddLLM] = useState(false);
  const [newLLMConfig, setNewLLMConfig] = useState<Partial<StoredLLMConfig>>({
    provider: 'anthropic',
    isDefault: false,
  });
  const [availableModels, setAvailableModels] = useState<{ id: string; name: string }[]>([]);

  const settingsService = getSettingsService();
  const setAppAvailableModels = useAppStore((state) => state.setSelectedModel);

  useEffect(() => {
    loadSettings();
  }, []);

  // Update available models when provider changes
  useEffect(() => {
    if (newLLMConfig.provider) {
      setAvailableModels(PROVIDER_MODELS[newLLMConfig.provider] || []);
      // Reset model selection when provider changes
      setNewLLMConfig(prev => ({ ...prev, modelName: undefined }));
    }
  }, [newLLMConfig.provider]);

  const loadSettings = async () => {
    try {
      const loadedSettings = await settingsService.getSettings();
      setSettings(loadedSettings);
      setIsPasswordSet(!!loadedSettings?.encryptedData);
    } catch (err) {
      setError('Failed to load settings');
    }
  };

  const handleUnlock = async () => {
    try {
      setError('');
      const loadedSettings = await settingsService.getSettings(password);
      setSettings(loadedSettings);
      setIsUnlocked(true);
      setSuccess('Settings unlocked successfully');

      // Load models into app state
      if (loadedSettings?.llmConfigs) {
        // Convert to app models format and update store
        // This will be used by the conversation pane
      }
    } catch (err) {
      setError('Invalid password');
    }
  };

  const handleAddLLMConfig = async () => {
    try {
      setError('');

      // Validation
      if (!newLLMConfig.modelName || !newLLMConfig.apiKey) {
        setError('Model and API key are required');
        return;
      }

      if (!password) {
        setError('Password is required to encrypt API keys');
        return;
      }

      const config: StoredLLMConfig = {
        id: `${newLLMConfig.provider}-${Date.now()}`,
        provider: newLLMConfig.provider as any,
        modelName: newLLMConfig.modelName,
        apiKey: newLLMConfig.apiKey,
        isDefault: newLLMConfig.isDefault || false,
        maxTokens: newLLMConfig.maxTokens,
        temperature: newLLMConfig.temperature,
      };

      await settingsService.addLLMConfig(config, password);
      await loadSettings();

      // Reset form
      setNewLLMConfig({
        provider: 'anthropic',
        isDefault: false,
      });
      setShowAddLLM(false);
      setSuccess('LLM configuration added and encrypted successfully');
    } catch (err) {
      setError('Failed to add LLM configuration');
    }
  };

  const handleRemoveLLMConfig = async (configId: string) => {
    try {
      setError('');
      await settingsService.removeLLMConfig(configId, password);
      await loadSettings();
      setSuccess('LLM configuration removed successfully');
    } catch (err) {
      setError('Failed to remove LLM configuration');
    }
  };

  const handleSetPassword = async () => {
    try {
      setError('');
      if (password.length < 8) {
        setError('Password must be at least 8 characters');
        return;
      }

      await settingsService.saveSettings(settings || {}, password);
      setIsPasswordSet(true);
      setIsUnlocked(true);
      setSuccess('Password set successfully');
    } catch (err) {
      setError('Failed to set password');
    }
  };

  const renderAccountSection = () => (
    <div className="settings-section">
      <h2 className="text-gray-100 text-xl font-semibold mb-4">Account Settings</h2>

      {!isPasswordSet && (
        <div className="password-setup bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-200 text-lg font-medium mb-2">Set Up Encryption Password</h3>
          <p className="text-gray-300 mb-4">Create a password to encrypt your API keys and sensitive settings.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 8 characters)"
            className="input-field bg-gray-900 text-gray-100 border-gray-600"
          />
          <button onClick={handleSetPassword} className="btn btn-primary">
            Set Password
          </button>
        </div>
      )}

      {isPasswordSet && !isUnlocked && (
        <div className="password-unlock bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-200 text-lg font-medium mb-2">Unlock Settings</h3>
          <p className="text-gray-300 mb-4">Enter your password to view and modify encrypted settings.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input-field bg-gray-900 text-gray-100 border-gray-600"
          />
          <button onClick={handleUnlock} className="btn btn-primary">
            Unlock
          </button>
        </div>
      )}

      {isUnlocked && (
        <div className="account-info bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-200 text-lg font-medium mb-2">Account Information</h3>
          <p className="text-gray-300 mb-4">Settings are encrypted and stored locally in your browser.</p>
          <button
            onClick={async () => {
              const exported = await settingsService.exportSettings();
              const blob = new Blob([exported], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'ccide-settings.json';
              a.click();
            }}
            className="btn btn-secondary"
          >
            Export Settings
          </button>
        </div>
      )}
    </div>
  );

  const renderLLMSection = () => (
    <div className="settings-section">
      <h2 className="text-gray-100 text-xl font-semibold mb-4">LLM Configuration</h2>

      {!isUnlocked && (
        <p className="warning text-gray-200 bg-yellow-900/20 border border-yellow-700">
          Please unlock settings to manage LLM configurations.
        </p>
      )}

      {isUnlocked && (
        <>
          <div className="llm-configs mb-6">
            <h3 className="text-gray-200 text-lg font-medium mb-3">Configured Models</h3>
            {settings?.llmConfigs && settings.llmConfigs.length > 0 ? (
              <ul className="config-list space-y-2">
                {settings.llmConfigs.map((config) => (
                  <li key={config.id} className="config-item bg-gray-800 border-gray-700">
                    <div className="config-info">
                      <strong className="text-gray-100">{config.modelName}</strong>
                      <span className="provider text-gray-400">{config.provider}</span>
                      {config.isDefault && <span className="badge">Default</span>}
                    </div>
                    <button
                      onClick={() => handleRemoveLLMConfig(config.id)}
                      className="btn btn-danger btn-small"
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-300">No LLM configurations added yet.</p>
            )}
          </div>

          {!showAddLLM && (
            <button
              onClick={() => setShowAddLLM(true)}
              className="btn btn-primary"
            >
              Add LLM Configuration
            </button>
          )}

          {showAddLLM && (
            <div className="add-llm-form bg-gray-800 p-4 rounded-lg border border-gray-700">
              <h3 className="text-gray-200 text-lg font-medium mb-4">Add LLM Configuration</h3>

              <label className="text-gray-200">
                Provider:
                <select
                  value={newLLMConfig.provider}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, provider: e.target.value as any })
                  }
                  className="input-field bg-gray-900 text-gray-100 border-gray-600"
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label className="text-gray-200">
                Default Model:
                {newLLMConfig.provider !== 'custom' ? (
                  <select
                    value={newLLMConfig.modelName || ''}
                    onChange={(e) =>
                      setNewLLMConfig({ ...newLLMConfig, modelName: e.target.value })
                    }
                    className="input-field bg-gray-900 text-gray-100 border-gray-600"
                  >
                    <option value="">Select a model</option>
                    {availableModels.map((model) => (
                      <option key={model.id} value={model.id}>
                        {model.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    value={newLLMConfig.modelName || ''}
                    onChange={(e) =>
                      setNewLLMConfig({ ...newLLMConfig, modelName: e.target.value })
                    }
                    placeholder="Enter custom model name"
                    className="input-field bg-gray-900 text-gray-100 border-gray-600"
                  />
                )}
              </label>

              <label className="text-gray-200">
                API Key:
                <input
                  type="password"
                  value={newLLMConfig.apiKey || ''}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, apiKey: e.target.value })
                  }
                  placeholder="Enter API key"
                  className="input-field bg-gray-900 text-gray-100 border-gray-600"
                />
              </label>

              <label className="text-gray-200">
                Max Tokens (optional):
                <input
                  type="number"
                  value={newLLMConfig.maxTokens || ''}
                  onChange={(e) =>
                    setNewLLMConfig({
                      ...newLLMConfig,
                      maxTokens: parseInt(e.target.value) || undefined,
                    })
                  }
                  placeholder="e.g., 4096"
                  className="input-field bg-gray-900 text-gray-100 border-gray-600"
                />
              </label>

              <label className="text-gray-200">
                Temperature (optional):
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="2"
                  value={newLLMConfig.temperature || ''}
                  onChange={(e) =>
                    setNewLLMConfig({
                      ...newLLMConfig,
                      temperature: parseFloat(e.target.value) || undefined,
                    })
                  }
                  placeholder="e.g., 0.7"
                  className="input-field bg-gray-900 text-gray-100 border-gray-600"
                />
              </label>

              <label className="checkbox-label text-gray-200">
                <input
                  type="checkbox"
                  checked={newLLMConfig.isDefault || false}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, isDefault: e.target.checked })
                  }
                />
                Set as default model
              </label>

              <div className="form-actions">
                <button onClick={handleAddLLMConfig} className="btn btn-primary">
                  Add Configuration
                </button>
                <button
                  onClick={() => {
                    setShowAddLLM(false);
                    setNewLLMConfig({ provider: 'anthropic', isDefault: false });
                  }}
                  className="btn btn-secondary"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );

  const renderAboutSection = () => (
    <div className="settings-section">
      <h2 className="text-gray-100 text-xl font-semibold mb-4">About CCIDE</h2>
      <div className="about-content text-gray-300">
        <h3 className="text-gray-200 text-lg font-medium mb-2">Claude Code IDE</h3>
        <p className="mb-4">Version 1.0.0</p>
        <p className="mb-4">
          A web-based IDE designed for seamless interaction with Large Language Models,
          featuring project management, analytics, and encrypted settings storage.
        </p>

        <h3 className="text-gray-200 text-lg font-medium mb-2 mt-6">Features</h3>
        <ul className="list-disc list-inside space-y-1 mb-4">
          <li>Project-based conversation management</li>
          <li>Analytics tracking for all LLM interactions</li>
          <li>Encrypted API key storage using Web Crypto API</li>
          <li>Local browser-based database (IndexedDB)</li>
          <li>Support for multiple LLM providers</li>
        </ul>

        <h3 className="text-gray-200 text-lg font-medium mb-2 mt-6">Data Storage</h3>
        <p className="mb-4">
          All data is stored locally in your browser using IndexedDB. API keys are
          encrypted using AES-GCM encryption with PBKDF2 key derivation.
        </p>

        <h3 className="text-gray-200 text-lg font-medium mb-2 mt-6">Privacy</h3>
        <p>
          Your data never leaves your device. All encryption and storage happens
          client-side in your browser.
        </p>
      </div>
    </div>
  );

  return (
    <div className="settings-page h-full flex flex-col bg-gray-900">
      <div className="settings-header flex-shrink-0 flex items-center justify-between px-6 py-4 border-b border-gray-700">
        <h1 className="text-2xl font-bold text-gray-100">Settings</h1>
        {onClose && (
          <button
            onClick={onClose}
            className="btn-close p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            title="Close Settings"
          >
            <X className="w-6 h-6" />
          </button>
        )}
      </div>

      {error && <div className="alert alert-error mx-6 mt-4">{error}</div>}
      {success && <div className="alert alert-success mx-6 mt-4">{success}</div>}

      <div className="settings-tabs flex-shrink-0 flex gap-4 px-6 border-b border-gray-700">
        <button
          className={`tab ${activeTab === 'account' ? 'active' : ''} text-gray-300`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={`tab ${activeTab === 'llm' ? 'active' : ''} text-gray-300`}
          onClick={() => setActiveTab('llm')}
        >
          LLM Configuration
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''} text-gray-300`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="settings-content flex-1 overflow-y-auto px-6 py-6">
        {activeTab === 'account' && renderAccountSection()}
        {activeTab === 'llm' && renderLLMSection()}
        {activeTab === 'about' && renderAboutSection()}
      </div>

      <style>{`
        .settings-page {
          max-width: 100%;
        }

        .settings-section {
          max-width: 800px;
          margin: 0 auto;
        }

        .btn-close {
          font-size: 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
        }

        .settings-tabs {
          display: flex;
          gap: 1rem;
          margin-bottom: 0;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
          color: #d1d5db;
        }

        .tab:hover {
          color: #ffffff;
        }

        .tab.active {
          border-bottom-color: #3b82f6;
          font-weight: bold;
          color: #ffffff;
        }

        .input-field {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0 1rem;
          border: 1px solid #4b5563;
          border-radius: 4px;
        }

        .btn {
          padding: 0.5rem 1rem;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          margin-right: 0.5rem;
        }

        .btn-primary {
          background: #3b82f6;
          color: white;
        }

        .btn-primary:hover {
          background: #2563eb;
        }

        .btn-secondary {
          background: #6b7280;
          color: white;
        }

        .btn-secondary:hover {
          background: #4b5563;
        }

        .btn-danger {
          background: #dc2626;
          color: white;
        }

        .btn-danger:hover {
          background: #b91c1c;
        }

        .btn-small {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
        }

        .config-list {
          list-style: none;
          padding: 0;
        }

        .config-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1rem;
          border: 1px solid #374151;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .config-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .provider {
          color: #9ca3af;
          font-size: 0.875rem;
        }

        .badge {
          background: #059669;
          color: white;
          padding: 0.25rem 0.5rem;
          border-radius: 4px;
          font-size: 0.75rem;
        }

        .alert {
          padding: 1rem;
          border-radius: 4px;
          margin-bottom: 1rem;
        }

        .alert-error {
          background: #7f1d1d;
          color: #fecaca;
          border: 1px solid #991b1b;
        }

        .alert-success {
          background: #14532d;
          color: #bbf7d0;
          border: 1px solid #166534;
        }

        .warning {
          color: #fef3c7;
          background: #78350f;
          padding: 1rem;
          border-radius: 4px;
        }

        label {
          display: block;
          margin-bottom: 1rem;
          font-weight: bold;
        }

        .checkbox-label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-weight: normal;
        }

        .form-actions {
          margin-top: 1rem;
        }

        .about-content ul {
          line-height: 1.8;
        }
      `}</style>
    </div>
  );
};
