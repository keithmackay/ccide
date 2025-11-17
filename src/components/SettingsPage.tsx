/**
 * Settings Page Component for CCIDE
 * Manages LLM configurations, API keys (encrypted), and user preferences
 */

import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { getSettingsService } from '../services/SettingsService';
import { getAccountService } from '../services/AccountService';
import { clearConfigCache } from '../services/SettingsHelper';
import { StoredLLMConfig, Settings } from '../types/models';
import { useAppStore } from '../stores/appStore';
import { usePasswordSession } from '../hooks/usePasswordSession';
import { LLMModel } from '../types/ui';
import AddProviderDialog from './Settings/AddProviderDialog';
import ConfirmDeleteProviderDialog from './Settings/ConfirmDeleteProviderDialog';
import ChangeDefaultModelDialog from './Settings/ChangeDefaultModelDialog';
import ChangePasswordDialog from './Settings/ChangePasswordDialog';
import DeleteAccountDialog from './Settings/DeleteAccountDialog';

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
  const [availableModels, setLocalAvailableModels] = useState<{ id: string; name: string }[]>([]);

  // Dialog state
  const [showAddProvider, setShowAddProvider] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{id: string, provider: string, model: string} | null>(null);
  const [changeDefaultTarget, setChangeDefaultTarget] = useState<{id: string, provider: string, model: string} | null>(null);
  const [providers, setProviders] = useState<StoredLLMConfig[]>([]);
  const [currentUsername, setCurrentUsername] = useState('');
  const [showChangePassword, setShowChangePassword] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);

  const settingsService = getSettingsService();
  const accountService = getAccountService();
  const setAppAvailableModels = useAppStore((state) => (state as any).setAvailableModels);
  const setSelectedModel = useAppStore((state) => state.setSelectedModel);
  const { password: sessionPassword, setPassword: setSessionPassword } = usePasswordSession();

  useEffect(() => {
    loadSettings();
    loadUsername();
  }, []);

  useEffect(() => {
    if (sessionPassword) {
      loadProviders();
    }
  }, [sessionPassword]);

  // Update available models when provider changes
  useEffect(() => {
    if (newLLMConfig.provider) {
      setLocalAvailableModels(PROVIDER_MODELS[newLLMConfig.provider] || []);
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

      // Store password in session (30 min timeout)
      setSessionPassword(password, true);

      // Load models into app state
      if (loadedSettings?.llmConfigs && loadedSettings.llmConfigs.length > 0) {
        // Convert to app models format and update store
        const models: LLMModel[] = loadedSettings.llmConfigs.map(config => ({
          id: config.id,
          name: config.modelName,
          provider: config.provider,
          contextWindow: config.maxTokens || 200000,
        }));

        setAppAvailableModels(models);

        // Set the default model
        const defaultConfig = loadedSettings.llmConfigs.find(c => c.isDefault);
        if (defaultConfig) {
          const defaultModel = models.find(m => m.id === defaultConfig.id);
          if (defaultModel) {
            setSelectedModel(defaultModel);
          }
        } else if (models.length > 0) {
          const firstModel = models[0];
          if (firstModel) {
            setSelectedModel(firstModel);
          }
        }
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

      // Refresh app state with updated models
      const updatedSettings = await settingsService.getSettings(password);
      if (updatedSettings?.llmConfigs && updatedSettings.llmConfigs.length > 0) {
        const models: LLMModel[] = updatedSettings.llmConfigs.map(c => ({
          id: c.id,
          name: c.modelName,
          provider: c.provider,
          contextWindow: c.maxTokens || 200000,
        }));

        setAppAvailableModels(models);

        // If this is the default or the first model, select it
        if (config.isDefault) {
          const newModel = models.find(m => m.id === config.id);
          if (newModel) {
            setSelectedModel(newModel);
          }
        }
      }

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

      // Store password in session
      setSessionPassword(password, true);

      setSuccess('Password set successfully');
    } catch (err) {
      setError('Failed to set password');
    }
  };

  const handleChangePassword = async (oldPassword: string, newPassword: string) => {
    try {
      await accountService.changePassword(currentUsername, oldPassword, newPassword);

      // Update session with new password
      setSessionPassword(newPassword, true);

      setShowChangePassword(false);
      setSuccess('Password changed successfully');

      // Note: User will need to re-encrypt settings with new password if they want to
      // For now, existing encrypted data remains with old password
    } catch (error) {
      console.error('Failed to change password:', error);
      throw error; // Re-throw to let dialog show error
    }
  };

  const handleDeleteAccount = async (username: string, password: string) => {
    try {
      await accountService.deleteAccount(username, password);

      // Clear session
      setSessionPassword('', false);

      // Clear state
      setSettings(null);
      setProviders([]);
      setIsUnlocked(false);
      setIsPasswordSet(false);

      setShowDeleteAccount(false);
      setSuccess('Account deleted successfully. All data has been removed.');

      // Reload page after a delay
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      console.error('Failed to delete account:', error);
      throw error; // Re-throw to let dialog show error
    }
  };

  const loadUsername = async () => {
    const account = await accountService.getAccount();
    if (account) {
      setCurrentUsername(account.username);
    }
  };

  const loadProviders = async () => {
    if (!sessionPassword) return;

    try {
      const configs = await settingsService.getLLMConfigs(sessionPassword);
      setProviders(configs);
    } catch (error) {
      console.error('Failed to load providers:', error);
    }
  };

  const handleAddProvider = async (config: {
    username: string;
    password: string;
    provider: string;
    apiKey: string;
    modelName: string;
    isDefault: boolean;
    endpoint?: string;
  }) => {
    try {
      // Verify credentials
      const loginResult = await accountService.login(config.username, config.password);
      if (!loginResult) {
        throw new Error('Invalid username or password');
      }

      // Store password in session
      setSessionPassword(config.password, true);

      // Generate unique ID
      const id = crypto.randomUUID();

      // Create config
      const newConfig: StoredLLMConfig = {
        id,
        provider: config.provider as any,
        modelName: config.modelName,
        apiKey: config.apiKey,
        isDefault: config.isDefault,
        endpoint: config.endpoint,
      };

      // Add to settings
      await settingsService.addLLMConfig(newConfig, config.password);

      // Clear config cache
      clearConfigCache();

      // Reload providers
      await loadProviders();

      setShowAddProvider(false);
      setSuccess('Provider added successfully');
    } catch (error) {
      console.error('Failed to add provider:', error);
      throw error;
    }
  };

  const handleDeleteProvider = async (username: string, password: string) => {
    if (!deleteTarget) return;

    try {
      // Verify credentials
      const verified = await accountService.verifyPasswordOnly(password);
      if (!verified) {
        throw new Error('Invalid password');
      }

      // Delete provider
      await settingsService.removeLLMConfig(deleteTarget.id, password);

      // Clear config cache
      clearConfigCache();

      // Reload providers
      await loadProviders();

      // Check if deleted was default
      const wasDefault = providers.find(p => p.id === deleteTarget.id)?.isDefault;
      if (wasDefault && providers.length > 1) {
        setSuccess('Default provider deleted. Please select a new default.');
      } else {
        setSuccess('Provider deleted successfully');
      }

      setDeleteTarget(null);
    } catch (error) {
      console.error('Failed to delete provider:', error);
      throw error;
    }
  };

  const handleChangeDefault = async (username: string, password: string) => {
    if (!changeDefaultTarget) return;

    try {
      // Verify credentials
      const verified = await accountService.verifyPasswordOnly(password);
      if (!verified) {
        throw new Error('Invalid password');
      }

      // Update isDefault flags
      const updatedProviders = providers.map(p => ({
        ...p,
        isDefault: p.id === changeDefaultTarget.id,
      }));

      // Save all configs
      await settingsService.saveLLMConfigs(updatedProviders, password);

      // Clear config cache
      clearConfigCache();

      // Reload providers
      await loadProviders();

      setChangeDefaultTarget(null);
      setSuccess('Default model changed successfully');
    } catch (error) {
      console.error('Failed to change default:', error);
      throw error;
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
        <div className="account-actions bg-gray-800 p-4 rounded-lg border border-gray-700">
          <h3 className="text-gray-200 text-lg font-medium mb-4">Account Management</h3>
          <div className="flex flex-col gap-3">
            <button
              onClick={() => setShowChangePassword(true)}
              className="btn btn-primary"
            >
              Change Password
            </button>
            <button
              onClick={() => setShowDeleteAccount(true)}
              className="btn btn-danger"
            >
              Delete Account
            </button>
          </div>
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
          <button
            onClick={() => setShowAddProvider(true)}
            className="btn btn-primary mb-6"
          >
            Add Provider
          </button>

          <div className="provider-list space-y-3">
            {providers && providers.length > 0 ? (
              providers.map(provider => (
                <div key={provider.id} className="provider-card bg-gray-800 p-4 rounded-lg border border-gray-700 flex items-center justify-between">
                  <div className="provider-info flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-gray-100 font-semibold">{provider.provider}</h3>
                      {provider.isDefault && <span className="badge bg-green-600 text-white px-2 py-1 rounded text-xs">Default</span>}
                    </div>
                    <p className="text-gray-300 text-sm mt-1">{provider.modelName}</p>
                  </div>
                  <div className="provider-actions flex gap-2">
                    {!provider.isDefault && (
                      <button
                        onClick={() => setChangeDefaultTarget({
                          id: provider.id,
                          provider: provider.provider,
                          model: provider.modelName,
                        })}
                        className="btn btn-secondary btn-small"
                      >
                        Set as Default
                      </button>
                    )}
                    <button
                      onClick={() => setDeleteTarget({
                        id: provider.id,
                        provider: provider.provider,
                        model: provider.modelName,
                      })}
                      className="btn btn-danger btn-small"
                      title="Delete provider"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-300">No providers configured yet. Click "Add Provider" to get started.</p>
            )}
          </div>
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

      {/* Dialogs */}
      <AddProviderDialog
        open={showAddProvider}
        onClose={() => setShowAddProvider(false)}
        onAdd={handleAddProvider}
        username={currentUsername}
      />

      <ConfirmDeleteProviderDialog
        open={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDeleteProvider}
        providerName={deleteTarget?.provider || ''}
        modelName={deleteTarget?.model || ''}
      />

      <ChangeDefaultModelDialog
        open={changeDefaultTarget !== null}
        onClose={() => setChangeDefaultTarget(null)}
        onConfirm={handleChangeDefault}
        currentDefault={
          providers.find(p => p.isDefault)
            ? { provider: providers.find(p => p.isDefault)!.provider, model: providers.find(p => p.isDefault)!.modelName }
            : { provider: '', model: '' }
        }
        newDefault={
          changeDefaultTarget
            ? { provider: changeDefaultTarget.provider, model: changeDefaultTarget.model }
            : { provider: '', model: '' }
        }
      />

      <ChangePasswordDialog
        open={showChangePassword}
        onClose={() => setShowChangePassword(false)}
        onConfirm={handleChangePassword}
        username={currentUsername}
      />

      <DeleteAccountDialog
        open={showDeleteAccount}
        onClose={() => setShowDeleteAccount(false)}
        onConfirm={handleDeleteAccount}
        username={currentUsername}
      />
    </div>
  );
};
