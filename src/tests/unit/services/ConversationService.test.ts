/**
 * ConversationService Tests
 * Tests for conversation persistence and analytics
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ConversationService,
  estimateTokens,
  calculateConversationTokens,
  getConversationService,
} from '../../../services/ConversationService';
import { Message } from '../../../types/models';
import * as Database from '../../../services/Database';

// Mock the Database module
vi.mock('../../../services/Database', () => {
  const mockDb = {
    init: vi.fn().mockResolvedValue(undefined),
    add: vi.fn(),
    get: vi.fn(),
    getAll: vi.fn(),
    getByIndex: vi.fn(),
    update: vi.fn(),
    delete: vi.fn(),
    clear: vi.fn(),
    count: vi.fn(),
    query: vi.fn(),
    close: vi.fn(),
  };

  return {
    Database: vi.fn(() => mockDb),
    getDatabase: vi.fn(() => mockDb),
    STORES: {
      MESSAGES: 'messages',
      SETTINGS: 'settings',
      PROJECTS: 'projects',
    },
  };
});

describe('ConversationService', () => {
  let service: ConversationService;
  let mockDb: any;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = Database.getDatabase();
    service = new ConversationService();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Token Estimation', () => {
    it('should estimate tokens correctly', () => {
      const text = 'This is a test message';
      const tokens = estimateTokens(text);
      // ~4 characters per token
      expect(tokens).toBe(Math.ceil(text.length / 4));
    });

    it('should handle empty strings', () => {
      expect(estimateTokens('')).toBe(0);
    });

    it('should handle long texts', () => {
      const longText = 'a'.repeat(1000);
      const tokens = estimateTokens(longText);
      expect(tokens).toBe(250); // 1000 / 4
    });

    it('should calculate conversation tokens', () => {
      const userMessage = 'Hello, how are you?';
      const llmResponse = 'I am doing well, thank you for asking!';
      const result = calculateConversationTokens(userMessage, llmResponse);

      expect(result.inputTokens).toBe(Math.ceil(userMessage.length / 4));
      expect(result.outputTokens).toBe(Math.ceil(llmResponse.length / 4));
      expect(result.totalTokens).toBe(result.inputTokens + result.outputTokens);
    });
  });

  describe('Message Persistence', () => {
    it('should save a message successfully', async () => {
      const message: Omit<Message, 'id'> = {
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Hello',
        llmResponse: 'Hi there!',
        tokens: 10,
        model: 'claude-3',
        status: 'success',
      };

      mockDb.add.mockResolvedValue(123);

      const id = await service.saveMessage(message);

      expect(id).toBe(123);
      expect(mockDb.add).toHaveBeenCalledWith(Database.STORES.MESSAGES, message);
    });

    it('should handle save errors gracefully', async () => {
      const message: Omit<Message, 'id'> = {
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Hello',
        llmResponse: 'Hi there!',
        tokens: 10,
        model: 'claude-3',
        status: 'success',
      };

      mockDb.add.mockRejectedValue(new Error('Database error'));

      const id = await service.saveMessage(message);

      expect(id).toBe(-1);
    });
  });

  describe('Conversation History', () => {
    it('should retrieve conversation history for a project', async () => {
      const messages: Message[] = [
        {
          id: 1,
          timestamp: 1000,
          projectId: 'project-1',
          userMessage: 'Message 1',
          llmResponse: 'Response 1',
          tokens: 10,
          model: 'claude-3',
          status: 'success',
        },
        {
          id: 2,
          timestamp: 2000,
          projectId: 'project-1',
          userMessage: 'Message 2',
          llmResponse: 'Response 2',
          tokens: 15,
          model: 'claude-3',
          status: 'success',
        },
      ];

      mockDb.getByIndex.mockResolvedValue(messages);

      const history = await service.getConversationHistory('project-1');

      expect(history).toEqual(messages);
      expect(mockDb.getByIndex).toHaveBeenCalledWith(
        Database.STORES.MESSAGES,
        'projectId',
        'project-1'
      );
    });

    it('should sort messages by timestamp', async () => {
      const messages: Message[] = [
        {
          id: 2,
          timestamp: 2000,
          projectId: 'project-1',
          userMessage: 'Message 2',
          llmResponse: 'Response 2',
          tokens: 15,
          model: 'claude-3',
          status: 'success',
        },
        {
          id: 1,
          timestamp: 1000,
          projectId: 'project-1',
          userMessage: 'Message 1',
          llmResponse: 'Response 1',
          tokens: 10,
          model: 'claude-3',
          status: 'success',
        },
      ];

      mockDb.getByIndex.mockResolvedValue(messages);

      const history = await service.getConversationHistory('project-1');

      expect(history[0].timestamp).toBe(1000);
      expect(history[1].timestamp).toBe(2000);
    });

    it('should handle errors when fetching history', async () => {
      mockDb.getByIndex.mockRejectedValue(new Error('Database error'));

      const history = await service.getConversationHistory('project-1');

      expect(history).toEqual([]);
    });

    it('should get recent messages with limit', async () => {
      const messages: Message[] = Array.from({ length: 100 }, (_, i) => ({
        id: i + 1,
        timestamp: (i + 1) * 1000,
        projectId: 'project-1',
        userMessage: `Message ${i + 1}`,
        llmResponse: `Response ${i + 1}`,
        tokens: 10,
        model: 'claude-3',
        status: 'success' as const,
      }));

      mockDb.getByIndex.mockResolvedValue(messages);

      const recentMessages = await service.getRecentMessages('project-1', 10);

      expect(recentMessages).toHaveLength(10);
      expect(recentMessages[0].id).toBe(91); // Last 10 messages
      expect(recentMessages[9].id).toBe(100);
    });
  });

  describe('Conversation Statistics', () => {
    it('should calculate stats for a project', async () => {
      const messages: Message[] = [
        {
          id: 1,
          timestamp: 1000,
          projectId: 'project-1',
          userMessage: 'Message 1',
          llmResponse: 'Response 1',
          tokens: 10,
          model: 'claude-3',
          status: 'success',
        },
        {
          id: 2,
          timestamp: 2000,
          projectId: 'project-1',
          userMessage: 'Message 2',
          llmResponse: 'Response 2',
          tokens: 20,
          model: 'gpt-4',
          status: 'success',
        },
        {
          id: 3,
          timestamp: 3000,
          projectId: 'project-1',
          userMessage: 'Message 3',
          llmResponse: 'Error',
          tokens: 5,
          model: 'claude-3',
          status: 'error',
        },
      ];

      mockDb.getByIndex.mockResolvedValue(messages);

      const stats = await service.getMessageStats('project-1');

      expect(stats.totalMessages).toBe(3);
      expect(stats.totalTokens).toBe(35);
      expect(stats.successCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.avgTokensPerMessage).toBeCloseTo(35 / 3);
      expect(stats.modelBreakdown['claude-3']).toEqual({
        count: 2,
        tokens: 15,
      });
      expect(stats.modelBreakdown['gpt-4']).toEqual({
        count: 1,
        tokens: 20,
      });
    });

    it('should calculate stats for all projects', async () => {
      const messages: Message[] = [
        {
          id: 1,
          timestamp: 1000,
          projectId: 'project-1',
          userMessage: 'Message 1',
          llmResponse: 'Response 1',
          tokens: 10,
          model: 'claude-3',
          status: 'success',
        },
        {
          id: 2,
          timestamp: 2000,
          projectId: 'project-2',
          userMessage: 'Message 2',
          llmResponse: 'Response 2',
          tokens: 20,
          model: 'claude-3',
          status: 'success',
        },
      ];

      mockDb.getAll.mockResolvedValue(messages);

      const stats = await service.getMessageStats();

      expect(stats.totalMessages).toBe(2);
      expect(stats.totalTokens).toBe(30);
    });

    it('should handle empty conversation', async () => {
      mockDb.getByIndex.mockResolvedValue([]);

      const stats = await service.getMessageStats('project-1');

      expect(stats.totalMessages).toBe(0);
      expect(stats.totalTokens).toBe(0);
      expect(stats.avgTokensPerMessage).toBe(0);
      expect(stats.modelBreakdown).toEqual({});
    });
  });

  describe('Export Conversation', () => {
    const mockMessages: Message[] = [
      {
        id: 1,
        timestamp: 1000,
        projectId: 'project-1',
        userMessage: 'Hello',
        llmResponse: 'Hi there!',
        tokens: 10,
        model: 'claude-3',
        status: 'success',
      },
    ];

    it('should export conversation as JSON', async () => {
      mockDb.getByIndex.mockResolvedValue(mockMessages);

      const exported = await service.exportConversation('project-1', 'json');
      const parsed = JSON.parse(exported);

      expect(parsed.projectId).toBe('project-1');
      expect(parsed.messages).toEqual(mockMessages);
      expect(parsed.stats).toBeDefined();
      expect(parsed.exportedAt).toBeDefined();
    });

    it('should export conversation as Markdown', async () => {
      mockDb.getByIndex.mockResolvedValue(mockMessages);

      const exported = await service.exportConversation('project-1', 'markdown');

      expect(exported).toContain('# Conversation Export: project-1');
      expect(exported).toContain('## Statistics');
      expect(exported).toContain('Total Messages: 1');
      expect(exported).toContain('**User:**');
      expect(exported).toContain('**Assistant:**');
    });

    it('should throw error on export failure', async () => {
      mockDb.getByIndex.mockRejectedValue(new Error('Database error'));

      try {
        await service.exportConversation('project-1', 'json');
        // If we get here, the test should fail
        expect(true).toBe(false);
      } catch (error: any) {
        expect(error.message).toContain('Database error');
      }
    });
  });

  describe('Delete Operations', () => {
    it('should delete conversation history for a project', async () => {
      const messages: Message[] = [
        {
          id: 1,
          timestamp: 1000,
          projectId: 'project-1',
          userMessage: 'Message 1',
          llmResponse: 'Response 1',
          tokens: 10,
          model: 'claude-3',
          status: 'success',
        },
        {
          id: 2,
          timestamp: 2000,
          projectId: 'project-1',
          userMessage: 'Message 2',
          llmResponse: 'Response 2',
          tokens: 15,
          model: 'claude-3',
          status: 'success',
        },
      ];

      mockDb.getByIndex.mockResolvedValue(messages);
      mockDb.delete.mockResolvedValue(undefined);

      await service.deleteConversationHistory('project-1');

      expect(mockDb.delete).toHaveBeenCalledTimes(2);
      expect(mockDb.delete).toHaveBeenCalledWith(Database.STORES.MESSAGES, 1);
      expect(mockDb.delete).toHaveBeenCalledWith(Database.STORES.MESSAGES, 2);
    });

    it('should clear all conversations', async () => {
      mockDb.clear.mockResolvedValue(undefined);

      await service.clearAllConversations();

      expect(mockDb.clear).toHaveBeenCalledWith(Database.STORES.MESSAGES);
    });
  });

  describe('Search Functionality', () => {
    const messages: Message[] = [
      {
        id: 1,
        timestamp: 1000,
        projectId: 'project-1',
        userMessage: 'How do I write a function in TypeScript?',
        llmResponse: 'Here is how to write a function in TypeScript...',
        tokens: 50,
        model: 'claude-3',
        status: 'success',
      },
      {
        id: 2,
        timestamp: 2000,
        projectId: 'project-1',
        userMessage: 'What is React?',
        llmResponse: 'React is a JavaScript library for building user interfaces...',
        tokens: 40,
        model: 'claude-3',
        status: 'success',
      },
    ];

    it('should search messages by user content', async () => {
      mockDb.getByIndex.mockResolvedValue(messages);

      const results = await service.searchMessages('typescript', 'project-1');

      expect(results).toHaveLength(1);
      expect(results[0].userMessage).toContain('TypeScript');
    });

    it('should search messages by assistant content', async () => {
      mockDb.getByIndex.mockResolvedValue(messages);

      const results = await service.searchMessages('react', 'project-1');

      expect(results).toHaveLength(1);
      expect(results[0].llmResponse).toContain('React');
    });

    it('should be case insensitive', async () => {
      mockDb.getByIndex.mockResolvedValue(messages);

      const results = await service.searchMessages('TYPESCRIPT', 'project-1');

      expect(results).toHaveLength(1);
    });

    it('should search across all projects when projectId not provided', async () => {
      mockDb.getAll.mockResolvedValue(messages);

      const results = await service.searchMessages('function');

      expect(mockDb.getAll).toHaveBeenCalledWith(Database.STORES.MESSAGES);
      expect(results).toHaveLength(1);
    });

    it('should return empty array when no matches found', async () => {
      mockDb.getByIndex.mockResolvedValue(messages);

      const results = await service.searchMessages('nonexistent', 'project-1');

      expect(results).toEqual([]);
    });

    it('should handle search errors gracefully', async () => {
      mockDb.getByIndex.mockRejectedValue(new Error('Database error'));

      const results = await service.searchMessages('test', 'project-1');

      expect(results).toEqual([]);
    });
  });

  describe('Singleton Instance', () => {
    it('should return the same instance', () => {
      const instance1 = getConversationService();
      const instance2 = getConversationService();

      expect(instance1).toBe(instance2);
    });
  });
});
