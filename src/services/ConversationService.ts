/**
 * ConversationService - Manages conversation persistence and analytics
 * Provides methods for saving messages, retrieving history, and exporting data
 */

import { Message } from '../types/models';
import { getDatabase, STORES } from './Database';

/**
 * Token counting utility
 * Rough estimation: ~4 characters per token for both Claude and GPT
 */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

/**
 * Calculate tokens for a conversation
 */
export function calculateConversationTokens(
  userMessage: string,
  llmResponse: string
): { inputTokens: number; outputTokens: number; totalTokens: number } {
  const inputTokens = estimateTokens(userMessage);
  const outputTokens = estimateTokens(llmResponse);
  return {
    inputTokens,
    outputTokens,
    totalTokens: inputTokens + outputTokens,
  };
}

/**
 * Conversation statistics
 */
export interface ConversationStats {
  totalMessages: number;
  totalTokens: number;
  successCount: number;
  errorCount: number;
  avgTokensPerMessage: number;
  modelBreakdown: Record<string, { count: number; tokens: number }>;
}

/**
 * Export format options
 */
export type ExportFormat = 'json' | 'markdown';

/**
 * Conversation Service class
 */
export class ConversationService {
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
   * Save a message to the database
   * @param message Message data (without id)
   * @returns Promise resolving to message ID
   */
  async saveMessage(message: Omit<Message, 'id'>): Promise<number> {
    try {
      return await this.db.add(STORES.MESSAGES, message);
    } catch (error) {
      console.error('[ConversationService] Failed to save message:', error);
      // Don't throw - we don't want to break the UX if analytics fails
      return -1;
    }
  }

  /**
   * Get conversation history for a project
   * @param projectId Project identifier
   * @returns Promise resolving to array of messages
   */
  async getConversationHistory(projectId: string): Promise<Message[]> {
    try {
      const messages = await this.db.getByIndex<Message>(
        STORES.MESSAGES,
        'projectId',
        projectId
      );
      return messages.sort((a, b) => a.timestamp - b.timestamp);
    } catch (error) {
      console.error('[ConversationService] Failed to get conversation history:', error);
      return [];
    }
  }

  /**
   * Get the most recent N messages for a project
   * @param projectId Project identifier
   * @param limit Number of messages to retrieve (default: 50)
   * @returns Promise resolving to array of recent messages
   */
  async getRecentMessages(projectId: string, limit: number = 50): Promise<Message[]> {
    try {
      const messages = await this.getConversationHistory(projectId);
      return messages.slice(-limit);
    } catch (error) {
      console.error('[ConversationService] Failed to get recent messages:', error);
      return [];
    }
  }

  /**
   * Get conversation statistics for a project
   * @param projectId Project identifier (optional - gets all if not provided)
   * @returns Promise resolving to conversation statistics
   */
  async getMessageStats(projectId?: string): Promise<ConversationStats> {
    try {
      let messages: Message[];
      if (projectId) {
        messages = await this.getConversationHistory(projectId);
      } else {
        messages = await this.db.getAll<Message>(STORES.MESSAGES);
      }

      const totalMessages = messages.length;
      const totalTokens = messages.reduce((sum, msg) => sum + msg.tokens, 0);
      const successCount = messages.filter((msg) => msg.status === 'success').length;
      const errorCount = messages.filter((msg) => msg.status === 'error').length;
      const avgTokensPerMessage = totalMessages > 0 ? totalTokens / totalMessages : 0;

      // Calculate model breakdown
      const modelBreakdown: Record<string, { count: number; tokens: number }> = {};
      messages.forEach((msg) => {
        if (!modelBreakdown[msg.model]) {
          modelBreakdown[msg.model] = { count: 0, tokens: 0 };
        }
        modelBreakdown[msg.model].count++;
        modelBreakdown[msg.model].tokens += msg.tokens;
      });

      return {
        totalMessages,
        totalTokens,
        successCount,
        errorCount,
        avgTokensPerMessage,
        modelBreakdown,
      };
    } catch (error) {
      console.error('[ConversationService] Failed to get message stats:', error);
      return {
        totalMessages: 0,
        totalTokens: 0,
        successCount: 0,
        errorCount: 0,
        avgTokensPerMessage: 0,
        modelBreakdown: {},
      };
    }
  }

