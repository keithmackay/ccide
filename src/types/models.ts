/**
 * Data models for CCIDE application
 */

/**
 * Message record stored in analytics database
 * Tracks all LLM interactions with project context
 */
export interface Message {
  id?: number;
  timestamp: number;
  projectId: string;
  userMessage: string;
  llmResponse: string;
  tokens: number;
  model: string;
  status: 'success' | 'error';
}

/**
 * Stored LLM Configuration
 * Extends base LLMConfig for persistent storage with additional metadata
 */
export interface StoredLLMConfig {
  id: string;
  provider: 'anthropic' | 'openai' | 'custom';
  modelName: string;
  apiKey: string;
  isDefault: boolean;
  maxTokens?: number;
  temperature?: number;
  endpoint?: string;
}

/**
 * User Settings
 * Encrypted storage for sensitive configuration
 */
export interface Settings {
  id?: number;
  llmConfigs: StoredLLMConfig[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    defaultModel?: string;
    autoSave: boolean;
  };
  encryptedData?: string;
  lastUpdated: number;
}

/**
 * Project metadata
 * Tracks project state and information
 */
export interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
  path: string;
  description?: string;
  tags?: string[];
}

/**
 * Analytics summary data
 */
export interface AnalyticsSummary {
  totalMessages: number;
  totalTokens: number;
  projectBreakdown: {
    projectId: string;
    projectName: string;
    messageCount: number;
    tokenCount: number;
  }[];
  modelUsage: {
    model: string;
    count: number;
    tokens: number;
  }[];
  dateRange: {
    start: number;
    end: number;
  };
}

/**
 * Encryption key metadata
 */
export interface EncryptionKeyInfo {
  salt: string;
  iv: string;
}

/**
 * Project File
 * Represents a file stored within a project's folder structure
 */
export interface ProjectFile {
  id: string;
  projectId: string;
  fileName: string;
  folder: string;
  path: string;
  content: string;
  fileType: string;
  size: number;
  createdAt: number;
  updatedAt: number;
  metadata?: {
    purpose?: string;
    tags?: string[];
    description?: string;
  };
}

/**
 * Project Folder
 * Represents a folder within a project's structure
 */
export interface ProjectFolder {
  id: string;
  projectId: string;
  name: string;
  path: string;
  createdAt: number;
  fileCount?: number;
}
