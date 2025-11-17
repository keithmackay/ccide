/**
 * AgentCommunication - Message passing between agents
 * Handles inter-agent communication and message routing
 */

import {
  AgentMessage,
  MessageType
} from '../types/index.js';
import EventEmitter from 'eventemitter3';

/**
 * Message handler callback
 */
export type MessageHandler = (message: AgentMessage) => void | Promise<void>;

/**
 * Agent communication service
 * Provides pub/sub messaging system for agents
 */
export class AgentCommunication extends EventEmitter {
  private messageHistory: AgentMessage[];
  private handlers: Map<string, MessageHandler[]>;
  private messageIdCounter: number;

  constructor() {
    super();
    this.messageHistory = [];
    this.handlers = new Map();
    this.messageIdCounter = 0;
  }

  /**
   * Send a message from one agent to another
   */
  async sendMessage(
    from: string,
    to: string,
    type: MessageType,
    payload: any,
    requiresResponse: boolean = false,
    inResponseTo?: string
  ): Promise<AgentMessage> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to,
      type,
      payload,
      timestamp: new Date(),
      requiresResponse,
      inResponseTo
    };

    // Store in history
    this.messageHistory.push(message);

    // Emit event for subscribers
    this.emit('message', message);
    this.emit('message:' + to, message);
    this.emit('message:' + type, message);

    // Call registered handlers
    await this.invokeHandlers(to, message);

    console.log(
      '[AgentCommunication] Message sent: ' + from + ' -> ' + to + ' (' + type + ')'
    );

    return message;
  }

  /**
   * Broadcast a message to all agents
   */
  async broadcast(
    from: string,
    type: MessageType,
    payload: any
  ): Promise<void> {
    const message: AgentMessage = {
      id: this.generateMessageId(),
      from,
      to: 'broadcast',
      type,
      payload,
      timestamp: new Date()
    };

    this.messageHistory.push(message);
    this.emit('broadcast', message);

    console.log('[AgentCommunication] Broadcast from ' + from + ' (' + type + ')');
  }

  /**
   * Register a message handler for a specific agent
   */
  registerHandler(agentName: string, handler: MessageHandler): void {
    if (!this.handlers.has(agentName)) {
      this.handlers.set(agentName, []);
    }
    this.handlers.get(agentName)!.push(handler);
    console.log('[AgentCommunication] Registered handler for ' + agentName);
  }

  /**
   * Unregister a message handler
   */
  unregisterHandler(agentName: string, handler: MessageHandler): boolean {
    const agentHandlers = this.handlers.get(agentName);
    if (!agentHandlers) {
      return false;
    }

    const index = agentHandlers.indexOf(handler);
    if (index !== -1) {
      agentHandlers.splice(index, 1);
      return true;
    }

    return false;
  }

  /**
   * Get all messages for a specific agent
   */
  getMessagesForAgent(agentName: string): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.to === agentName);
  }

  /**
   * Get all messages from a specific agent
   */
  getMessagesFromAgent(agentName: string): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.from === agentName);
  }

  /**
   * Get messages by type
   */
  getMessagesByType(type: MessageType): AgentMessage[] {
    return this.messageHistory.filter(msg => msg.type === type);
  }

  /**
   * Get message thread (message and all responses)
   */
  getMessageThread(messageId: string): AgentMessage[] {
    const thread: AgentMessage[] = [];
    const rootMessage = this.messageHistory.find(msg => msg.id === messageId);
    
    if (rootMessage) {
      thread.push(rootMessage);
      
      // Find all responses
      const responses = this.messageHistory.filter(
        msg => msg.inResponseTo === messageId
      );
      
      for (const response of responses) {
        thread.push(...this.getMessageThread(response.id));
      }
    }

    return thread;
  }

  /**
   * Get all messages in the system
   */
  getAllMessages(): AgentMessage[] {
    return [...this.messageHistory];
  }

  /**
   * Clear message history
   */
  clearHistory(): void {
    this.messageHistory = [];
    console.log('[AgentCommunication] Cleared message history');
  }

  /**
   * Get message statistics
   */
  getStats(): {
    totalMessages: number;
    messagesByType: Record<string, number>;
    messagesByAgent: Record<string, number>;
  } {
    const messagesByType: Record<string, number> = {};
    const messagesByAgent: Record<string, number> = {};

    for (const message of this.messageHistory) {
      // Count by type
      messagesByType[message.type] = (messagesByType[message.type] || 0) + 1;

      // Count by agent
      messagesByAgent[message.from] = (messagesByAgent[message.from] || 0) + 1;
    }

    return {
      totalMessages: this.messageHistory.length,
      messagesByType,
      messagesByAgent
    };
  }

  /**
   * Wait for a specific message or response
   */
  async waitForMessage(
    predicate: (message: AgentMessage) => boolean,
    timeout: number = 30000
  ): Promise<AgentMessage> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.removeListener('message', handler);
        reject(new Error('Message wait timeout'));
      }, timeout);

      const handler = (message: AgentMessage) => {
        if (predicate(message)) {
          clearTimeout(timer);
          this.removeListener('message', handler);
          resolve(message);
        }
      };

      this.on('message', handler);
    });
  }

  /**
   * Generate a unique message ID
   */
  private generateMessageId(): string {
    this.messageIdCounter++;
    return 'msg_' + Date.now() + '_' + this.messageIdCounter;
  }

  /**
   * Invoke registered handlers for an agent
   */
  private async invokeHandlers(
    agentName: string,
    message: AgentMessage
  ): Promise<void> {
    const handlers = this.handlers.get(agentName) || [];
    
    for (const handler of handlers) {
      try {
        await handler(message);
      } catch (error) {
        console.error(
          '[AgentCommunication] Handler error for ' + agentName + ':',
          error
        );
      }
    }
  }
}

// Singleton instance
let communicationInstance: AgentCommunication | null = null;

/**
 * Get the global agent communication instance
 */
export function getAgentCommunication(): AgentCommunication {
  if (!communicationInstance) {
    communicationInstance = new AgentCommunication();
  }
  return communicationInstance;
}

/**
 * Reset the global agent communication instance (useful for testing)
 */
export function resetAgentCommunication(): void {
  if (communicationInstance) {
    communicationInstance.removeAllListeners();
  }
  communicationInstance = null;
}
