import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, StopCircle } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';
import { initializeLLMService, getLLMService } from '../../services/LLMService';
import { getSettingsService } from '../../services/SettingsService';
import { parseError, ErrorMessageConfig } from '../common/ErrorMessage';
import { LLMMessage, LLMConfig } from '../../types/index';
import { PasswordDialog } from '../common/PasswordDialog';
import { usePasswordSession, usePasswordWarning } from '../../hooks/usePasswordSession';
import { validatePassword } from '../../services/SettingsHelper';

export const ConversationView: React.FC = () => {
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  const updateMessage = useAppStore((state) => state.updateMessage);
  const activeProject = useAppStore((state) => state.activeProject);

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [error, setError] = useState<ErrorMessageConfig | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const streamingRef = useRef(false);

  // Use password session hook for secure password management
  const { password, hasPassword, setPassword, clearPassword } = usePasswordSession();
  usePasswordWarning(hasPassword);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Auto-scroll during streaming
  useEffect(() => {
    if (isStreaming) {
      scrollToBottom();
    }
  }, [isStreaming, messages, scrollToBottom]);

  const handlePasswordSubmit = async (pwd: string, remember: boolean) => {
    const isValid = await validatePassword(pwd);
    if (isValid) {
      setPassword(pwd, remember);
      setShowPasswordDialog(false);
      setPasswordError('');
    } else {
      setPasswordError('Invalid password. Please try again.');
    }
  };

  const handleStopStreaming = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    streamingRef.current = false;
    setIsStreaming(false);
    setStreamingMessageId(null);
  }, []);

  const handleSendWithStreaming = async () => {
    if (!input.trim() || !activeProject) return;

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: input,
      timestamp: new Date().toISOString(),
      projectId: activeProject.id,
    };

    addMessage(userMessage);
    const currentInput = input;
    setInput('');
    setError(null);
    setIsStreaming(true);
    streamingRef.current = true;

    // Create abort controller for this stream
    abortControllerRef.current = new AbortController();

    try {
      const settingsService = getSettingsService();

      // Check if we need password
      const settingsWithoutPassword = await settingsService.getSettings();
      if (settingsWithoutPassword?.encryptedData && !password) {
        setShowPasswordDialog(true);
        setIsStreaming(false);
        streamingRef.current = false;
        // Re-add the user input since we need password first
        setInput(currentInput);
        return;
      }

      // Load settings with password if needed
      const settings = await settingsService.getSettings(password || undefined);

      if (!settings || !settings.llmConfigs || settings.llmConfigs.length === 0) {
        throw new Error('No LLM configuration found. Please configure your API keys in Settings.');
      }

      // Get the default config or first available
      const llmConfig = settings.llmConfigs.find(c => c.isDefault) || settings.llmConfigs[0];

      if (!llmConfig || !llmConfig.apiKey || llmConfig.apiKey === '***ENCRYPTED***') {
        // Password might be wrong, clear it and ask again
        clearPassword();
        setPasswordError('Failed to decrypt API key. Please enter your password again.');
        setShowPasswordDialog(true);
        setIsStreaming(false);
        streamingRef.current = false;
        setInput(currentInput);
        return;
      }

      // Initialize LLM service
      const config: LLMConfig = {
        provider: llmConfig.provider,
        model: llmConfig.modelName,
        apiKey: llmConfig.apiKey,
        endpoint: llmConfig.endpoint,
        maxTokens: llmConfig.maxTokens,
        temperature: llmConfig.temperature,
      };

      initializeLLMService(config);
      const llmService = getLLMService();

      // Convert UI messages to LLM messages (only for current project)
      const projectMessages = messages
        .filter(msg => msg.projectId === activeProject.id)
        .map((msg): LLMMessage => ({
          role: msg.role,
          content: msg.content,
        }));

      // Add the current user message
      projectMessages.push({
        role: 'user',
        content: currentInput,
      });

      // Create assistant message for streaming
      const assistantMessageId = `msg-${Date.now()}`;
      const assistantMessage = {
        id: assistantMessageId,
        role: 'assistant' as const,
        content: '',
        timestamp: new Date().toISOString(),
        projectId: activeProject.id,
      };
      addMessage(assistantMessage);
      setStreamingMessageId(assistantMessageId);

      // Stream response from LLM
      let accumulatedContent = '';
      let chunkBuffer = '';
      let lastUpdateTime = Date.now();
      const BATCH_INTERVAL = 50; // ms - batch updates for performance

      for await (const chunk of llmService.streamRequest({
        messages: projectMessages,
        systemPrompt: 'You are a helpful AI assistant integrated into CCIDE, a code IDE.',
      })) {
        // Check if streaming was cancelled
        if (!streamingRef.current) {
          break;
        }

        chunkBuffer += chunk;
        accumulatedContent += chunk;

        // Batch updates to avoid excessive re-renders
        const now = Date.now();
        if (now - lastUpdateTime >= BATCH_INTERVAL || chunkBuffer.length > 50) {
          updateMessage(assistantMessageId, { content: accumulatedContent });
          chunkBuffer = '';
          lastUpdateTime = now;

          // Use requestAnimationFrame for smoother scrolling
          requestAnimationFrame(() => {
            if (streamingRef.current) {
              scrollToBottom();
            }
          });
        }
      }

      // Final update with any remaining content
      if (chunkBuffer) {
        updateMessage(assistantMessageId, { content: accumulatedContent });
      }

    } catch (err) {
      console.error('Error streaming message:', err);

      // Only show error if not aborted
      if (err instanceof Error && err.name !== 'AbortError') {
        const errorMessage = err.message || 'An unknown error occurred';

        // Check if it's a password/decryption error
        if (errorMessage.includes('password') || errorMessage.includes('decrypt') || errorMessage.includes('Invalid password')) {
          clearPassword();
          setPasswordError('Session expired or invalid password. Please try again.');
          setShowPasswordDialog(true);
        } else {
          setError(parseError(err));

          // Add error message to chat
          const errorChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'assistant' as const,
            content: `Error: ${errorMessage}`,
            timestamp: new Date().toISOString(),
            projectId: activeProject.id,
          };
          addMessage(errorChatMessage);
        }
      }
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
      setStreamingMessageId(null);
      abortControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendWithStreaming();
    }
  };

  const projectMessages = messages.filter(
    (msg) => msg.projectId === activeProject?.id
  );

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {projectMessages.length === 0 ? (
          <div className="flex items-center justify-center h-full text-gray-500 text-sm">
            Start a conversation...
          </div>
        ) : (
          projectMessages.map((message) => (
            <div
              key={message.id}
              className={cn(
                'flex flex-col gap-1',
                message.role === 'user' ? 'items-end' : 'items-start'
              )}
            >
              <div className="text-xs text-gray-500 px-2">
                {message.role === 'user' ? 'You' : 'Assistant'}
              </div>
              <div
                className={cn(
                  'max-w-[85%] px-4 py-2 rounded-lg',
                  message.role === 'user'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-200'
                )}
              >
                <div className="text-sm whitespace-pre-wrap">
                  {message.content}
                  {isStreaming && message.id === streamingMessageId && (
                    <span className="inline-block w-2 h-4 ml-1 bg-blue-500 animate-pulse" />
                  )}
                </div>
              </div>
              <div className="text-xs text-gray-600 px-2">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            disabled={isStreaming}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
            rows={3}
          />
          {isStreaming ? (
            <button
              onClick={handleStopStreaming}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              title="Stop generating"
            >
              <StopCircle className="w-5 h-5" />
              <span className="text-xs">Stop</span>
            </button>
          ) : (
            <button
              onClick={handleSendWithStreaming}
              disabled={!input.trim()}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded-lg transition-colors"
              title="Send message"
            >
              <Send className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* Password Dialog - Enhanced version with validation and session management */}
      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPasswordError('');
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
        title="Unlock Settings"
        description="Your API keys are encrypted. Please enter your password to continue."
        showRememberOption={true}
      />
    </div>
  );
};