  /**
   * Export conversation as JSON or Markdown
   * @param projectId Project identifier
   * @param format Export format (default: 'json')
   * @returns Promise resolving to exported data string
   */
  async exportConversation(
    projectId: string,
    format: ExportFormat = 'json'
  ): Promise<string> {
    try {
      const messages = await this.getConversationHistory(projectId);
      const stats = await this.getMessageStats(projectId);

      if (format === 'json') {
        return JSON.stringify(
          {
            projectId,
            messages,
            stats,
            exportedAt: new Date().toISOString(),
          },
          null,
          2
        );
      } else {
        // Markdown format
        let markdown = `# Conversation Export: ${projectId}\n\n`;
        markdown += `**Exported:** ${new Date().toISOString()}\n\n`;
        markdown += `## Statistics\n\n`;
        markdown += `- Total Messages: ${stats.totalMessages}\n`;
        markdown += `- Total Tokens: ${stats.totalTokens.toLocaleString()}\n`;
        markdown += `- Success: ${stats.successCount} | Errors: ${stats.errorCount}\n`;
        markdown += `- Avg Tokens/Message: ${Math.round(stats.avgTokensPerMessage)}\n\n`;

        markdown += `## Model Usage\n\n`;
        Object.entries(stats.modelBreakdown).forEach(([model, data]) => {
          markdown += `- **${model}**: ${data.count} messages, ${data.tokens.toLocaleString()} tokens\n`;
        });

        markdown += `\n## Messages\n\n`;
        messages.forEach((msg, idx) => {
          const date = new Date(msg.timestamp).toLocaleString();
          markdown += `### Message ${idx + 1} (${date})\n\n`;
          markdown += `**Model:** ${msg.model} | **Status:** ${msg.status} | **Tokens:** ${msg.tokens}\n\n`;
          markdown += `**User:**\n\`\`\`\n${msg.userMessage}\n\`\`\`\n\n`;
          markdown += `**Assistant:**\n\`\`\`\n${msg.llmResponse}\n\`\`\`\n\n`;
          markdown += `---\n\n`;
        });

        return markdown;
      }
    } catch (error) {
      console.error('[ConversationService] Failed to export conversation:', error);
      throw error;
    }
  }

  /**
   * Delete conversation history for a project
   * @param projectId Project identifier
   */
  async deleteConversationHistory(projectId: string): Promise<void> {
    try {
      const messages = await this.getConversationHistory(projectId);
      for (const message of messages) {
        if (message.id) {
          await this.db.delete(STORES.MESSAGES, message.id);
        }
      }
    } catch (error) {
      console.error('[ConversationService] Failed to delete conversation history:', error);
      throw error;
    }
  }

  /**
   * Clear all conversations
   */
  async clearAllConversations(): Promise<void> {
    try {
      await this.db.clear(STORES.MESSAGES);
    } catch (error) {
      console.error('[ConversationService] Failed to clear all conversations:', error);
      throw error;
    }
  }

  /**
   * Search messages by content
   * @param query Search query
   * @param projectId Optional project ID to limit search
   * @returns Promise resolving to matching messages
   */
  async searchMessages(query: string, projectId?: string): Promise<Message[]> {
    try {
      let messages: Message[];
      if (projectId) {
        messages = await this.getConversationHistory(projectId);
      } else {
        messages = await this.db.getAll<Message>(STORES.MESSAGES);
      }

      const lowerQuery = query.toLowerCase();
      return messages.filter(
        (msg) =>
          msg.userMessage.toLowerCase().includes(lowerQuery) ||
          msg.llmResponse.toLowerCase().includes(lowerQuery)
      );
    } catch (error) {
      console.error('[ConversationService] Failed to search messages:', error);
      return [];
    }
  }
}

/**
 * Singleton instance
 */
let conversationServiceInstance: ConversationService | null = null;

/**
 * Get the conversation service instance
 */
export function getConversationService(): ConversationService {
  if (!conversationServiceInstance) {
    conversationServiceInstance = new ConversationService();
  }
  return conversationServiceInstance;
}
