/**
 * Conversation Flow Integration Tests
 * Tests the complete conversation flow from user input to database persistence
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ConversationService } from '../../services/ConversationService';
import {
  ClaudeLLMService,
  initializeLLMService,
  getLLMService,
  resetLLMService,
} from '../../services/LLMService';
import { getSettingsService, SettingsService } from '../../services/SettingsService';
import { getDatabase } from '../../services/Database';
import { LLMConfig, LLMRequest } from '../../types/index.js';

// Mock fetch for LLM calls
global.fetch = vi.fn();

describe('Conversation Flow Integration', () => {
  let conversationService: ConversationService;
  let settingsService: SettingsService;
  let db: ReturnType<typeof getDatabase>;

  beforeEach(async () => {
    vi.clearAllMocks();
    conversationService = new ConversationService();
    settingsService = getSettingsService();
    db = getDatabase();
    await db.init();

    // Clear database
    await db.clear('messages');
    await db.clear('settings');

    resetLLMService();
  });

  afterEach(async () => {
    vi.clearAllMocks();
    await db.clear('messages');
    await db.clear('settings');
    resetLLMService();
  });

  describe('Complete Message Flow', () => {
    it('should handle complete conversation flow: Settings → LLM → Response → Database', async () => {
      // Step 1: Save LLM configuration
      const password = 'test-password';
      const llmConfig = {
        id: 'config-1',
        provider: 'anthropic' as const,
        modelName: 'claude-sonnet-4-5-20250929',
        apiKey: 'test-api-key',
        isDefault: true,
        maxTokens: 4096,
        temperature: 0.7,
      };

      await settingsService.addLLMConfig(llmConfig, password);

      // Step 2: Retrieve configuration
      const savedConfig = await settingsService.getDefaultLLMConfig(password);
      expect(savedConfig).toBeDefined();
      expect(savedConfig?.apiKey).toBe('test-api-key');

      // Step 3: Initialize LLM service
      const config: LLMConfig = {
        provider: savedConfig!.provider,
        model: savedConfig!.modelName,
        apiKey: savedConfig!.apiKey,
        maxTokens: savedConfig!.maxTokens,
        temperature: savedConfig!.temperature,
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Step 4: Mock LLM response
      const mockLLMResponse = {
        id: 'msg_123',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ text: 'Hello! I can help you with that.' }],
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
        stop_reason: 'end_turn',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockLLMResponse,
      });

      // Step 5: Send message to LLM
      const userMessage = 'Can you help me?';
      const request: LLMRequest = {
        messages: [{ role: 'user', content: userMessage }],
      };

      const llmResponse = await llmService.sendRequest(request);

      expect(llmResponse.text).toBe('Hello! I can help you with that.');
      expect(llmResponse.usage?.totalTokens).toBe(30);

      // Step 6: Save conversation to database
      const messageId = await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: userMessage,
        llmResponse: llmResponse.text,
        tokens: llmResponse.usage?.totalTokens || 0,
        model: config.model,
        status: 'success',
      });

      expect(messageId).toBeGreaterThan(0);

      // Step 7: Verify message was saved
      const history = await conversationService.getConversationHistory('project-1');
      expect(history).toHaveLength(1);
      expect(history[0].userMessage).toBe(userMessage);
      expect(history[0].llmResponse).toBe('Hello! I can help you with that.');
      expect(history[0].tokens).toBe(30);
    });

    it('should handle streaming conversation flow', async () => {
      // Setup LLM service
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3',
        apiKey: 'test-api-key',
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Mock streaming response
      const chunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n',
        'data: {"type":"content_block_delta","delta":{"text":" there!"}}\n',
        'data: [DONE]\n',
      ];

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(chunks[0]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(chunks[1]),
          })
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(chunks[2]),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      // Stream response
      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hi' }],
      };

      let fullResponse = '';
      for await (const chunk of llmService.streamRequest(request)) {
        fullResponse += chunk;
      }

      expect(fullResponse).toBe('Hello there!');

      // Save to database
      const messageId = await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Hi',
        llmResponse: fullResponse,
        tokens: 15,
        model: config.model,
        status: 'success',
      });

      expect(messageId).toBeGreaterThan(0);
    });
  });

  describe('Error Handling Flow', () => {
    it('should handle LLM API errors gracefully', async () => {
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3',
        apiKey: 'invalid-key',
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Mock API error
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      try {
        await llmService.sendRequest(request);
      } catch (error: any) {
        // Save error to database
        const messageId = await conversationService.saveMessage({
          timestamp: Date.now(),
          projectId: 'project-1',
          userMessage: 'Hello',
          llmResponse: error.message,
          tokens: 0,
          model: config.model,
          status: 'error',
        });

        expect(messageId).toBeGreaterThan(0);

        // Verify error was saved
        const history = await conversationService.getConversationHistory('project-1');
        expect(history[0].status).toBe('error');
        expect(history[0].llmResponse).toContain('Claude API error: 401');
      }
    });

    it('should handle database errors gracefully', async () => {
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3',
        apiKey: 'test-key',
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Mock successful LLM response
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await llmService.sendRequest(request);

      // Close database to simulate error
      db.close();

      // Try to save - should not throw
      const messageId = await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Hello',
        llmResponse: response.text,
        tokens: 20,
        model: config.model,
        status: 'success',
      });

      // Should return -1 on error
      expect(messageId).toBe(-1);
    });

    it('should handle invalid password for settings', async () => {
      const llmConfig = {
        id: 'config-1',
        provider: 'anthropic' as const,
        modelName: 'claude-3',
        apiKey: 'test-api-key',
        isDefault: true,
      };

      await settingsService.addLLMConfig(llmConfig, 'correct-password');

      // Try to retrieve with wrong password
      await expect(
        settingsService.getDefaultLLMConfig('wrong-password')
      ).rejects.toThrow();
    });
  });

  describe('Multi-message Conversation Flow', () => {
    it('should handle multi-turn conversation', async () => {
      const config: LLMConfig = {
        provider: 'anthropic',
        model: 'claude-3',
        apiKey: 'test-key',
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Turn 1
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Hi! How can I help you today?' }],
          usage: { input_tokens: 5, output_tokens: 15 },
        }),
      });

      const request1: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response1 = await llmService.sendRequest(request1);

      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Hello',
        llmResponse: response1.text,
        tokens: 20,
        model: config.model,
        status: 'success',
      });

      // Turn 2
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          content: [{ text: 'Sure! What do you need help with?' }],
          usage: { input_tokens: 25, output_tokens: 20 },
        }),
      });

      const request2: LLMRequest = {
        messages: [
          { role: 'user', content: 'Hello' },
          { role: 'assistant', content: response1.text },
          { role: 'user', content: 'I need help with TypeScript' },
        ],
      };

      const response2 = await llmService.sendRequest(request2);

      await conversationService.saveMessage({
        timestamp: Date.now() + 1000,
        projectId: 'project-1',
        userMessage: 'I need help with TypeScript',
        llmResponse: response2.text,
        tokens: 45,
        model: config.model,
        status: 'success',
      });

      // Verify conversation history
      const history = await conversationService.getConversationHistory('project-1');
      expect(history).toHaveLength(2);
      expect(history[0].userMessage).toBe('Hello');
      expect(history[1].userMessage).toBe('I need help with TypeScript');
    });

    it('should calculate conversation statistics correctly', async () => {
      // Add multiple messages
      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Message 1',
        llmResponse: 'Response 1',
        tokens: 100,
        model: 'claude-3',
        status: 'success',
      });

      await conversationService.saveMessage({
        timestamp: Date.now() + 1000,
        projectId: 'project-1',
        userMessage: 'Message 2',
        llmResponse: 'Response 2',
        tokens: 150,
        model: 'claude-3',
        status: 'success',
      });

      await conversationService.saveMessage({
        timestamp: Date.now() + 2000,
        projectId: 'project-1',
        userMessage: 'Message 3',
        llmResponse: 'Error',
        tokens: 50,
        model: 'gpt-4',
        status: 'error',
      });

      const stats = await conversationService.getMessageStats('project-1');

      expect(stats.totalMessages).toBe(3);
      expect(stats.totalTokens).toBe(300);
      expect(stats.successCount).toBe(2);
      expect(stats.errorCount).toBe(1);
      expect(stats.avgTokensPerMessage).toBe(100);
      expect(stats.modelBreakdown['claude-3'].count).toBe(2);
      expect(stats.modelBreakdown['claude-3'].tokens).toBe(250);
      expect(stats.modelBreakdown['gpt-4'].count).toBe(1);
      expect(stats.modelBreakdown['gpt-4'].tokens).toBe(50);
    });
  });

  describe('Export and Search Flow', () => {
    beforeEach(async () => {
      // Add test messages
      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'How do I use React hooks?',
        llmResponse: 'React hooks are functions that...',
        tokens: 100,
        model: 'claude-3',
        status: 'success',
      });

      await conversationService.saveMessage({
        timestamp: Date.now() + 1000,
        projectId: 'project-1',
        userMessage: 'What about TypeScript?',
        llmResponse: 'TypeScript is a superset of JavaScript...',
        tokens: 120,
        model: 'claude-3',
        status: 'success',
      });
    });

    it('should export conversation as JSON', async () => {
      const exported = await conversationService.exportConversation(
        'project-1',
        'json'
      );

      const data = JSON.parse(exported);

      expect(data.projectId).toBe('project-1');
      expect(data.messages).toHaveLength(2);
      expect(data.stats.totalMessages).toBe(2);
      expect(data.stats.totalTokens).toBe(220);
      expect(data.exportedAt).toBeDefined();
    });

    it('should export conversation as Markdown', async () => {
      const exported = await conversationService.exportConversation(
        'project-1',
        'markdown'
      );

      expect(exported).toContain('# Conversation Export: project-1');
      expect(exported).toContain('Total Messages: 2');
      expect(exported).toContain('How do I use React hooks?');
      expect(exported).toContain('TypeScript is a superset');
    });

    it('should search messages by keyword', async () => {
      const results = await conversationService.searchMessages(
        'react',
        'project-1'
      );

      expect(results).toHaveLength(1);
      expect(results[0].userMessage).toContain('React');
    });

    it('should search messages across all projects', async () => {
      // Add message to different project
      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-2',
        userMessage: 'Tell me about React',
        llmResponse: 'React is a library...',
        tokens: 80,
        model: 'claude-3',
        status: 'success',
      });

      const results = await conversationService.searchMessages('react');

      expect(results).toHaveLength(2);
    });
  });

  describe('Cleanup Flow', () => {
    it('should delete conversation history', async () => {
      // Add messages
      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Message 1',
        llmResponse: 'Response 1',
        tokens: 100,
        model: 'claude-3',
        status: 'success',
      });

      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Message 2',
        llmResponse: 'Response 2',
        tokens: 150,
        model: 'claude-3',
        status: 'success',
      });

      // Verify messages exist
      let history = await conversationService.getConversationHistory('project-1');
      expect(history).toHaveLength(2);

      // Delete history
      await conversationService.deleteConversationHistory('project-1');

      // Verify messages are gone
      history = await conversationService.getConversationHistory('project-1');
      expect(history).toHaveLength(0);
    });

    it('should clear all conversations', async () => {
      // Add messages to multiple projects
      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-1',
        userMessage: 'Message 1',
        llmResponse: 'Response 1',
        tokens: 100,
        model: 'claude-3',
        status: 'success',
      });

      await conversationService.saveMessage({
        timestamp: Date.now(),
        projectId: 'project-2',
        userMessage: 'Message 2',
        llmResponse: 'Response 2',
        tokens: 150,
        model: 'claude-3',
        status: 'success',
      });

      // Clear all
      await conversationService.clearAllConversations();

      // Verify all are gone
      const history1 = await conversationService.getConversationHistory('project-1');
      const history2 = await conversationService.getConversationHistory('project-2');

      expect(history1).toHaveLength(0);
      expect(history2).toHaveLength(0);
    });
  });
});
