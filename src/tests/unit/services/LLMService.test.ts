/**
 * LLMService Tests
 * Tests for LLM integration service
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  ClaudeLLMService,
  OpenAILLMService,
  LLMServiceFactory,
  initializeLLMService,
  getLLMService,
  resetLLMService,
} from '../../../services/LLMService';
import { LLMConfig, LLMRequest } from '../../../types/index.js';

// Mock fetch globally
global.fetch = vi.fn();

describe('ClaudeLLMService', () => {
  let service: ClaudeLLMService;
  let config: LLMConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      provider: 'anthropic',
      model: 'claude-sonnet-4-5-20250929',
      apiKey: 'test-api-key',
      maxTokens: 4096,
      temperature: 0.7,
    };
    service = new ClaudeLLMService(config);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Initialization', () => {
    it('should initialize with correct config', () => {
      expect(service).toBeDefined();
    });

    it('should use default endpoint if not provided', () => {
      const service = new ClaudeLLMService({
        provider: 'anthropic',
        model: 'claude-3',
        apiKey: 'test-key',
      });
      expect(service).toBeDefined();
    });

    it('should use custom endpoint if provided', () => {
      const customConfig = {
        ...config,
        endpoint: 'https://custom.endpoint.com/v1/messages',
      };
      const service = new ClaudeLLMService(customConfig);
      expect(service).toBeDefined();
    });
  });

  describe('sendRequest', () => {
    it('should send request successfully', async () => {
      const mockResponse = {
        id: 'msg_123',
        model: 'claude-sonnet-4-5-20250929',
        content: [{ text: 'Hello! How can I help you?' }],
        usage: {
          input_tokens: 10,
          output_tokens: 20,
        },
        stop_reason: 'end_turn',
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await service.sendRequest(request);

      expect(response.text).toBe('Hello! How can I help you?');
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
      expect(response.metadata).toEqual({
        model: 'claude-sonnet-4-5-20250929',
        stopReason: 'end_turn',
        id: 'msg_123',
      });
    });

    it('should include system prompt if provided', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      });

      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await service.sendRequest(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          body: expect.stringContaining('You are a helpful assistant'),
        })
      );
    });

    it('should use custom maxTokens if provided in request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        maxTokens: 2000,
      };

      await service.sendRequest(request);

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.max_tokens).toBe(2000);
    });

    it('should use custom temperature if provided in request', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          content: [{ text: 'Response' }],
          usage: { input_tokens: 10, output_tokens: 10 },
        }),
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
        temperature: 0.5,
      };

      await service.sendRequest(request);

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.temperature).toBe(0.5);
    });

    it('should handle API errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => 'Unauthorized',
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(service.sendRequest(request)).rejects.toThrow(
        'Claude API error: 401'
      );
    });

    it('should include correct headers', async () => {
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

      await service.sendRequest(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'x-api-key': 'test-api-key',
            'anthropic-version': '2023-06-01',
          }),
        })
      );
    });
  });

  describe('streamRequest', () => {
    it('should stream response chunks', async () => {
      const chunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Hello"}}\n',
        'data: {"type":"content_block_delta","delta":{"text":" world"}}\n',
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

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result: string[] = [];
      for await (const chunk of service.streamRequest(request)) {
        result.push(chunk);
      }

      expect(result).toEqual(['Hello', ' world']);
    });

    it('should handle streaming errors', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: async () => 'Internal Server Error',
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(async () => {
        for await (const _ of service.streamRequest(request)) {
          // Should throw before yielding anything
        }
      }).rejects.toThrow('Claude API error: 500');
    });

    it('should throw if no reader available', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: null,
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await expect(async () => {
        for await (const _ of service.streamRequest(request)) {
          // Should throw
        }
      }).rejects.toThrow('No response body reader available');
    });

    it('should ignore parse errors in stream', async () => {
      const chunks = [
        'data: {"type":"content_block_delta","delta":{"text":"Valid"}}\n',
        'data: invalid json\n',
        'data: {"type":"content_block_delta","delta":{"text":" chunk"}}\n',
      ];

      const mockReader = {
        read: vi
          .fn()
          .mockResolvedValueOnce({
            done: false,
            value: new TextEncoder().encode(chunks.join('')),
          })
          .mockResolvedValueOnce({ done: true, value: undefined }),
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        body: {
          getReader: () => mockReader,
        },
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result: string[] = [];
      for await (const chunk of service.streamRequest(request)) {
        result.push(chunk);
      }

      // Should only include valid chunks
      expect(result).toEqual(['Valid', ' chunk']);
    });
  });
});

describe('OpenAILLMService', () => {
  let service: OpenAILLMService;
  let config: LLMConfig;

  beforeEach(() => {
    vi.clearAllMocks();
    config = {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-api-key',
      maxTokens: 4096,
      temperature: 0.7,
    };
    service = new OpenAILLMService(config);
  });

  describe('sendRequest', () => {
    it('should send request successfully', async () => {
      const mockResponse = {
        id: 'chatcmpl-123',
        model: 'gpt-4',
        choices: [
          {
            message: { content: 'Hello! How can I help you?' },
            finish_reason: 'stop',
          },
        ],
        usage: {
          prompt_tokens: 10,
          completion_tokens: 20,
          total_tokens: 30,
        },
      };

      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const response = await service.sendRequest(request);

      expect(response.text).toBe('Hello! How can I help you?');
      expect(response.usage).toEqual({
        promptTokens: 10,
        completionTokens: 20,
        totalTokens: 30,
      });
    });

    it('should include system message if provided', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        }),
      });

      const request: LLMRequest = {
        systemPrompt: 'You are a helpful assistant',
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await service.sendRequest(request);

      const callBody = JSON.parse((global.fetch as any).mock.calls[0][1].body);
      expect(callBody.messages[0]).toEqual({
        role: 'system',
        content: 'You are a helpful assistant',
      });
    });

    it('should include correct headers', async () => {
      (global.fetch as any).mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [{ message: { content: 'Response' } }],
          usage: { prompt_tokens: 10, completion_tokens: 10, total_tokens: 20 },
        }),
      });

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      await service.sendRequest(request);

      expect(global.fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-api-key',
          }),
        })
      );
    });
  });

  describe('streamRequest', () => {
    it('should stream response chunks', async () => {
      const chunks = [
        'data: {"choices":[{"delta":{"content":"Hello"}}]}\n',
        'data: {"choices":[{"delta":{"content":" world"}}]}\n',
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

      const request: LLMRequest = {
        messages: [{ role: 'user', content: 'Hello' }],
      };

      const result: string[] = [];
      for await (const chunk of service.streamRequest(request)) {
        result.push(chunk);
      }

      expect(result).toEqual(['Hello', ' world']);
    });
  });
});

describe('LLMServiceFactory', () => {
  it('should create ClaudeLLMService for anthropic provider', () => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-3',
      apiKey: 'test-key',
    };

    const service = LLMServiceFactory.createService(config);

    expect(service).toBeInstanceOf(ClaudeLLMService);
  });

  it('should create ClaudeLLMService for claude provider', () => {
    const config: LLMConfig = {
      provider: 'claude',
      model: 'claude-3',
      apiKey: 'test-key',
    };

    const service = LLMServiceFactory.createService(config);

    expect(service).toBeInstanceOf(ClaudeLLMService);
  });

  it('should create OpenAILLMService for openai provider', () => {
    const config: LLMConfig = {
      provider: 'openai',
      model: 'gpt-4',
      apiKey: 'test-key',
    };

    const service = LLMServiceFactory.createService(config);

    expect(service).toBeInstanceOf(OpenAILLMService);
  });

  it('should throw error for unsupported provider', () => {
    const config: LLMConfig = {
      provider: 'unsupported' as any,
      model: 'model',
      apiKey: 'test-key',
    };

    expect(() => LLMServiceFactory.createService(config)).toThrow(
      'Unsupported LLM provider: unsupported'
    );
  });
});

describe('Global LLM Service', () => {
  beforeEach(() => {
    resetLLMService();
  });

  afterEach(() => {
    resetLLMService();
  });

  it('should initialize and get service', () => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-3',
      apiKey: 'test-key',
    };

    initializeLLMService(config);
    const service = getLLMService();

    expect(service).toBeInstanceOf(ClaudeLLMService);
  });

  it('should throw error when getting uninitialized service', () => {
    expect(() => getLLMService()).toThrow(
      'LLM service not initialized. Call initializeLLMService() first.'
    );
  });

  it('should reset service', () => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-3',
      apiKey: 'test-key',
    };

    initializeLLMService(config);
    resetLLMService();

    expect(() => getLLMService()).toThrow();
  });

  it('should return same instance on multiple get calls', () => {
    const config: LLMConfig = {
      provider: 'anthropic',
      model: 'claude-3',
      apiKey: 'test-key',
    };

    initializeLLMService(config);
    const service1 = getLLMService();
    const service2 = getLLMService();

    expect(service1).toBe(service2);
  });
});
