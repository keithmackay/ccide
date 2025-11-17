/**
 * LLMService - LLM integration for Claude API and other models
 * Provides abstraction layer for interacting with various LLM providers
 */

import {
  LLMConfig,
  LLMRequest,
  LLMResponse,
  LLMMessage
} from '../types/index.js';

/**
 * LLM service interface
 */
export interface ILLMService {
  sendRequest(request: LLMRequest): Promise<LLMResponse>;
  streamRequest(request: LLMRequest): AsyncGenerator<string>;
}

/**
 * Anthropic Claude LLM service implementation
 */
export class ClaudeLLMService implements ILLMService {
  private config: LLMConfig;
  private apiEndpoint: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.apiEndpoint = config.endpoint || 'https://api.anthropic.com/v1/messages';
  }

  /**
   * Send a request to Claude API
   */
  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    console.log('[ClaudeLLMService] Sending request to Claude API...');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.config.apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: this.config.model || 'claude-sonnet-4-5-20250929',
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        system: request.systemPrompt,
        messages: request.messages.map(msg => ({
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content
        })),
        ...request.options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('Claude API error: ' + response.status + ' - ' + error);
    }

    const data = await response.json();

    return {
      text: data.content[0].text,
      usage: {
        promptTokens: data.usage.input_tokens,
        completionTokens: data.usage.output_tokens,
        totalTokens: data.usage.input_tokens + data.usage.output_tokens
      },
      metadata: {
        model: data.model,
        stopReason: data.stop_reason,
        id: data.id
      }
    };
  }

  /**
   * Stream a request to Claude API
   */
  async *streamRequest(request: LLMRequest): AsyncGenerator<string> {
    console.log('[ClaudeLLMService] Streaming request to Claude API...');
    console.log('[ClaudeLLMService] Model:', this.config.model || 'claude-sonnet-4-5-20250929');
    console.log('[ClaudeLLMService] Endpoint:', this.apiEndpoint);
    console.log('[ClaudeLLMService] Messages:', request.messages.length);
    console.log('[ClaudeLLMService] API key present:', !!this.config.apiKey);
    console.log('[ClaudeLLMService] API key length:', this.config.apiKey?.length || 0);

    const requestBody = {
      model: this.config.model || 'claude-sonnet-4-5-20250929',
      max_tokens: request.maxTokens || this.config.maxTokens || 4096,
      temperature: request.temperature ?? this.config.temperature ?? 0.7,
      system: request.systemPrompt,
      messages: request.messages.map(msg => ({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content
      })),
      stream: true,
      ...request.options
    };

    console.log('[ClaudeLLMService] Request body:', JSON.stringify(requestBody, null, 2));

    let response;
    try {
      response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': this.config.apiKey,
          'anthropic-version': '2023-06-01'
        },
        body: JSON.stringify(requestBody)
      });

      console.log('[ClaudeLLMService] Response status:', response.status);
      console.log('[ClaudeLLMService] Response headers:', Object.fromEntries(response.headers.entries()));
    } catch (fetchError) {
      console.error('[ClaudeLLMService] Fetch error:', fetchError);
      throw new Error(`Network error: ${fetchError instanceof Error ? fetchError.message : 'Unknown fetch error'}`);
    }

    if (!response.ok) {
      const error = await response.text();
      console.error('[ClaudeLLMService] API error response:', error);
      throw new Error(`Claude API error: ${response.status} - ${error}`);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.type === 'content_block_delta') {
              yield parsed.delta.text;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

/**
 * OpenAI LLM service implementation (for future use)
 */
export class OpenAILLMService implements ILLMService {
  private config: LLMConfig;
  private apiEndpoint: string;

  constructor(config: LLMConfig) {
    this.config = config;
    this.apiEndpoint = config.endpoint || 'https://api.openai.com/v1/chat/completions';
  }

  async sendRequest(request: LLMRequest): Promise<LLMResponse> {
    console.log('[OpenAILLMService] Sending request to OpenAI API...');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.apiKey
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          ...request.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        ...request.options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('OpenAI API error: ' + response.status + ' - ' + error);
    }

    const data = await response.json();

    return {
      text: data.choices[0].message.content,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      },
      metadata: {
        model: data.model,
        finishReason: data.choices[0].finish_reason,
        id: data.id
      }
    };
  }

  async *streamRequest(request: LLMRequest): AsyncGenerator<string> {
    console.log('[OpenAILLMService] Streaming request to OpenAI API...');

    const response = await fetch(this.apiEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + this.config.apiKey
      },
      body: JSON.stringify({
        model: this.config.model || 'gpt-4',
        max_tokens: request.maxTokens || this.config.maxTokens || 4096,
        temperature: request.temperature ?? this.config.temperature ?? 0.7,
        messages: [
          ...(request.systemPrompt ? [{ role: 'system', content: request.systemPrompt }] : []),
          ...request.messages.map(msg => ({
            role: msg.role,
            content: msg.content
          }))
        ],
        stream: true,
        ...request.options
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error('OpenAI API error: ' + response.status + ' - ' + error);
    }

    const reader = response.body?.getReader();
    if (!reader) {
      throw new Error('No response body reader available');
    }

    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            const content = parsed.choices[0]?.delta?.content;
            if (content) {
              yield content;
            }
          } catch (e) {
            // Ignore parse errors
          }
        }
      }
    }
  }
}

/**
 * LLM service factory
 * Creates appropriate LLM service based on configuration
 */
export class LLMServiceFactory {
  static createService(config: LLMConfig): ILLMService {
    switch (config.provider.toLowerCase()) {
      case 'anthropic':
      case 'claude':
        return new ClaudeLLMService(config);
      
      case 'openai':
        return new OpenAILLMService(config);
      
      default:
        throw new Error('Unsupported LLM provider: ' + config.provider);
    }
  }
}

/**
 * Global LLM service instance
 */
let llmServiceInstance: ILLMService | null = null;

/**
 * Initialize the global LLM service
 */
export function initializeLLMService(config: LLMConfig): void {
  llmServiceInstance = LLMServiceFactory.createService(config);
  console.log('[LLMService] Initialized with provider:', config.provider);
}

/**
 * Get the global LLM service instance
 */
export function getLLMService(): ILLMService {
  if (!llmServiceInstance) {
    throw new Error('LLM service not initialized. Call initializeLLMService() first.');
  }
  return llmServiceInstance;
}

/**
 * Reset the global LLM service instance
 */
export function resetLLMService(): void {
  llmServiceInstance = null;
}
