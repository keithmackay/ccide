/**
 * Settings Service for CCIDE
 * Handles encrypted storage of API keys and user settings using Web Crypto API
 */

import { Settings, StoredLLMConfig, EncryptionKeyInfo } from '../types/models';
import { getDatabase, STORES } from './Database';

const ENCRYPTION_ALGORITHM = 'AES-GCM';
const KEY_LENGTH = 256;
const SETTINGS_ID = 1; // Single settings record

export class SettingsService {
  private db = getDatabase();
  private encryptionKey: CryptoKey | null = null;

  constructor() {
    this.init();
  }

  /**
   * Initialize the service
   */
  private async init(): Promise<void> {
    await this.db.init();
  }

  /**
   * Generate a cryptographic key from a password
   */
  private async deriveKey(
    password: string,
    salt: Uint8Array
  ): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const passwordBuffer = encoder.encode(password);

    // Import password as key material
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      passwordBuffer,
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Derive encryption key using PBKDF2
    return await crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: ENCRYPTION_ALGORITHM, length: KEY_LENGTH },
      false,
      ['encrypt', 'decrypt']
    );
  }

  /**
   * Encrypt data using Web Crypto API
   */
  private async encrypt(
    data: string,
    password: string
  ): Promise<{ encrypted: string; keyInfo: EncryptionKeyInfo }> {
    // Generate random salt and IV
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));

    // Derive encryption key
    const key = await this.deriveKey(password, salt);

    // Encrypt data
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    const encryptedBuffer = await crypto.subtle.encrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      dataBuffer
    );

    // Convert to base64 for storage
    const encryptedArray = new Uint8Array(encryptedBuffer);
    const encrypted = btoa(String.fromCharCode(...encryptedArray));
    const saltBase64 = btoa(String.fromCharCode(...salt));
    const ivBase64 = btoa(String.fromCharCode(...iv));

    return {
      encrypted,
      keyInfo: {
        salt: saltBase64,
        iv: ivBase64,
      },
    };
  }

  /**
   * Decrypt data using Web Crypto API
   */
  private async decrypt(
    encrypted: string,
    password: string,
    keyInfo: EncryptionKeyInfo
  ): Promise<string> {
    // Decode from base64
    const encryptedArray = Uint8Array.from(atob(encrypted), (c) =>
      c.charCodeAt(0)
    );
    const salt = Uint8Array.from(atob(keyInfo.salt), (c) => c.charCodeAt(0));
    const iv = Uint8Array.from(atob(keyInfo.iv), (c) => c.charCodeAt(0));

    // Derive decryption key
    const key = await this.deriveKey(password, salt);

    // Decrypt data
    const decryptedBuffer = await crypto.subtle.decrypt(
      {
        name: ENCRYPTION_ALGORITHM,
        iv: iv,
      },
      key,
      encryptedArray
    );

    // Convert back to string
    const decoder = new TextDecoder();
    return decoder.decode(decryptedBuffer);
  }

  /**
   * Get current settings
   */
  async getSettings(password?: string): Promise<Settings | null> {
    const settings = await this.db.get<Settings>(STORES.SETTINGS, SETTINGS_ID);

    if (!settings) {
      return null;
    }

    // If encrypted data exists and password provided, decrypt it
    if (settings.encryptedData && password) {
      try {
        const keyInfo: EncryptionKeyInfo = JSON.parse(
          settings.encryptedData
        ).keyInfo;
        const encryptedContent = JSON.parse(settings.encryptedData).encrypted;
        const decrypted = await this.decrypt(encryptedContent, password, keyInfo);
        const decryptedSettings = JSON.parse(decrypted);

        // Merge decrypted LLM configs
        settings.llmConfigs = decryptedSettings.llmConfigs || [];
      } catch (error) {
        console.error('Failed to decrypt settings:', error);
        throw new Error('Invalid password or corrupted settings');
      }
    }

    return settings;
  }

  /**
   * Save settings with encryption
   */
  async saveSettings(
    settings: Partial<Settings>,
    password?: string
  ): Promise<void> {
    const currentSettings = await this.getSettings(password);

    const newSettings: Settings = {
      id: SETTINGS_ID,
      llmConfigs: settings.llmConfigs || currentSettings?.llmConfigs || [],
      preferences: {
        theme: settings.preferences?.theme || currentSettings?.preferences?.theme || 'auto',
        defaultModel: settings.preferences?.defaultModel || currentSettings?.preferences?.defaultModel,
        autoSave: settings.preferences?.autoSave ?? currentSettings?.preferences?.autoSave ?? true,
      },
      lastUpdated: Date.now(),
    };

    // Encrypt sensitive data if password provided
    if (password && newSettings.llmConfigs.length > 0) {
      const sensitiveData = {
        llmConfigs: newSettings.llmConfigs,
      };
      const { encrypted, keyInfo } = await this.encrypt(
        JSON.stringify(sensitiveData),
        password
      );
      newSettings.encryptedData = JSON.stringify({ encrypted, keyInfo });

      // Remove plain API keys from storage
      newSettings.llmConfigs = newSettings.llmConfigs.map(config => ({
        ...config,
        apiKey: '***ENCRYPTED***',
      }));
    }

    await this.db.update(STORES.SETTINGS, newSettings);
  }

  /**
   * Add or update an LLM configuration
   */
  async addLLMConfig(config: StoredLLMConfig, password?: string): Promise<void> {
    const settings = await this.getSettings(password);
    const llmConfigs = settings?.llmConfigs || [];

    // Check if config already exists
    const existingIndex = llmConfigs.findIndex((c) => c.id === config.id);
    if (existingIndex >= 0) {
      llmConfigs[existingIndex] = config;
    } else {
      llmConfigs.push(config);
    }

    // If this is set as default, unset others
    if (config.isDefault) {
      llmConfigs.forEach((c) => {
        if (c.id !== config.id) {
          c.isDefault = false;
        }
      });
    }

    await this.saveSettings({ llmConfigs }, password);
  }

  /**
   * Remove an LLM configuration
   */
  async removeLLMConfig(configId: string, password?: string): Promise<void> {
    const settings = await this.getSettings(password);
    const llmConfigs = settings?.llmConfigs.filter((c) => c.id !== configId) || [];
    await this.saveSettings({ llmConfigs }, password);
  }

  /**
   * Get all LLM configurations
   */
  async getLLMConfigs(password?: string): Promise<StoredLLMConfig[]> {
    const settings = await this.getSettings(password);
    return settings?.llmConfigs || [];
  }

  /**
   * Get the default LLM configuration
   */
  async getDefaultLLMConfig(password?: string): Promise<StoredLLMConfig | null> {
    const configs = await this.getLLMConfigs(password);
    return configs.find((c) => c.isDefault) || configs[0] || null;
  }

  /**
   * Update preferences
   */
  async updatePreferences(
    preferences: Partial<Settings['preferences']>
  ): Promise<void> {
    const settings = await this.getSettings();
    await this.saveSettings({
      preferences: {
        ...settings?.preferences,
        ...preferences,
      } as Settings['preferences'],
    });
  }

  /**
   * Get preferences
   */
  async getPreferences(): Promise<Settings['preferences']> {
    const settings = await this.getSettings();
    return (
      settings?.preferences || {
        theme: 'auto',
        autoSave: true,
      }
    );
  }

  /**
   * Validate password
   */
  async validatePassword(password: string): Promise<boolean> {
    try {
      await this.getSettings(password);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Change encryption password
   */
  async changePassword(
    oldPassword: string,
    newPassword: string
  ): Promise<void> {
    // Decrypt with old password
    const settings = await this.getSettings(oldPassword);
    if (!settings) {
      throw new Error('No settings found');
    }

    // Re-encrypt with new password
    await this.saveSettings(settings, newPassword);
  }

  /**
   * Clear all settings
   */
  async clearSettings(): Promise<void> {
    await this.db.delete(STORES.SETTINGS, SETTINGS_ID);
  }

  /**
   * Export settings (without sensitive data)
   */
  async exportSettings(): Promise<string> {
    const settings = await this.getSettings();
    if (!settings) {
      return JSON.stringify({});
    }

    // Remove sensitive data
    const exportData = {
      preferences: settings.preferences,
      llmConfigs: settings.llmConfigs.map((config) => ({
        id: config.id,
        provider: config.provider,
        modelName: config.modelName,
        isDefault: config.isDefault,
        // API key not included
      })),
    };

    return JSON.stringify(exportData, null, 2);
  }
}

// Singleton instance
let settingsInstance: SettingsService | null = null;

/**
 * Get the settings service instance
 */
export function getSettingsService(): SettingsService {
  if (!settingsInstance) {
    settingsInstance = new SettingsService();
  }
  return settingsInstance;
}
