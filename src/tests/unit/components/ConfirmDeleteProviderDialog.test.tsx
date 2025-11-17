/**
 * ConfirmDeleteProviderDialog Component Tests
 * TDD tests for confirming provider deletion with re-authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../utils/test-utils';
import ConfirmDeleteProviderDialog from '../../../components/Settings/ConfirmDeleteProviderDialog';

describe('ConfirmDeleteProviderDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  const testProviderName = 'Anthropic';
  const testModelName = 'claude-sonnet-4-5-20250929';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByText(/Delete Provider/i)).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.queryByText(/Delete Provider/i)).not.toBeInTheDocument();
    });

    it('should show provider details', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
      expect(screen.getByText(/claude-sonnet-4-5-20250929/)).toBeInTheDocument();
    });

    it('should show warning message', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByText(/Are you sure you want to delete this provider configuration?/i)).toBeInTheDocument();
    });

    it('should require username and password', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should show Cancel and Delete Provider buttons', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Delete Provider')).toBeInTheDocument();
    });
  });

  describe('Form Fields', () => {
    it('should have empty username field initially', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.value).toBe('');
      expect(usernameInput.disabled).toBe(false);
    });

    it('should have empty password field initially', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.value).toBe('');
      expect(passwordInput.disabled).toBe(false);
    });

    it('should mask password input', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should have username as text input', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.type).toBe('text');
    });

    it('should mark fields as required', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });
  });

  describe('Form Validation', () => {
    it('should disable Delete Provider button when username is empty', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const deleteButton = screen.getByText('Delete Provider');
      expect(deleteButton).toBeDisabled();
    });

    it('should disable Delete Provider button when password is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const deleteButton = screen.getByText('Delete Provider');
      expect(deleteButton).toBeDisabled();
    });

    it('should disable Delete Provider button when username is empty but password is filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      expect(deleteButton).toBeDisabled();
    });

    it('should enable Delete Provider button when both fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i);
      await user.type(usernameInput, 'testuser');

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      expect(deleteButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update username input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      await user.type(usernameInput, 'testuser');

      expect(usernameInput.value).toBe('testuser');
    });

    it('should update password input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should clear inputs when dialog reopens', () => {
      const { rerender } = renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      // Close dialog
      rerender(
        <ConfirmDeleteProviderDialog
          open={false}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      // Reopen dialog
      rerender(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;

      expect(usernameInput.value).toBe('');
      expect(passwordInput.value).toBe('');
    });
  });

  describe('Form Submission', () => {
    it('should call onConfirm with username and password when Delete Provider is clicked', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', 'testpassword');
    });

    it('should call onClose after successful deletion', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should not call onConfirm when fields are empty', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const deleteButton = screen.getByText('Delete Provider');
      // Button should be disabled, but try to click anyway
      expect(deleteButton).toBeDisabled();

      expect(mockOnConfirm).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should show error message when deletion fails', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should not close dialog when deletion fails', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

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
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      await waitFor(() => {
        expect(screen.getByText(/failed to delete provider/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during deletion', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      // Button should show loading state
      expect(screen.getByText(/deleting/i)).toBeInTheDocument();
    });

    it('should disable buttons during deletion', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });

    it('should clear error message when user starts typing', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValueOnce(new Error('Invalid credentials'))
                    .mockResolvedValueOnce(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      // First attempt - fails
      await user.type(screen.getByLabelText(/username/i), 'wronguser');
      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.click(screen.getByText('Delete Provider'));

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

  describe('Provider Information Display', () => {
    it('should display different provider names correctly', () => {
      const { rerender } = renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName="OpenAI"
          modelName="gpt-4-turbo"
        />
      );

      expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
      expect(screen.getByText(/gpt-4-turbo/)).toBeInTheDocument();

      rerender(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName="Custom Provider"
          modelName="my-custom-model"
        />
      );

      expect(screen.getByText(/Custom Provider/)).toBeInTheDocument();
      expect(screen.getByText(/my-custom-model/)).toBeInTheDocument();
    });

    it('should handle empty provider name', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName=""
          modelName={testModelName}
        />
      );

      // Should still render without crashing
      expect(screen.getByText(/Delete Provider/i)).toBeInTheDocument();
    });

    it('should handle empty model name', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName=""
        />
      );

      // Should still render without crashing
      expect(screen.getByText(/Delete Provider/i)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle special characters in username', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const specialUsername = 'user@example.com';
      await user.type(screen.getByLabelText(/username/i), specialUsername);
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(specialUsername, 'testpassword');
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const specialPassword = '!@#$%^&*()_+-=';
      await user.type(screen.getByLabelText(/username/i), 'testuser');
      await user.type(screen.getByLabelText(/password/i), specialPassword);

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', specialPassword);
    });

    it('should handle very long usernames', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const longUsername = 'a'.repeat(100);
      await user.type(screen.getByLabelText(/username/i), longUsername);
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith(longUsername, 'testpassword');
    });

    it('should trim whitespace from username', async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      await user.type(screen.getByLabelText(/username/i), '  testuser  ');
      await user.type(screen.getByLabelText(/password/i), 'testpassword');

      const deleteButton = screen.getByText('Delete Provider');
      await user.click(deleteButton);

      expect(mockOnConfirm).toHaveBeenCalledWith('testuser', 'testpassword');
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    });

    it('should have required attribute on required fields', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      expect(screen.getByLabelText(/username/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
    });

    it('should have proper modal role and overlay', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const modal = screen.getByText(/Delete Provider/i).closest('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal?.parentElement).toHaveClass('modal-overlay');
    });

    it('should have danger styling on delete button', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const deleteButton = screen.getByText('Delete Provider');
      expect(deleteButton).toHaveClass('btn-danger');
    });

    it('should have warning message styled appropriately', () => {
      renderWithProviders(
        <ConfirmDeleteProviderDialog
          open={true}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
          providerName={testProviderName}
          modelName={testModelName}
        />
      );

      const warningMessage = screen.getByText(/Are you sure you want to delete this provider configuration?/i).closest('.warning-message');
      expect(warningMessage).toBeInTheDocument();
    });
  });
});
