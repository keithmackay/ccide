/**
 * ConversationView Component Tests
 * Tests for the conversation interface component
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../utils/test-utils';
import { ConversationView } from '../../../components/LeftPanel/ConversationView';
import { useAppStore } from '../../../stores/appStore';

// Mock the store
vi.mock('../../../stores/appStore', () => ({
  useAppStore: vi.fn(),
}));

describe('ConversationView', () => {
  const mockAddMessage = vi.fn();
  const mockMessages = [
    {
      id: 'msg-1',
      role: 'user' as const,
      content: 'Hello, how are you?',
      timestamp: new Date('2024-01-01T10:00:00Z').toISOString(),
      projectId: 'project-1',
    },
    {
      id: 'msg-2',
      role: 'assistant' as const,
      content: 'I am doing well, thank you!',
      timestamp: new Date('2024-01-01T10:00:05Z').toISOString(),
      projectId: 'project-1',
    },
  ];

  const mockActiveProject = {
    id: 'project-1',
    name: 'Test Project',
    path: '/test/project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    isArchived: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useAppStore as any).mockImplementation((selector: any) => {
      const state = {
        messages: mockMessages,
        addMessage: mockAddMessage,
        activeProject: mockActiveProject,
      };
      return selector(state);
    });
  });

  describe('Rendering', () => {
    it('should render without crashing', () => {
      renderWithProviders(<ConversationView />);
      expect(screen.getByPlaceholderText('Type your message...')).toBeInTheDocument();
    });

    it('should display existing messages', () => {
      renderWithProviders(<ConversationView />);
      expect(screen.getByText('Hello, how are you?')).toBeInTheDocument();
      expect(screen.getByText('I am doing well, thank you!')).toBeInTheDocument();
    });

    it('should show empty state when no messages', () => {
      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          messages: [],
          addMessage: mockAddMessage,
          activeProject: mockActiveProject,
        };
        return selector(state);
      });

      renderWithProviders(<ConversationView />);
      expect(screen.getByText('Start a conversation...')).toBeInTheDocument();
    });

    it('should display user and assistant labels correctly', () => {
      renderWithProviders(<ConversationView />);
      const userLabels = screen.getAllByText('You');
      const assistantLabels = screen.getAllByText('Assistant');
      expect(userLabels).toHaveLength(1);
      expect(assistantLabels).toHaveLength(1);
    });

    it('should display message timestamps', () => {
      renderWithProviders(<ConversationView />);
      // Check that timestamps are rendered (they'll be in localized format)
      const timestamps = screen.getAllByText(/\d{1,2}:\d{2}/);
      expect(timestamps.length).toBeGreaterThan(0);
    });
  });

  describe('User Interactions', () => {
    it('should update input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Test message');

      expect(textarea).toHaveValue('Test message');
    });

    it('should send message when send button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button');
      await user.click(sendButton);

      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
          projectId: 'project-1',
        })
      );
    });

    it('should send message when Enter key is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Test message{Enter}');

      expect(mockAddMessage).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Test message',
        })
      );
    });

    it('should not send message when Shift+Enter is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Line 1{Shift>}{Enter}{/Shift}Line 2');

      // Should not have sent the message yet
      expect(mockAddMessage).not.toHaveBeenCalled();
      expect(textarea).toHaveValue('Line 1\nLine 2');
    });

    it('should clear input after sending message', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button');
      await user.click(sendButton);

      expect(textarea).toHaveValue('');
    });

    it('should not send empty messages', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const sendButton = screen.getByRole('button');
      await user.click(sendButton);

      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it('should not send messages with only whitespace', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, '   ');

      const sendButton = screen.getByRole('button');
      await user.click(sendButton);

      expect(mockAddMessage).not.toHaveBeenCalled();
    });

    it('should disable send button when input is empty', () => {
      renderWithProviders(<ConversationView />);
      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeDisabled();
    });

    it('should enable send button when input has content', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      const sendButton = screen.getByRole('button');

      expect(sendButton).toBeDisabled();

      await user.type(textarea, 'Test');

      expect(sendButton).not.toBeDisabled();
    });
  });

  describe('Message Display', () => {
    it('should apply correct styling to user messages', () => {
      renderWithProviders(<ConversationView />);
      const userMessage = screen.getByText('Hello, how are you?').closest('div');
      expect(userMessage).toHaveClass('bg-blue-600', 'text-white');
    });

    it('should apply correct styling to assistant messages', () => {
      renderWithProviders(<ConversationView />);
      const assistantMessage = screen.getByText('I am doing well, thank you!').closest('div');
      expect(assistantMessage).toHaveClass('bg-gray-800', 'text-gray-200');
    });

    it('should preserve whitespace and line breaks in messages', () => {
      const multilineMessages = [
        {
          id: 'msg-3',
          role: 'user' as const,
          content: 'Line 1\nLine 2\nLine 3',
          timestamp: new Date().toISOString(),
          projectId: 'project-1',
        },
      ];

      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          messages: multilineMessages,
          addMessage: mockAddMessage,
          activeProject: mockActiveProject,
        };
        return selector(state);
      });

      renderWithProviders(<ConversationView />);
      const messageContent = screen.getByText('Line 1\nLine 2\nLine 3');
      expect(messageContent).toHaveClass('whitespace-pre-wrap');
    });
  });

  describe('Project Context', () => {
    it('should only show messages for active project', () => {
      const mixedMessages = [
        {
          id: 'msg-1',
          role: 'user' as const,
          content: 'Message for project 1',
          timestamp: new Date().toISOString(),
          projectId: 'project-1',
        },
        {
          id: 'msg-2',
          role: 'user' as const,
          content: 'Message for project 2',
          timestamp: new Date().toISOString(),
          projectId: 'project-2',
        },
      ];

      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          messages: mixedMessages,
          addMessage: mockAddMessage,
          activeProject: mockActiveProject,
        };
        return selector(state);
      });

      renderWithProviders(<ConversationView />);

      expect(screen.getByText('Message for project 1')).toBeInTheDocument();
      expect(screen.queryByText('Message for project 2')).not.toBeInTheDocument();
    });

    it('should not send messages when no active project', async () => {
      const user = userEvent.setup();

      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          messages: [],
          addMessage: mockAddMessage,
          activeProject: null,
        };
        return selector(state);
      });

      renderWithProviders(<ConversationView />);

      const textarea = screen.getByPlaceholderText('Type your message...');
      await user.type(textarea, 'Test message');

      const sendButton = screen.getByRole('button');
      await user.click(sendButton);

      expect(mockAddMessage).not.toHaveBeenCalled();
    });
  });

  describe('Auto-scrolling', () => {
    it('should scroll to bottom when new messages arrive', async () => {
      const scrollIntoViewMock = vi.fn();
      HTMLElement.prototype.scrollIntoView = scrollIntoViewMock;

      const { rerender } = renderWithProviders(<ConversationView />);

      // Add a new message
      const newMessages = [
        ...mockMessages,
        {
          id: 'msg-3',
          role: 'user' as const,
          content: 'New message',
          timestamp: new Date().toISOString(),
          projectId: 'project-1',
        },
      ];

      (useAppStore as any).mockImplementation((selector: any) => {
        const state = {
          messages: newMessages,
          addMessage: mockAddMessage,
          activeProject: mockActiveProject,
        };
        return selector(state);
      });

      rerender(<ConversationView />);

      await waitFor(() => {
        expect(scrollIntoViewMock).toHaveBeenCalled();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have accessible textarea', () => {
      renderWithProviders(<ConversationView />);
      const textarea = screen.getByPlaceholderText('Type your message...');
      expect(textarea).toHaveAttribute('rows', '3');
    });

    it('should have accessible send button', () => {
      renderWithProviders(<ConversationView />);
      const sendButton = screen.getByRole('button');
      expect(sendButton).toBeDefined();
    });
  });
});
