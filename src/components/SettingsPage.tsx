/**
 * Settings Page Component for CCIDE
 * Manages LLM configurations, API keys (encrypted), and user preferences
 */

import React, { useState, useEffect } from 'react';
import { getSettingsService } from '../services/SettingsService';
import { StoredLLMConfig, Settings } from '../types/models';

interface SettingsPageProps {
  onClose?: () => void;
}

export const SettingsPage: React.FC<SettingsPageProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'account' | 'llm' | 'about'>('account');
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

  const settingsService = getSettingsService();

  useEffect(() => {
    loadSettings();
  }, []);

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
    } catch (err) {
      setError('Invalid password');
    }
  };

  const handleAddLLMConfig = async () => {
    try {
      setError('');

      // Validation
      if (!newLLMConfig.modelName || !newLLMConfig.apiKey) {
        setError('Model name and API key are required');
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
      setSuccess('LLM configuration added successfully');
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

  const handleUpdatePreferences = async (updates: Partial<Settings['preferences']>) => {
    try {
      setError('');
      await settingsService.updatePreferences(updates);
      await loadSettings();
      setSuccess('Preferences updated successfully');
    } catch (err) {
      setError('Failed to update preferences');
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
      <h2>Account Settings</h2>

      {!isPasswordSet && (
        <div className="password-setup">
          <h3>Set Up Encryption Password</h3>
          <p>Create a password to encrypt your API keys and sensitive settings.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password (min 8 characters)"
            className="input-field"
          />
          <button onClick={handleSetPassword} className="btn btn-primary">
            Set Password
          </button>
        </div>
      )}

      {isPasswordSet && !isUnlocked && (
        <div className="password-unlock">
          <h3>Unlock Settings</h3>
          <p>Enter your password to view and modify encrypted settings.</p>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            className="input-field"
          />
          <button onClick={handleUnlock} className="btn btn-primary">
            Unlock
          </button>
        </div>
      )}

      {isUnlocked && (
        <div className="account-info">
          <h3>Account Information</h3>
          <p>Settings are encrypted and stored locally in your browser.</p>
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
      <h2>LLM Configuration</h2>

      {!isUnlocked && (
        <p className="warning">Please unlock settings to manage LLM configurations.</p>
      )}

      {isUnlocked && (
        <>
          <div className="llm-configs">
            <h3>Configured Models</h3>
            {settings?.llmConfigs && settings.llmConfigs.length > 0 ? (
              <ul className="config-list">
                {settings.llmConfigs.map((config) => (
                  <li key={config.id} className="config-item">
                    <div className="config-info">
                      <strong>{config.modelName}</strong>
                      <span className="provider">{config.provider}</span>
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
              <p>No LLM configurations added yet.</p>
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
            <div className="add-llm-form">
              <h3>Add LLM Configuration</h3>

              <label>
                Provider:
                <select
                  value={newLLMConfig.provider}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, provider: e.target.value as any })
                  }
                  className="input-field"
                >
                  <option value="anthropic">Anthropic (Claude)</option>
                  <option value="openai">OpenAI</option>
                  <option value="custom">Custom</option>
                </select>
              </label>

              <label>
                Model Name:
                <input
                  type="text"
                  value={newLLMConfig.modelName || ''}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, modelName: e.target.value })
                  }
                  placeholder="e.g., claude-sonnet-4-5-20250929"
                  className="input-field"
                />
              </label>

              <label>
                API Key:
                <input
                  type="password"
                  value={newLLMConfig.apiKey || ''}
                  onChange={(e) =>
                    setNewLLMConfig({ ...newLLMConfig, apiKey: e.target.value })
                  }
                  placeholder="Enter API key"
                  className="input-field"
                />
              </label>

              <label>
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
                  className="input-field"
                />
              </label>

              <label>
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
                  className="input-field"
                />
              </label>

              <label className="checkbox-label">
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
      <h2>About CCIDE</h2>
      <div className="about-content">
        <h3>Claude Code IDE</h3>
        <p>Version 1.0.0</p>
        <p>
          A web-based IDE designed for seamless interaction with Large Language Models,
          featuring project management, analytics, and encrypted settings storage.
        </p>

        <h3>Features</h3>
        <ul>
          <li>Project-based conversation management</li>
          <li>Analytics tracking for all LLM interactions</li>
          <li>Encrypted API key storage using Web Crypto API</li>
          <li>Local browser-based database (IndexedDB)</li>
          <li>Support for multiple LLM providers</li>
        </ul>

        <h3>Data Storage</h3>
        <p>
          All data is stored locally in your browser using IndexedDB. API keys are
          encrypted using AES-GCM encryption with PBKDF2 key derivation.
        </p>

        <h3>Privacy</h3>
        <p>
          Your data never leaves your device. All encryption and storage happens
          client-side in your browser.
        </p>
      </div>
    </div>
  );

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>Settings</h1>
        {onClose && (
          <button onClick={onClose} className="btn-close">
            ×
          </button>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="settings-tabs">
        <button
          className={`tab ${activeTab === 'account' ? 'active' : ''}`}
          onClick={() => setActiveTab('account')}
        >
          Account
        </button>
        <button
          className={`tab ${activeTab === 'llm' ? 'active' : ''}`}
          onClick={() => setActiveTab('llm')}
        >
          LLM Configuration
        </button>
        <button
          className={`tab ${activeTab === 'about' ? 'active' : ''}`}
          onClick={() => setActiveTab('about')}
        >
          About
        </button>
      </div>

      <div className="settings-content">
        {activeTab === 'account' && renderAccountSection()}
        {activeTab === 'llm' && renderLLMSection()}
        {activeTab === 'about' && renderAboutSection()}
      </div>

      <style>{`
        .settings-page {
          max-width: 800px;
          margin: 0 auto;
          padding: 2rem;
        }

        .settings-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 2rem;
        }

        .btn-close {
          font-size: 2rem;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          width: 2rem;
          height: 2rem;
        }

        .settings-tabs {
          display: flex;
          gap: 1rem;
          border-bottom: 2px solid #e0e0e0;
          margin-bottom: 2rem;
        }

        .tab {
          padding: 0.75rem 1.5rem;
          background: none;
          border: none;
          cursor: pointer;
          border-bottom: 3px solid transparent;
          transition: all 0.2s;
        }

        .tab.active {
          border-bottom-color: #007bff;
          font-weight: bold;
        }

        .settings-section {
          margin-bottom: 2rem;
        }

        .input-field {
          width: 100%;
          padding: 0.5rem;
          margin: 0.5rem 0 1rem;
          border: 1px solid #ddd;
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
          background: #007bff;
          color: white;
        }

        .btn-secondary {
          background: #6c757d;
          color: white;
        }

        .btn-danger {
          background: #dc3545;
          color: white;
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
          border: 1px solid #ddd;
          border-radius: 4px;
          margin-bottom: 0.5rem;
        }

        .config-info {
          display: flex;
          gap: 1rem;
          align-items: center;
        }

        .provider {
          color: #666;
          font-size: 0.875rem;
        }

        .badge {
          background: #28a745;
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
          background: #f8d7da;
          color: #721c24;
        }

        .alert-success {
          background: #d4edda;
          color: #155724;
        }

        .warning {
          color: #856404;
          background: #fff3cd;
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
