/**
 * Analytics Service for CCIDE
 * Tracks all LLM messages with project tagging
 */

import { Message, AnalyticsSummary } from '../types/models';
import { getDatabase, STORES } from './Database';

export class AnalyticsService {
  private db = getDatabase();

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
   * Log a message interaction
   */
  async logMessage(
    projectId: string,
    userMessage: string,
    llmResponse: string,
    tokens: number,
    model: string,
    status: 'success' | 'error' = 'success'
  ): Promise<number> {
    const message: Message = {
      timestamp: Date.now(),
      projectId,
      userMessage,
      llmResponse,
      tokens,
      model,
      status,
    };

    return await this.db.add(STORES.MESSAGES, message);
  }

  /**
   * Get all messages
   */
  async getAllMessages(): Promise<Message[]> {
    return await this.db.getAll<Message>(STORES.MESSAGES);
  }

  /**
   * Get messages for a specific project
   */
  async getMessagesByProject(projectId: string): Promise<Message[]> {
    return await this.db.getByIndex<Message>(
      STORES.MESSAGES,
      'projectId',
      projectId
    );
  }

  /**
   * Get messages within a date range
   */
  async getMessagesByDateRange(
    startDate: number,
    endDate: number
  ): Promise<Message[]> {
    return await this.db.query<Message>(STORES.MESSAGES, (message) => {
      return message.timestamp >= startDate && message.timestamp <= endDate;
    });
  }

  /**
   * Get messages by model
   */
  async getMessagesByModel(model: string): Promise<Message[]> {
    return await this.db.getByIndex<Message>(STORES.MESSAGES, 'model', model);
  }

  /**
   * Get analytics summary
   */
  async getAnalyticsSummary(
    projectId?: string,
    startDate?: number,
    endDate?: number
  ): Promise<AnalyticsSummary> {
    let messages: Message[];

    if (projectId) {
      messages = await this.getMessagesByProject(projectId);
    } else {
      messages = await this.getAllMessages();
    }

    // Filter by date range if provided
    if (startDate || endDate) {
      messages = messages.filter((msg) => {
        if (startDate && msg.timestamp < startDate) return false;
        if (endDate && msg.timestamp > endDate) return false;
        return true;
      });
    }

    // Calculate total messages and tokens
    const totalMessages = messages.length;
    const totalTokens = messages.reduce((sum, msg) => sum + msg.tokens, 0);

    // Calculate project breakdown
    const projectMap = new Map<
      string,
      { messageCount: number; tokenCount: number }
    >();
    messages.forEach((msg) => {
      const existing = projectMap.get(msg.projectId) || {
        messageCount: 0,
        tokenCount: 0,
      };
      projectMap.set(msg.projectId, {
        messageCount: existing.messageCount + 1,
        tokenCount: existing.tokenCount + msg.tokens,
      });
    });

    const projectBreakdown = Array.from(projectMap.entries()).map(
      ([projectId, stats]) => ({
        projectId,
        projectName: projectId, // Will be enriched by ProjectService
        messageCount: stats.messageCount,
        tokenCount: stats.tokenCount,
      })
    );

    // Calculate model usage
    const modelMap = new Map<
      string,
      { count: number; tokens: number }
    >();
    messages.forEach((msg) => {
      const existing = modelMap.get(msg.model) || { count: 0, tokens: 0 };
      modelMap.set(msg.model, {
        count: existing.count + 1,
        tokens: existing.tokens + msg.tokens,
      });
    });

    const modelUsage = Array.from(modelMap.entries()).map(
      ([model, stats]) => ({
        model,
        count: stats.count,
        tokens: stats.tokens,
      })
    );

    // Determine date range
    const timestamps = messages.map((msg) => msg.timestamp);
    const dateRange = {
      start: timestamps.length > 0 ? Math.min(...timestamps) : Date.now(),
      end: timestamps.length > 0 ? Math.max(...timestamps) : Date.now(),
    };

    return {
      totalMessages,
      totalTokens,
      projectBreakdown,
      modelUsage,
      dateRange,
    };
  }

  /**
   * Get token usage for a specific project
   */
  async getProjectTokenUsage(projectId: string): Promise<number> {
    const messages = await this.getMessagesByProject(projectId);
    return messages.reduce((sum, msg) => sum + msg.tokens, 0);
  }

  /**
   * Get message count for a project
   */
  async getProjectMessageCount(projectId: string): Promise<number> {
    const messages = await this.getMessagesByProject(projectId);
    return messages.length;
  }

  /**
   * Delete all messages for a project
   */
  async deleteProjectMessages(projectId: string): Promise<void> {
    const messages = await this.getMessagesByProject(projectId);
    for (const message of messages) {
      if (message.id) {
        await this.db.delete(STORES.MESSAGES, message.id);
      }
    }
  }

  /**
   * Delete a specific message
   */
  async deleteMessage(messageId: number): Promise<void> {
    await this.db.delete(STORES.MESSAGES, messageId);
  }

  /**
   * Clear all analytics data
   */
  async clearAll(): Promise<void> {
    await this.db.clear(STORES.MESSAGES);
  }

  /**
   * Export analytics data as JSON
   */
  async exportData(): Promise<string> {
    const messages = await this.getAllMessages();
    const summary = await this.getAnalyticsSummary();
    return JSON.stringify(
      {
        messages,
        summary,
        exportedAt: Date.now(),
      },
      null,
      2
    );
  }

  /**
   * Get recent messages
   */
  async getRecentMessages(limit: number = 10): Promise<Message[]> {
    const messages = await this.getAllMessages();
    return messages
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit);
  }

  /**
   * Search messages by content
   */
  async searchMessages(query: string): Promise<Message[]> {
    const messages = await this.getAllMessages();
    const lowerQuery = query.toLowerCase();
    return messages.filter(
      (msg) =>
        msg.userMessage.toLowerCase().includes(lowerQuery) ||
        msg.llmResponse.toLowerCase().includes(lowerQuery)
    );
  }
}

// Singleton instance
let analyticsInstance: AnalyticsService | null = null;

/**
 * Get the analytics service instance
 */
export function getAnalyticsService(): AnalyticsService {
  if (!analyticsInstance) {
    analyticsInstance = new AnalyticsService();
  }
  return analyticsInstance;
}
