/**
 * AddProviderDialog Component Tests
 * TDD tests for adding new LLM providers with inline authentication
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import { renderWithProviders, userEvent } from '../../utils/test-utils';
import AddProviderDialog from '../../../components/Settings/AddProviderDialog';

describe('AddProviderDialog', () => {
  const mockOnClose = vi.fn();
  const mockOnAdd = vi.fn();
  const testUsername = 'testuser';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render dialog when open is true', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByText(/Add LLM Provider/i)).toBeInTheDocument();
    });

    it('should not render dialog when open is false', () => {
      renderWithProviders(
        <AddProviderDialog
          open={false}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.queryByText(/Add LLM Provider/i)).not.toBeInTheDocument();
    });

    it('should render with username auto-filled from session', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.value).toBe(testUsername);
      expect(usernameInput.disabled).toBe(true);
    });

    it('should show all required fields', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('should show default provider checkbox', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByText(/Set as default provider/i)).toBeInTheDocument();
    });

    it('should show Cancel and Add Provider buttons', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByText('Cancel')).toBeInTheDocument();
      expect(screen.getByText('Add Provider')).toBeInTheDocument();
    });
  });

  describe('Provider Selection', () => {
    it('should have Anthropic as default provider', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      expect(providerSelect.value).toBe('anthropic');
    });

    it('should show Anthropic, OpenAI, and Custom provider options', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      const options = Array.from(providerSelect.options).map(o => o.value);

      expect(options).toContain('anthropic');
      expect(options).toContain('openai');
      expect(options).toContain('custom');
    });

    it('should show Anthropic models when Anthropic is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      await user.selectOptions(providerSelect, 'anthropic');

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement;
      const options = Array.from(modelSelect.options).map(o => o.text);

      expect(options).toContain('claude-sonnet-4-5-20250929');
      expect(options).toContain('claude-3-7-sonnet-20250219');
    });

    it('should show OpenAI models when OpenAI is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      await user.selectOptions(providerSelect, 'openai');

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement;
      const options = Array.from(modelSelect.options).map(o => o.text);

      expect(options).toContain('gpt-4-turbo');
      expect(options).toContain('gpt-4o');
    });

    it('should show text input for custom model when Custom is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      await user.selectOptions(providerSelect, 'custom');

      const modelInput = screen.getByLabelText(/model/i) as HTMLInputElement;
      expect(modelInput.type).toBe('text');
      expect(modelInput.placeholder).toContain('model name');
    });

    it('should show custom endpoint field when Custom provider is selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      await user.selectOptions(providerSelect, 'custom');

      expect(screen.getByLabelText(/custom endpoint/i)).toBeInTheDocument();
    });

    it('should not show custom endpoint field for Anthropic or OpenAI', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.queryByLabelText(/custom endpoint/i)).not.toBeInTheDocument();
    });

    it('should clear model selection when provider changes', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const modelSelect = screen.getByLabelText(/model/i) as HTMLSelectElement;
      await user.selectOptions(modelSelect, 'claude-sonnet-4-5-20250929');
      expect(modelSelect.value).toBe('claude-sonnet-4-5-20250929');

      const providerSelect = screen.getByLabelText(/provider/i) as HTMLSelectElement;
      await user.selectOptions(providerSelect, 'openai');

      expect(modelSelect.value).toBe('');
    });
  });

  describe('Form Validation', () => {
    it('should disable Add Provider button when password is empty', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const addButton = screen.getByText('Add Provider');
      expect(addButton).toBeDisabled();
    });

    it('should disable Add Provider button when API key is empty', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const addButton = screen.getByText('Add Provider');
      expect(addButton).toBeDisabled();
    });

    it('should disable Add Provider button when model is not selected', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const apiKeyInput = screen.getByLabelText(/api key/i);
      await user.type(apiKeyInput, 'test-api-key');

      const addButton = screen.getByText('Add Provider');
      expect(addButton).toBeDisabled();
    });

    it('should enable Add Provider button when all required fields are filled', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i);
      await user.type(passwordInput, 'testpassword');

      const apiKeyInput = screen.getByLabelText(/api key/i);
      await user.type(apiKeyInput, 'test-api-key');

      const modelSelect = screen.getByLabelText(/model/i);
      await user.selectOptions(modelSelect, 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      expect(addButton).not.toBeDisabled();
    });

    it('should mask password input', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      expect(passwordInput.type).toBe('password');
    });

    it('should mask API key input', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const apiKeyInput = screen.getByLabelText(/api key/i) as HTMLInputElement;
      expect(apiKeyInput.type).toBe('password');
    });
  });

  describe('User Interactions', () => {
    it('should call onClose when Cancel button is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should update password input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const passwordInput = screen.getByLabelText(/password/i) as HTMLInputElement;
      await user.type(passwordInput, 'mypassword');

      expect(passwordInput.value).toBe('mypassword');
    });

    it('should update API key input value when typing', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const apiKeyInput = screen.getByLabelText(/api key/i) as HTMLInputElement;
      await user.type(apiKeyInput, 'sk-1234567890');

      expect(apiKeyInput.value).toBe('sk-1234567890');
    });

    it('should toggle default provider checkbox', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const checkbox = screen.getByRole('checkbox') as HTMLInputElement;
      expect(checkbox.checked).toBe(false);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(true);

      await user.click(checkbox);
      expect(checkbox.checked).toBe(false);
    });

    it('should allow typing custom model name for custom provider', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i);
      await user.selectOptions(providerSelect, 'custom');

      const modelInput = screen.getByLabelText(/model/i) as HTMLInputElement;
      await user.type(modelInput, 'my-custom-model');

      expect(modelInput.value).toBe('my-custom-model');
    });

    it('should allow typing custom endpoint URL', async () => {
      const user = userEvent.setup();
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const providerSelect = screen.getByLabelText(/provider/i);
      await user.selectOptions(providerSelect, 'custom');

      const endpointInput = screen.getByLabelText(/custom endpoint/i) as HTMLInputElement;
      await user.type(endpointInput, 'https://api.example.com');

      expect(endpointInput.value).toBe('https://api.example.com');
    });
  });

  describe('Form Submission', () => {
    it('should call onAdd with correct data when Add Provider is clicked', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith({
        username: testUsername,
        password: 'testpassword',
        provider: 'anthropic',
        apiKey: 'sk-test-key',
        modelName: 'claude-sonnet-4-5-20250929',
        isDefault: false,
        endpoint: undefined,
      });
    });

    it('should call onAdd with isDefault=true when checkbox is checked', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');
      await user.click(screen.getByRole('checkbox'));

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          isDefault: true,
        })
      );
    });

    it('should call onAdd with OpenAI provider and model', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.selectOptions(screen.getByLabelText(/provider/i), 'openai');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'gpt-4-turbo');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          provider: 'openai',
          modelName: 'gpt-4-turbo',
        })
      );
    });

    it('should call onAdd with custom provider, model, and endpoint', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.selectOptions(screen.getByLabelText(/provider/i), 'custom');
      await user.type(screen.getByLabelText(/api key/i), 'custom-key');
      await user.type(screen.getByLabelText(/model/i), 'my-model');
      await user.type(screen.getByLabelText(/custom endpoint/i), 'https://api.custom.com');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith({
        username: testUsername,
        password: 'testpassword',
        provider: 'custom',
        apiKey: 'custom-key',
        modelName: 'my-model',
        isDefault: false,
        endpoint: 'https://api.custom.com',
      });
    });

    it('should call onClose after successful add', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle onAdd rejection and not close dialog', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(mockOnAdd).toHaveBeenCalled();
      });

      // Dialog should remain open
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it('should show error message when add fails', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockRejectedValue(new Error('Invalid credentials'));

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'wrongpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      await waitFor(() => {
        expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
      });
    });

    it('should show loading state during add operation', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      // Button should show loading state
      expect(screen.getByText(/adding/i)).toBeInTheDocument();
    });

    it('should disable buttons during add operation', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      const cancelButton = screen.getByText('Cancel');
      expect(cancelButton).toBeDisabled();
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string username', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username=""
        />
      );

      const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
      expect(usernameInput.value).toBe('');
    });

    it('should handle special characters in password', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const specialPassword = '!@#$%^&*()_+-=';
      await user.type(screen.getByLabelText(/password/i), specialPassword);
      await user.type(screen.getByLabelText(/api key/i), 'sk-test-key');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          password: specialPassword,
        })
      );
    });

    it('should handle very long API keys', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const longApiKey = 'sk-' + 'a'.repeat(100);
      await user.type(screen.getByLabelText(/password/i), 'testpassword');
      await user.type(screen.getByLabelText(/api key/i), longApiKey);
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          apiKey: longApiKey,
        })
      );
    });

    it('should trim whitespace from inputs', async () => {
      const user = userEvent.setup();
      mockOnAdd.mockResolvedValue(undefined);

      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      await user.type(screen.getByLabelText(/password/i), '  testpassword  ');
      await user.type(screen.getByLabelText(/api key/i), '  sk-test-key  ');
      await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

      const addButton = screen.getByText('Add Provider');
      await user.click(addButton);

      expect(mockOnAdd).toHaveBeenCalledWith(
        expect.objectContaining({
          password: 'testpassword',
          apiKey: 'sk-test-key',
        })
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper labels for all inputs', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
    });

    it('should have required attribute on required fields', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      expect(screen.getByLabelText(/password/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/api key/i)).toHaveAttribute('required');
      expect(screen.getByLabelText(/model/i)).toHaveAttribute('required');
    });

    it('should have proper modal role and overlay', () => {
      renderWithProviders(
        <AddProviderDialog
          open={true}
          onClose={mockOnClose}
          onAdd={mockOnAdd}
          username={testUsername}
        />
      );

      const modal = screen.getByText(/Add LLM Provider/i).closest('.modal-content');
      expect(modal).toBeInTheDocument();
      expect(modal?.parentElement).toHaveClass('modal-overlay');
    });
  });
});
