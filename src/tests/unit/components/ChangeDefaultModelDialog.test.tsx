/**
 * ChangeDefaultModelDialog Component Tests
 * TDD tests for changing default model with re-authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../utils/test-utils';
import ChangeDefaultModelDialog from '../../../components/Settings/ChangeDefaultModelDialog';

describe('ChangeDefaultModelDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const currentDefault = {
    provider: 'Anthropic',
    model: 'claude-3-opus-20240229',
  };
  const newDefault = {
    provider: 'OpenAI',
    model: 'gpt-4-turbo',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText(/Change Default Model/i)).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.queryByText(/Change Default Model/i)).not.toBeInTheDocument();
    });

    it('should show current and new default', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
      expect(screen.getByText(/claude-3-opus-20240229/)).toBeInTheDocument();
      expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
      expect(screen.getByText(/gpt-4-turbo/)).toBeInTheDocument();
    });

    it('should show current default label', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText(/Current default:/i)).toBeInTheDocument();
    });

    it('should show new default label', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText(/New default:/i)).toBeInTheDocument();
    });

    it('should show arrow indicator between current and new', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText(/→/)).toBeInTheDocument();
    });

    it('should require username and password', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should show Cancel and Confirm buttons', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Confirm')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have empty username field initially', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.value).toBe('');
      expect(usernameInput.disabled).toBe(false);
    });

    it('should have empty password field initially', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.value).toBe('');
      expect(passwordInput.disabled).toBe(false);
    });

    it('should mask password input', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should have username as text input', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.type).toBe('text');
    });

    it('should mark fields as required', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });
  });

  describe('Form Validation', () => {
    it('should disable Confirm button when username is empty', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('should disable Confirm button when password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('should disable Confirm button when username is empty but password is filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toBeDisabled();
    });

    it('should enable Confirm button when both fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update username input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      await user.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });

    it('should update password input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should clear inputs when dialog reopens', () => {
      const { rerender } = renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      // Close dialog
      rerender(
        <ChangeDefaultModelDialog
          open={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      // Reopen dialog
      rerender(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('should call onConfirm with username and password when Confirm is clicked', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', 'testpassword');
    });

    it('should call onClose after successful change', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not call onConfirm when fields are empty', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      // Button should be disabled, but verify
      expect(confirmButton).toBeDisabled();

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when change fails', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should not close dialog when change fails', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(mockOnConfirm).toHaveBeenCalled();
      });

      // Dialog should remain open
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show generic error message for unknown errors', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error());

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to change default model/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during change', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      // Button should show loading state
      expect(screen.getByText(/changing/i)).toBeInTheDocument();
    });

    it('should disable buttons during change', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValueOnce(new Error('Invalid credentials'))
                    .mockResolvedValueOnce(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      // First attempt - fails
      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByText('Confirm'));

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });

      // Start typing again - error should clear
      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      await user.clear(usernameInput);
      await user.type(usernameInput, 'c');

      expect(screen.queryByText(/invalid credentials/i)).not.toBeInTheDocument();
    });
  });

  describe('Model Information Display', () => {
    it('should display different provider combinations correctly', () => {
      const { rerender } = renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: 'OpenAI', model: 'gpt-4' }}
          newDefault={{ provider: 'Anthropic', model: 'claude-sonnet-4-5-20250929' }}
        />
      );

      expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
      expect(screen.getByText(/gpt-4/)).toBeInTheDocument();
      expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
      expect(screen.getByText(/claude-sonnet-4-5-20250929/)).toBeInTheDocument();
    });

    it('should handle same provider different model', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: 'Anthropic', model: 'claude-3-opus-20240229' }}
          newDefault={{ provider: 'Anthropic', model: 'claude-sonnet-4-5-20250929' }}
        />
      );

      const anthropicTexts = screen.getAllByText(/Anthropic/);
      expect(anthropicTexts).toHaveLength(2);
      expect(screen.getByText(/claude-3-opus-20240229/)).toBeInTheDocument();
      expect(screen.getByText(/claude-sonnet-4-5-20250929/)).toBeInTheDocument();
    });

    it('should handle custom providers', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: 'Custom', model: 'my-model-v1' }}
          newDefault={{ provider: 'Custom', model: 'my-model-v2' }}
        />
      );

      expect(screen.getByText(/my-model-v1/)).toBeInTheDocument();
      expect(screen.getByText(/my-model-v2/)).toBeInTheDocument();
    });

    it('should handle empty provider names', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: '', model: 'model-1' }}
          newDefault={{ provider: '', model: 'model-2' }}
        />
      );

      // Should still render without crashing
      expect(screen.getByText(/Change Default Model/i)).toBeInTheDocument();
    });

    it('should handle empty model names', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: 'Anthropic', model: '' }}
          newDefault={{ provider: 'OpenAI', model: '' }}
        />
      );

      // Should still render without crashing
      expect(screen.getByText(/Change Default Model/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in username', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const specialUsername = 'user@example.com';
      await user.type(screen.getByLabelText(/username/i), specialUsername);
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(specialUsername, 'testpassword');
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const specialPassword = '!@#$%^&*()_+-=';
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), specialPassword);

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', specialPassword);
    });

    it('should handle very long usernames', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const longUsername = 'a'.repeat(100);
      await user.type(screen.getByLabelText(/username/i), longUsername);
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(longUsername, 'testpassword');
    });

    it('should trim whitespace from username', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      await user.type(screen.getByLabelText(/username/i), '  testuser  ');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const confirmButton = screen.getByText('Confirm');
      await user.click(confirmButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', 'testpassword');
    });

    it('should handle very long model names', () => {
      const longModel = 'a'.repeat(200);
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={{ provider: 'Provider1', model: longModel }}
          newDefault={{ provider: 'Provider2', model: longModel }}
        />
      );

      // Should render without crashing
      expect(screen.getByText(/Change Default Model/i)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have required attribute on required fields', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });

    it('should have proper modal role and overlay', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const modal = screen.getByText(/Change Default Model/i).closest('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal?.parentElement).toHaveClass('modal-overlay');
    });

    it('should have primary styling on confirm button', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const confirmButton = screen.getByText('Confirm');
      expect(confirmButton).toHaveClass('btn-primary');
    });

    it('should have change summary section with proper styling', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const changeSummary = screen.getByText(/Current default:/i).closest('.change-summary');
      expect(changeSummary).toBeInTheDocument();
    });

    it('should have separate current and new default sections', () => {
      renderWithProviders(
        <ChangeDefaultModelDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          currentDefault={currentDefault}
          newDefault={newDefault}
        />
      );

      const currentSection = screen.getByText(/Current default:/i).closest('.current-default');
      const newSection = screen.getByText(/New default:/i).closest('.new-default');

      expect(currentSection).toBeInTheDocument();
      expect(newSection).toBeInTheDocument();
    });
  });
});
