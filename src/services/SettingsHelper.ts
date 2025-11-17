/**
 * Settings Helper Utilities
 * Provides high-level functions for settings management with caching
 */

import { getSettingsService } from './SettingsService';
import { StoredLLMConfig } from '../types/models';

/**
 * Cache for decrypted configurations
 * Improves performance by avoiding repeated decryption
 */
class ConfigCache {
  private cache: Map<string, { config: StoredLLMConfig; timestamp: number }> =
    new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  set(modelId: string, config: StoredLLMConfig): void {
    this.cache.set(modelId, {
      config,
      timestamp: Date.now(),
    });
  }

  get(modelId: string): StoredLLMConfig | null {
    const cached = this.cache.get(modelId);
    if (!cached) return null;

    // Check if cache is still valid
    if (Date.now() - cached.timestamp > this.CACHE_TTL) {
      this.cache.delete(modelId);
      return null;
    }

    return cached.config;
  }

  clear(): void {
    this.cache.clear();
  }

  clearModel(modelId: string): void {
    this.cache.delete(modelId);
  }
}

const configCache = new ConfigCache();

/**
 * Get active model configuration with decrypted API key
 */
export async function getActiveModelConfig(
  modelId: string,
  password: string
): Promise<StoredLLMConfig | null> {
  try {
    // Check cache first
    const cached = configCache.get(modelId);
    if (cached) {
      return cached;
    }

    // Get from settings service
    const settingsService = getSettingsService();
    const configs = await settingsService.getLLMConfigs(password);

    // Find the requested model
    const config = configs.find((c) => c.id === modelId);
    if (!config) {
      return null;
    }

    // Cache the result
    configCache.set(modelId, config);

    return config;
  } catch (error) {
    console.error('Failed to get model config:', error);
    return null;
  }
}

/**
 * Get default model configuration with decrypted API key
 */
export async function getDefaultModelConfig(
  password: string
): Promise<StoredLLMConfig | null> {
  try {
    const settingsService = getSettingsService();
    const defaultConfig = await settingsService.getDefaultLLMConfig(password);

    if (defaultConfig) {
      configCache.set(defaultConfig.id, defaultConfig);
    }

    return defaultConfig;
  } catch (error) {
    console.error('Failed to get default model config:', error);
    return null;
  }
}

/**
 * Validate password by attempting to decrypt settings
 */
export async function validatePassword(password: string): Promise<boolean> {
  try {
    if (!password || password.length < 8) {
      return false;
    }

    const settingsService = getSettingsService();
    return await settingsService.validatePassword(password);
  } catch (error) {
    console.error('Password validation failed:', error);
    return false;
  }
}

/**
 * Check if settings have encrypted data
 */
export async function hasEncryptedSettings(): Promise<boolean> {
  try {
    const settingsService = getSettingsService();
    const settings = await settingsService.getSettings();
    return !!settings?.encryptedData;
  } catch (error) {
    console.error('Failed to check encrypted settings:', error);
    return false;
  }
}

/**
 * Get all available models (metadata only, no API keys)
 */
export async function getAvailableModels(): Promise<
  Array<{
    id: string;
    provider: string;
    modelName: string;
    isDefault: boolean;
  }>
> {
  try {
    const settingsService = getSettingsService();
    const settings = await settingsService.getSettings();

    if (!settings?.llmConfigs) {
      return [];
    }

    return settings.llmConfigs.map((config) => ({
      id: config.id,
      provider: config.provider,
      modelName: config.modelName,
      isDefault: config.isDefault,
    }));
  } catch (error) {
    console.error('Failed to get available models:', error);
    return [];
  }
}

/**
 * Clear the configuration cache
 * Should be called when password changes or settings are updated
 */
export function clearConfigCache(): void {
  configCache.clear();
}

/**
 * Clear cache for specific model
 */
export function clearModelCache(modelId: string): void {
  configCache.clearModel(modelId);
}

/**
 * Quick password check without full decryption
 * Uses a lightweight validation approach
 */
export async function quickPasswordCheck(password: string): Promise<boolean> {
  try {
    if (!password || password.length < 8) {
      return false;
    }

    const settingsService = getSettingsService();
    const settings = await settingsService.getSettings();

    // If no encrypted data, password is not needed
    if (!settings?.encryptedData) {
      return true;
    }

    // Try to decrypt - this will throw if password is wrong
    await settingsService.getSettings(password);
    return true;
  } catch (error) {
    return false;
  }
}

/**
 * Get settings lock status
 */
export async function getSettingsLockStatus(): Promise<{
  isLocked: boolean;
  hasSettings: boolean;
  modelCount: number;
}> {
  try {
    const settingsService = getSettingsService();
    const settings = await settingsService.getSettings();

    if (!settings) {
      return {
        isLocked: false,
        hasSettings: false,
        modelCount: 0,
      };
    }

    const hasEncrypted = !!settings.encryptedData;
    const modelCount = settings.llmConfigs?.length || 0;

    return {
      isLocked: hasEncrypted,
      hasSettings: true,
      modelCount,
    };
  } catch (error) {
    console.error('Failed to get settings lock status:', error);
    return {
      isLocked: false,
      hasSettings: false,
      modelCount: 0,
    };
  }
}
