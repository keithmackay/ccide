/**
 * Unit tests for data models
 */

import { describe, it, expect } from 'vitest';
import {
  Message,
  LLMConfig,
  Settings,
  Project,
  AnalyticsSummary,
  EncryptionKeyInfo,
} from '@types/models';
import {
  createMockMessage,
  createMockProject,
  createMockLLMConfig,
} from '../../fixtures/data';

describe('Data Models', () => {
  describe('Message', () => {
    it('should create a valid message object', () => {
      const message: Message = createMockMessage({
        id: 1,
        projectId: 'test-project',
        userMessage: 'Hello',
        llmResponse: 'Hi there!',
      });

      expect(message).toMatchObject({
        id: 1,
        projectId: 'test-project',
        userMessage: 'Hello',
        llmResponse: 'Hi there!',
        status: 'success',
      });
      expect(message.timestamp).toBeDefined();
      expect(message.tokens).toBeGreaterThan(0);
      expect(message.model).toBeDefined();
    });

    it('should support error status', () => {
      const message: Message = createMockMessage({
        status: 'error',
      });

      expect(message.status).toBe('error');
    });

    it('should have optional id', () => {
      const message: Omit<Message, 'id'> = {
        timestamp: Date.now(),
        projectId: 'test',
        userMessage: 'test',
        llmResponse: 'test',
        tokens: 100,
        model: 'test',
        status: 'success',
      };

      expect(message.id).toBeUndefined();
    });
  });

  describe('LLMConfig', () => {
    it('should create a valid LLM config', () => {
      const config: LLMConfig = createMockLLMConfig({
        provider: 'anthropic',
        modelName: 'claude-3-opus',
        apiKey: 'sk-test-123',
        isDefault: true,
      });

      expect(config).toMatchObject({
        provider: 'anthropic',
        modelName: 'claude-3-opus',
        apiKey: 'sk-test-123',
        isDefault: true,
      });
      expect(config.id).toBeDefined();
    });

    it('should support different providers', () => {
      const anthropicConfig = createMockLLMConfig({ provider: 'anthropic' });
      const openaiConfig = createMockLLMConfig({ provider: 'openai' });
      const customConfig = createMockLLMConfig({ provider: 'custom' });

      expect(anthropicConfig.provider).toBe('anthropic');
      expect(openaiConfig.provider).toBe('openai');
      expect(customConfig.provider).toBe('custom');
    });

    it('should have optional parameters', () => {
      const config: LLMConfig = {
        id: 'test',
        provider: 'anthropic',
        modelName: 'test',
        apiKey: 'test',
        isDefault: false,
        maxTokens: 4096,
        temperature: 0.7,
      };

      expect(config.maxTokens).toBe(4096);
      expect(config.temperature).toBe(0.7);
    });
  });

  describe('Project', () => {
    it('should create a valid project', () => {
      const project: Project = createMockProject({
        name: 'Test Project',
        status: 'active',
        path: '/test/path',
      });

      expect(project).toMatchObject({
        name: 'Test Project',
        status: 'active',
        path: '/test/path',
      });
      expect(project.id).toBeDefined();
      expect(project.createdAt).toBeDefined();
      expect(project.updatedAt).toBeDefined();
    });

    it('should support active and archived status', () => {
      const activeProject = createMockProject({ status: 'active' });
      const archivedProject = createMockProject({ status: 'archived' });

      expect(activeProject.status).toBe('active');
      expect(archivedProject.status).toBe('archived');
    });

    it('should have optional description and tags', () => {
      const project: Project = {
        id: 'test',
        name: 'Test',
        status: 'active',
        createdAt: Date.now(),
        updatedAt: Date.now(),
        path: '/test',
        description: 'A test project',
        tags: ['test', 'example'],
      };

      expect(project.description).toBe('A test project');
      expect(project.tags).toEqual(['test', 'example']);
    });
  });

  describe('Settings', () => {
    it('should create valid settings object', () => {
      const settings: Settings = {
        llmConfigs: [createMockLLMConfig()],
        preferences: {
          theme: 'dark',
          autoSave: true,
        },
        lastUpdated: Date.now(),
      };

      expect(settings.llmConfigs).toHaveLength(1);
      expect(settings.preferences.theme).toBe('dark');
      expect(settings.preferences.autoSave).toBe(true);
      expect(settings.lastUpdated).toBeDefined();
    });

    it('should support different themes', () => {
      const themes: Array<'light' | 'dark' | 'auto'> = ['light', 'dark', 'auto'];

      themes.forEach((theme) => {
        const settings: Settings = {
          llmConfigs: [],
          preferences: {
            theme,
            autoSave: true,
          },
          lastUpdated: Date.now(),
        };

        expect(settings.preferences.theme).toBe(theme);
      });
    });

    it('should support encrypted data', () => {
      const settings: Settings = {
        llmConfigs: [],
        preferences: {
          theme: 'dark',
          autoSave: true,
        },
        encryptedData: 'encrypted-string-here',
        lastUpdated: Date.now(),
      };

      expect(settings.encryptedData).toBe('encrypted-string-here');
    });
  });

  describe('AnalyticsSummary', () => {
    it('should create valid analytics summary', () => {
      const summary: AnalyticsSummary = {
        totalMessages: 100,
        totalTokens: 50000,
        projectBreakdown: [
          {
            projectId: 'proj1',
            projectName: 'Project 1',
            messageCount: 60,
            tokenCount: 30000,
          },
        ],
        modelUsage: [
          {
            model: 'claude-3-opus',
            count: 80,
            tokens: 40000,
          },
        ],
        dateRange: {
          start: Date.now() - 86400000,
          end: Date.now(),
        },
      };

      expect(summary.totalMessages).toBe(100);
      expect(summary.totalTokens).toBe(50000);
      expect(summary.projectBreakdown).toHaveLength(1);
      expect(summary.modelUsage).toHaveLength(1);
      expect(summary.dateRange.start).toBeLessThan(summary.dateRange.end);
    });
  });

  describe('EncryptionKeyInfo', () => {
    it('should create valid encryption key info', () => {
      const keyInfo: EncryptionKeyInfo = {
        salt: 'random-salt',
        iv: 'random-iv',
      };

      expect(keyInfo.salt).toBe('random-salt');
      expect(keyInfo.iv).toBe('random-iv');
    });
  });
});
