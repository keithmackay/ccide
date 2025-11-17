import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, StopCircle, AlertCircle, Settings } from 'lucide-react';
import { useAppStore } from '../../stores/appStore';
import { cn } from '../../utils/cn';
import { getLLMService } from '../../services/LLMService';
import { LLMMessage } from '../../types/index';
import { usePasswordSession } from '../../hooks/usePasswordSession';
import { ReauthModal } from '../Auth/ReauthModal';

export const ConversationView: React.FC = () => {
  const messages = useAppStore((state) => state.messages);
  const addMessage = useAppStore((state) => state.addMessage);
  const updateMessage = useAppStore((state) => state.updateMessage);
  const activeProject = useAppStore((state) => state.activeProject);
  const setActiveProject = useAppStore((state) => state.setActiveProject);
  const addProject = useAppStore((state) => state.addProject);
  const selectedModel = useAppStore((state) => state.selectedModel);

  const { isSessionExpired, refreshSession, setPassword } = usePasswordSession();

  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingMessageId, setStreamingMessageId] = useState<string | null>(null);
  const [showReauthModal, setShowReauthModal] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState<string | null>(null);
  const [showConfigNotice, setShowConfigNotice] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const streamingRef = useRef(false);

  // Auto-create default project if none exists
  useEffect(() => {
    if (!activeProject) {
      const defaultProject = {
        id: 'default-project',
        name: 'Default Project',
        description: 'Default project for conversations',
        createdAt: Date.now(),
        lastModified: Date.now(),
        isArchived: false,
      };
      addProject(defaultProject);
      setActiveProject(defaultProject);
      console.log('[ConversationView] Created default project');
    }
  }, [activeProject, addProject, setActiveProject]);

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

  const handleStopStreaming = useCallback(() => {
    streamingRef.current = false;
    setIsStreaming(false);
    setStreamingMessageId(null);
  }, []);

  const handleSendWithStreaming = async (promptText?: string) => {
    const messageText = promptText || input;
    if (!messageText.trim() || !activeProject) return;

    // Check if session is expired
    if (isSessionExpired()) {
      // Save the prompt to execute after re-authentication
      setPendingPrompt(messageText);
      setShowReauthModal(true);
      return;
    }

    const userMessage = {
      id: `msg-${Date.now()}`,
      role: 'user' as const,
      content: messageText,
      timestamp: new Date().toISOString(),
      projectId: activeProject.id,
    };

    addMessage(userMessage);
    const currentInput = messageText;
    if (!promptText) {
      setInput('');
    }
    setIsStreaming(true);
    streamingRef.current = true;

    // Refresh session on LLM activity to reset timeout
    refreshSession();

    try {
      // Try to get LLM service - fallback to simulation if not configured
      let llmService;
      try {
        llmService = getLLMService();
        console.log('[ConversationView] ✓ LLM service retrieved successfully');
        console.log('[ConversationView] Using model:', selectedModel?.name || 'default');
        console.log('[ConversationView] Provider:', selectedModel?.provider || 'default');
        console.log('[ConversationView] All conversations will use this configured LLM service');
        setShowConfigNotice(false);
      } catch (err) {
        console.warn('[ConversationView] ✗ LLM service not initialized, using simulated response:', err);
        console.warn('[ConversationView] Configure API keys in Settings to enable real conversations');
        llmService = null;
        setShowConfigNotice(true);
      }

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

      if (llmService) {
        // Real streaming from LLM service
        console.log('[ConversationView] Preparing messages for LLM...');
        const projectMessages = messages
          .filter(msg => msg.projectId === activeProject.id)
          .map((msg): LLMMessage => ({
            role: msg.role,
            content: msg.content,
          }));

        projectMessages.push({
          role: 'user',
          content: currentInput,
        });

        console.log('[ConversationView] Sending', projectMessages.length, 'messages to LLM');

        let accumulatedContent = '';
        let chunkBuffer = '';
        let lastUpdateTime = Date.now();
        const BATCH_INTERVAL = 50; // ms - batch updates for performance

        try {
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

          console.log('[ConversationView] Streaming completed successfully');
        } catch (streamError) {
          console.error('[ConversationView] Streaming error:', streamError);
          // Update the assistant message with the error
          updateMessage(assistantMessageId, {
            content: `Error: ${streamError instanceof Error ? streamError.message : 'Failed to stream response from LLM'}`,
          });
          throw streamError;
        }
      } else {
        // Simulated streaming response
        const simulatedResponse = 'This is a simulated streaming response. The LLM service is not configured yet. Configure your API keys in Settings to enable real-time AI responses.';
        let currentIndex = 0;

        const streamInterval = setInterval(() => {
          if (!streamingRef.current || currentIndex >= simulatedResponse.length) {
            clearInterval(streamInterval);
            return;
          }

          // Stream 1-3 characters at a time for realistic effect
          const chunkSize = Math.floor(Math.random() * 3) + 1;
          currentIndex += chunkSize;

          updateMessage(assistantMessageId, {
            content: simulatedResponse.slice(0, currentIndex),
          });

          requestAnimationFrame(() => {
            if (streamingRef.current) {
              scrollToBottom();
            }
          });
        }, 30);
      }

    } catch (err) {
      console.error('[ConversationView] Error streaming message:', err);
      console.error('[ConversationView] Error stack:', err instanceof Error ? err.stack : 'No stack trace');

      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';

      // Error message is already added to the assistant message in the streaming catch block
      // Only add a new error message if we don't have a streaming message
      if (!streamingMessageId) {
        const errorChatMessage = {
          id: `msg-${Date.now()}`,
          role: 'assistant' as const,
          content: `Error: ${errorMessage}\n\nPlease check:\n1. Your API key is correctly configured in Settings\n2. Your internet connection is working\n3. The console for more detailed error information`,
          timestamp: new Date().toISOString(),
          projectId: activeProject.id,
        };
        addMessage(errorChatMessage);
      }
    } finally {
      streamingRef.current = false;
      setIsStreaming(false);
      setStreamingMessageId(null);

      // Refresh session after LLM activity completes
      refreshSession();
    }
  };

  const handleReauthSuccess = (password: string) => {
    // Update password in session
    setPassword(password, true);
    setShowReauthModal(false);

    // Execute the pending prompt
    if (pendingPrompt) {
      const prompt = pendingPrompt;
      setPendingPrompt(null);
      handleSendWithStreaming(prompt);
    }
  };

  const handleReauthCancel = () => {
    setShowReauthModal(false);
    setPendingPrompt(null);
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
      {/* Model Status Banner */}
      {selectedModel && !showConfigNotice && (
        <div className="bg-blue-900/20 border-b border-blue-700/30 px-4 py-2">
          <div className="flex items-center gap-2 text-xs">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            <span className="text-blue-200">
              Using <span className="font-semibold">{selectedModel.name}</span>
              {' '}({selectedModel.provider})
            </span>
          </div>
        </div>
      )}

      {/* Configuration Notice */}
      {showConfigNotice && (
        <div className="bg-yellow-900/30 border-b border-yellow-700 p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-yellow-200 mb-1">
                LLM Service Not Configured
              </h3>
              <p className="text-xs text-yellow-100 mb-2">
                You're seeing simulated responses. To enable real AI conversations, configure your API keys in Settings.
              </p>
              <button
                onClick={() => useAppStore.setState({ rightPanelMode: 'settings' })}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-yellow-600 hover:bg-yellow-700 text-white text-xs rounded transition-colors"
              >
                <Settings className="w-3.5 h-3.5" />
                Open Settings
              </button>
            </div>
            <button
              onClick={() => setShowConfigNotice(false)}
              className="text-yellow-400 hover:text-yellow-300 transition-colors"
              title="Dismiss"
            >
              ✕
            </button>
          </div>
        </div>
      )}

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

      {/* Re-authentication Modal */}
      <ReauthModal
        isOpen={showReauthModal}
        onSuccess={handleReauthSuccess}
        onCancel={handleReauthCancel}
        message="Your session has expired due to 30 minutes of conversation inactivity. Please re-enter your password to continue with your prompt."
      />
    </div>
  );
};
