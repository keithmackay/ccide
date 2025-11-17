# Settings Provider Management Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign settings page to simplify LLM provider management with inline authentication, encrypted storage, and activity-based session timeout.

**Architecture:** Three-tab settings UI (LLM Config, Account, About) with password-based encryption for API keys. Session timeout based on conversation activity (30 min). Security gates for sensitive operations (delete, change default).

**Tech Stack:** React, TypeScript, Web Crypto API (AES-GCM), IndexedDB, Vitest

---

## Task 1: Simplify Account Tab

**Goal:** Remove all content from Account tab except "Change Password" and "Delete Account" buttons.

**Files:**
- Modify: `src/components/SettingsPage.tsx`

**Step 1: Read current SettingsPage implementation**

```bash
# Understand current structure
cat src/components/SettingsPage.tsx
```

**Step 2: Locate Account tab content**

Find the section rendering Account tab content (likely inside a conditional or tab panel).

**Step 3: Simplify Account tab to only two buttons**

Replace Account tab content with minimal UI:

```tsx
{activeTab === 'account' && (
  <div className="account-tab">
    <h2>Account</h2>
    <div className="account-actions">
      <button
        onClick={handleChangePassword}
        className="btn btn-primary"
      >
        Change Password
      </button>
      <button
        onClick={handleDeleteAccount}
        className="btn btn-danger"
      >
        Delete Account
      </button>
    </div>
  </div>
)}
```

**Step 4: Verify existing handlers work**

Ensure `handleChangePassword` and `handleDeleteAccount` are still defined and functional.

**Step 5: Test the UI manually**

```bash
npm run dev
```

Navigate to Settings → Account tab. Verify only two buttons appear.

**Step 6: Commit**

```bash
git add src/components/SettingsPage.tsx
git commit -m "feat: simplify Account tab to Change Password and Delete Account only

Remove all other account information from Account tab per redesign.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 2: Create AddProviderDialog Component

**Goal:** Create dialog for adding new LLM providers with inline authentication.

**Files:**
- Create: `src/components/Settings/AddProviderDialog.tsx`
- Create: `src/tests/unit/components/AddProviderDialog.test.tsx`

**Step 1: Write failing test**

```tsx
// src/tests/unit/components/AddProviderDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import AddProviderDialog from '../../../components/Settings/AddProviderDialog';

describe('AddProviderDialog', () => {
  it('should render with username auto-filled from session', () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();

    render(
      <AddProviderDialog
        open={true}
        onClose={onClose}
        onAdd={onAdd}
        username="testuser"
      />
    );

    const usernameInput = screen.getByLabelText(/username/i) as HTMLInputElement;
    expect(usernameInput.value).toBe('testuser');
    expect(usernameInput.disabled).toBe(true);
  });

  it('should show all required fields', () => {
    const onClose = vi.fn();
    const onAdd = vi.fn();

    render(
      <AddProviderDialog
        open={true}
        onClose={onClose}
        onAdd={onAdd}
        username="testuser"
      />
    );

    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/provider/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/api key/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/model/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/tests/unit/components/AddProviderDialog.test.tsx
```

Expected: FAIL - Component doesn't exist

**Step 3: Create minimal component**

```tsx
// src/components/Settings/AddProviderDialog.tsx
import React, { useState } from 'react';

interface AddProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onAdd: (config: {
    username: string;
    password: string;
    provider: string;
    apiKey: string;
    modelName: string;
    isDefault: boolean;
    endpoint?: string;
  }) => Promise<void>;
  username: string;
}

const AddProviderDialog: React.FC<AddProviderDialogProps> = ({
  open,
  onClose,
  onAdd,
  username,
}) => {
  const [password, setPassword] = useState('');
  const [provider, setProvider] = useState<'anthropic' | 'openai' | 'custom'>('anthropic');
  const [apiKey, setApiKey] = useState('');
  const [modelName, setModelName] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [endpoint, setEndpoint] = useState('');

  const providerModels = {
    anthropic: [
      'claude-sonnet-4-5-20250929',
      'claude-3-7-sonnet-20250219',
      'claude-3-5-sonnet-20241022',
      'claude-3-5-haiku-20241022',
      'claude-3-opus-20240229',
    ],
    openai: [
      'gpt-4-turbo',
      'gpt-4',
      'gpt-3.5-turbo',
      'gpt-4o',
      'gpt-4o-mini',
    ],
    custom: [],
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Add LLM Provider</h2>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            disabled
            className="form-control"
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="provider">Provider</label>
          <select
            id="provider"
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value as any);
              setModelName('');
            }}
            className="form-control"
          >
            <option value="anthropic">Anthropic</option>
            <option value="openai">OpenAI</option>
            <option value="custom">Custom</option>
          </select>
        </div>

        <div className="form-group">
          <label htmlFor="apiKey">API Key</label>
          <input
            id="apiKey"
            type="password"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="model">Model</label>
          {provider === 'custom' ? (
            <input
              id="model"
              type="text"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="form-control"
              placeholder="Enter model name"
              required
            />
          ) : (
            <select
              id="model"
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              className="form-control"
              required
            >
              <option value="">Select model</option>
              {providerModels[provider].map((model) => (
                <option key={model} value={model}>
                  {model}
                </option>
              ))}
            </select>
          )}
        </div>

        {provider === 'custom' && (
          <div className="form-group">
            <label htmlFor="endpoint">Custom Endpoint</label>
            <input
              id="endpoint"
              type="url"
              value={endpoint}
              onChange={(e) => setEndpoint(e.target.value)}
              className="form-control"
              placeholder="https://api.example.com"
            />
          </div>
        )}

        <div className="form-group">
          <label>
            <input
              type="checkbox"
              checked={isDefault}
              onChange={(e) => setIsDefault(e.target.checked)}
            />
            Set as default provider
          </label>
        </div>

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary">
            Cancel
          </button>
          <button
            onClick={async () => {
              await onAdd({
                username,
                password,
                provider,
                apiKey,
                modelName,
                isDefault,
                endpoint: provider === 'custom' ? endpoint : undefined,
              });
              onClose();
            }}
            className="btn btn-primary"
            disabled={!password || !apiKey || !modelName}
          >
            Add Provider
          </button>
        </div>
      </div>
    </div>
  );
};

export default AddProviderDialog;
```

**Step 4: Run test to verify it passes**

```bash
npm test src/tests/unit/components/AddProviderDialog.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/AddProviderDialog.tsx src/tests/unit/components/AddProviderDialog.test.tsx
git commit -m "feat: add AddProviderDialog component with inline authentication

- Username auto-filled and disabled
- Password field for encryption
- Provider dropdown (Anthropic, OpenAI, Custom)
- API key field (password type)
- Model selection (dropdown or text for custom)
- Custom endpoint for custom providers
- Set as default checkbox
- Validation for required fields

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 3: Create ConfirmDeleteProviderDialog Component

**Goal:** Create confirmation dialog for deleting providers with re-authentication.

**Files:**
- Create: `src/components/Settings/ConfirmDeleteProviderDialog.tsx`
- Create: `src/tests/unit/components/ConfirmDeleteProviderDialog.test.tsx`

**Step 1: Write failing test**

```tsx
// src/tests/unit/components/ConfirmDeleteProviderDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ConfirmDeleteProviderDialog from '../../../components/Settings/ConfirmDeleteProviderDialog';

describe('ConfirmDeleteProviderDialog', () => {
  it('should show provider details', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteProviderDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        providerName="Anthropic"
        modelName="claude-sonnet-4-5-20250929"
      />
    );

    expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
    expect(screen.getByText(/claude-sonnet-4-5-20250929/)).toBeInTheDocument();
  });

  it('should require username and password', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ConfirmDeleteProviderDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        providerName="Anthropic"
        modelName="claude-sonnet-4-5-20250929"
      />
    );

    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/tests/unit/components/ConfirmDeleteProviderDialog.test.tsx
```

Expected: FAIL - Component doesn't exist

**Step 3: Create minimal component**

```tsx
// src/components/Settings/ConfirmDeleteProviderDialog.tsx
import React, { useState } from 'react';

interface ConfirmDeleteProviderDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  providerName: string;
  modelName: string;
}

const ConfirmDeleteProviderDialog: React.FC<ConfirmDeleteProviderDialogProps> = ({
  open,
  onClose,
  onConfirm,
  providerName,
  modelName,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setIsDeleting(true);

    try {
      await onConfirm(username, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete provider');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Delete Provider</h2>

        <div className="warning-message">
          <p>Are you sure you want to delete this provider configuration?</p>
          <p><strong>{providerName}</strong> ({modelName})</p>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={isDeleting}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-danger"
            disabled={!username || !password || isDeleting}
          >
            {isDeleting ? 'Deleting...' : 'Delete Provider'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmDeleteProviderDialog;
```

**Step 4: Run test to verify it passes**

```bash
npm test src/tests/unit/components/ConfirmDeleteProviderDialog.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/ConfirmDeleteProviderDialog.tsx src/tests/unit/components/ConfirmDeleteProviderDialog.test.tsx
git commit -m "feat: add ConfirmDeleteProviderDialog with re-authentication

- Shows provider name and model to be deleted
- Requires username/password re-entry (security gate)
- Warning message about deletion
- Error handling for invalid credentials
- Loading state during deletion

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 4: Create ChangeDefaultModelDialog Component

**Goal:** Create dialog for changing default model with re-authentication.

**Files:**
- Create: `src/components/Settings/ChangeDefaultModelDialog.tsx`
- Create: `src/tests/unit/components/ChangeDefaultModelDialog.test.tsx`

**Step 1: Write failing test**

```tsx
// src/tests/unit/components/ChangeDefaultModelDialog.test.tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChangeDefaultModelDialog from '../../../components/Settings/ChangeDefaultModelDialog';

describe('ChangeDefaultModelDialog', () => {
  it('should show current and new default', () => {
    const onClose = vi.fn();
    const onConfirm = vi.fn();

    render(
      <ChangeDefaultModelDialog
        open={true}
        onClose={onClose}
        onConfirm={onConfirm}
        currentDefault={{ provider: 'Anthropic', model: 'claude-3-opus-20240229' }}
        newDefault={{ provider: 'OpenAI', model: 'gpt-4-turbo' }}
      />
    );

    expect(screen.getByText(/Anthropic/)).toBeInTheDocument();
    expect(screen.getByText(/claude-3-opus-20240229/)).toBeInTheDocument();
    expect(screen.getByText(/OpenAI/)).toBeInTheDocument();
    expect(screen.getByText(/gpt-4-turbo/)).toBeInTheDocument();
  });
});
```

**Step 2: Run test to verify it fails**

```bash
npm test src/tests/unit/components/ChangeDefaultModelDialog.test.tsx
```

Expected: FAIL - Component doesn't exist

**Step 3: Create minimal component**

```tsx
// src/components/Settings/ChangeDefaultModelDialog.tsx
import React, { useState } from 'react';

interface ChangeDefaultModelDialogProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (username: string, password: string) => Promise<void>;
  currentDefault: {
    provider: string;
    model: string;
  };
  newDefault: {
    provider: string;
    model: string;
  };
}

const ChangeDefaultModelDialog: React.FC<ChangeDefaultModelDialogProps> = ({
  open,
  onClose,
  onConfirm,
  currentDefault,
  newDefault,
}) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isChanging, setIsChanging] = useState(false);

  const handleConfirm = async () => {
    setError('');
    setIsChanging(true);

    try {
      await onConfirm(username, password);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to change default model');
    } finally {
      setIsChanging(false);
    }
  };

  if (!open) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2>Change Default Model</h2>

        <div className="change-summary">
          <div className="current-default">
            <strong>Current default:</strong>
            <p>{currentDefault.provider} ({currentDefault.model})</p>
          </div>
          <div className="arrow">→</div>
          <div className="new-default">
            <strong>New default:</strong>
            <p>{newDefault.provider} ({newDefault.model})</p>
          </div>
        </div>

        <div className="form-group">
          <label htmlFor="username">Username</label>
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="form-control"
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control"
            required
          />
        </div>

        {error && (
          <div className="error-message">
            {error}
          </div>
        )}

        <div className="modal-actions">
          <button onClick={onClose} className="btn btn-secondary" disabled={isChanging}>
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="btn btn-primary"
            disabled={!username || !password || isChanging}
          >
            {isChanging ? 'Changing...' : 'Confirm'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChangeDefaultModelDialog;
```

**Step 4: Run test to verify it passes**

```bash
npm test src/tests/unit/components/ChangeDefaultModelDialog.test.tsx
```

Expected: PASS

**Step 5: Commit**

```bash
git add src/components/Settings/ChangeDefaultModelDialog.tsx src/tests/unit/components/ChangeDefaultModelDialog.test.tsx
git commit -m "feat: add ChangeDefaultModelDialog with re-authentication

- Shows current default → new default
- Requires username/password re-entry (security gate)
- Error handling for invalid credentials
- Loading state during change

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 5: Integrate Dialogs into SettingsPage

**Goal:** Wire up new dialogs to SettingsPage and implement provider management.

**Files:**
- Modify: `src/components/SettingsPage.tsx`

**Step 1: Import new dialog components**

Add imports at top of SettingsPage.tsx:

```tsx
import AddProviderDialog from './Settings/AddProviderDialog';
import ConfirmDeleteProviderDialog from './Settings/ConfirmDeleteProviderDialog';
import ChangeDefaultModelDialog from './Settings/ChangeDefaultModelDialog';
import { SettingsService } from '../services/SettingsService';
import { AccountService } from '../services/AccountService';
import { SettingsHelper } from '../services/SettingsHelper';
import { usePasswordSession } from '../hooks/usePasswordSession';
```

**Step 2: Add state for dialogs**

```tsx
const [showAddProvider, setShowAddProvider] = useState(false);
const [deleteTarget, setDeleteTarget] = useState<{id: string, provider: string, model: string} | null>(null);
const [changeDefaultTarget, setChangeDefaultTarget] = useState<{id: string, provider: string, model: string} | null>(null);
const [providers, setProviders] = useState<StoredLLMConfig[]>([]);
```

**Step 3: Add usePasswordSession hook**

```tsx
const { password, setPassword } = usePasswordSession();
```

**Step 4: Add load providers function**

```tsx
const loadProviders = async () => {
  if (!password) {
    // Trigger re-auth modal
    return;
  }

  try {
    const configs = await SettingsService.getLLMConfigs(password);
    setProviders(configs);
  } catch (error) {
    console.error('Failed to load providers:', error);
  }
};

useEffect(() => {
  loadProviders();
}, [password]);
```

**Step 5: Add handleAddProvider function**

```tsx
const handleAddProvider = async (config: {
  username: string;
  password: string;
  provider: string;
  apiKey: string;
  modelName: string;
  isDefault: boolean;
  endpoint?: string;
}) => {
  try {
    // Verify credentials
    const loginResult = await AccountService.login(config.username, config.password);
    if (!loginResult) {
      throw new Error('Invalid username or password');
    }

    // Store password in session
    setPassword(config.password);

    // Generate unique ID
    const id = crypto.randomUUID();

    // Create config
    const newConfig: StoredLLMConfig = {
      id,
      provider: config.provider as any,
      modelName: config.modelName,
      apiKey: config.apiKey,
      isDefault: config.isDefault,
      endpoint: config.endpoint,
    };

    // Add to settings
    await SettingsService.addLLMConfig(newConfig, config.password);

    // Clear config cache
    SettingsHelper.clearConfigCache();

    // Reload providers
    await loadProviders();

    setShowAddProvider(false);
  } catch (error) {
    console.error('Failed to add provider:', error);
    throw error;
  }
};
```

**Step 6: Add handleDeleteProvider function**

```tsx
const handleDeleteProvider = async (username: string, password: string) => {
  if (!deleteTarget) return;

  try {
    // Verify credentials
    const verified = await AccountService.verifyPasswordOnly(username, password);
    if (!verified) {
      throw new Error('Invalid username or password');
    }

    // Delete provider
    await SettingsService.removeLLMConfig(deleteTarget.id);

    // Clear config cache
    SettingsHelper.clearConfigCache();

    // Reload providers
    await loadProviders();

    // Check if deleted was default
    const wasDefault = providers.find(p => p.id === deleteTarget.id)?.isDefault;
    if (wasDefault && providers.length > 1) {
      // Prompt to select new default
      alert('Please select a new default provider');
    }

    setDeleteTarget(null);
  } catch (error) {
    console.error('Failed to delete provider:', error);
    throw error;
  }
};
```

**Step 7: Add handleChangeDefault function**

```tsx
const handleChangeDefault = async (username: string, password: string) => {
  if (!changeDefaultTarget) return;

  try {
    // Verify credentials
    const verified = await AccountService.verifyPasswordOnly(username, password);
    if (!verified) {
      throw new Error('Invalid username or password');
    }

    // Update isDefault flags
    const updatedProviders = providers.map(p => ({
      ...p,
      isDefault: p.id === changeDefaultTarget.id,
    }));

    // Save all configs
    await SettingsService.saveLLMConfigs(updatedProviders, password);

    // Clear config cache
    SettingsHelper.clearConfigCache();

    // Reload providers
    await loadProviders();

    setChangeDefaultTarget(null);
  } catch (error) {
    console.error('Failed to change default:', error);
    throw error;
  }
};
```

**Step 8: Add provider list UI to LLM Configuration tab**

```tsx
{activeTab === 'llm' && (
  <div className="llm-config-tab">
    <h2>LLM Configuration</h2>

    <button
      onClick={() => setShowAddProvider(true)}
      className="btn btn-primary"
    >
      Add Provider
    </button>

    <div className="provider-list">
      {providers.map(provider => (
        <div key={provider.id} className="provider-card">
          <div className="provider-info">
            <h3>{provider.provider}</h3>
            <p>{provider.modelName}</p>
            {provider.isDefault && <span className="badge">Default</span>}
          </div>
          <div className="provider-actions">
            {!provider.isDefault && (
              <button
                onClick={() => setChangeDefaultTarget({
                  id: provider.id,
                  provider: provider.provider,
                  model: provider.modelName,
                })}
                className="btn btn-sm"
              >
                Set as Default
              </button>
            )}
            <button
              onClick={() => setDeleteTarget({
                id: provider.id,
                provider: provider.provider,
                model: provider.modelName,
              })}
              className="btn btn-icon btn-danger"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  </div>
)}
```

**Step 9: Add dialog components at bottom of render**

```tsx
<AddProviderDialog
  open={showAddProvider}
  onClose={() => setShowAddProvider(false)}
  onAdd={handleAddProvider}
  username={/* get from account service */}
/>

<ConfirmDeleteProviderDialog
  open={deleteTarget !== null}
  onClose={() => setDeleteTarget(null)}
  onConfirm={handleDeleteProvider}
  providerName={deleteTarget?.provider || ''}
  modelName={deleteTarget?.model || ''}
/>

<ChangeDefaultModelDialog
  open={changeDefaultTarget !== null}
  onClose={() => setChangeDefaultTarget(null)}
  onConfirm={handleChangeDefault}
  currentDefault={
    providers.find(p => p.isDefault)
      ? { provider: providers.find(p => p.isDefault)!.provider, model: providers.find(p => p.isDefault)!.modelName }
      : { provider: '', model: '' }
  }
  newDefault={
    changeDefaultTarget
      ? { provider: changeDefaultTarget.provider, model: changeDefaultTarget.model }
      : { provider: '', model: '' }
  }
/>
```

**Step 10: Test UI manually**

```bash
npm run dev
```

Test: Add provider, delete provider, change default

**Step 11: Commit**

```bash
git add src/components/SettingsPage.tsx
git commit -m "feat: integrate provider management dialogs into SettingsPage

- Add Provider button and dialog
- Provider cards with trash icons
- Change default model on click
- Load providers with password from session
- Clear cache after operations
- Re-authentication gates for sensitive operations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 6: Add Session Refresh to ConversationPane

**Goal:** Refresh password session on conversation activity (message send/receive).

**Files:**
- Modify: `src/components/ConversationPane.tsx` (or message handler component)

**Step 1: Find ConversationPane component**

```bash
find src -name "*Conversation*.tsx" -o -name "*Message*.tsx"
```

**Step 2: Import usePasswordSession**

```tsx
import { usePasswordSession } from '../hooks/usePasswordSession';
```

**Step 3: Add hook to component**

```tsx
const { refreshSession } = usePasswordSession();
```

**Step 4: Add refreshSession call to message send handler**

Find the function that handles sending messages. Add:

```tsx
const handleSendMessage = async (message: string) => {
  // Refresh session on user activity
  refreshSession();

  // ... existing message send logic
};
```

**Step 5: Add refreshSession call to message receive handler**

Find the function that handles receiving messages. Add:

```tsx
const handleMessageReceived = (message: Message) => {
  // Refresh session on LLM response
  refreshSession();

  // ... existing message receive logic
};
```

**Step 6: Add refreshSession call to streaming handler**

If there's a streaming response handler, add:

```tsx
const handleStreamChunk = (chunk: string) => {
  // Refresh session on each chunk
  refreshSession();

  // ... existing stream handling
};
```

**Step 7: Test session refresh**

```bash
npm run dev
```

Send a message. Verify session timer resets in dev tools.

**Step 8: Commit**

```bash
git add src/components/ConversationPane.tsx
git commit -m "feat: refresh password session on conversation activity

- Call refreshSession() on message send
- Call refreshSession() on message receive
- Call refreshSession() on streaming chunks
- Ensures 30-min timeout based on activity, not wall-clock time

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 7: Add Session Refresh to LLMService

**Goal:** Refresh password session after successful API calls.

**Files:**
- Modify: `src/services/LLMService.ts`

**Step 1: Review LLMService structure**

```bash
cat src/services/LLMService.ts | head -100
```

Understand how to pass session manager to service.

**Step 2: Add session refresh parameter to service constructor or method**

Option A: Pass session manager to constructor
```tsx
class ClaudeLLMService implements ILLMService {
  constructor(
    private config: LLMConfig,
    private sessionManager?: { refreshSession: () => void }
  ) {}
}
```

Option B: Pass to sendRequest method
```tsx
async sendRequest(
  request: LLMRequest,
  sessionManager?: { refreshSession: () => void }
): Promise<LLMResponse>
```

**Step 3: Add refreshSession call after successful API response**

```tsx
async sendRequest(request: LLMRequest): Promise<LLMResponse> {
  try {
    const response = await fetch(/* ... */);

    // Success - refresh session
    if (this.sessionManager) {
      this.sessionManager.refreshSession();
    }

    return response;
  } catch (error) {
    // Don't refresh on error
    throw error;
  }
}
```

**Step 4: Update service factory to pass session manager**

Find where LLMService is instantiated. Pass session manager:

```tsx
const service = LLMServiceFactory.createService(config, { refreshSession });
```

**Step 5: Test with actual LLM call**

```bash
npm run dev
```

Send message to LLM. Verify session refreshes.

**Step 6: Commit**

```bash
git add src/services/LLMService.ts
git commit -m "feat: refresh password session after successful LLM API calls

- Add session manager parameter to LLMService
- Call refreshSession() after successful API responses
- Don't refresh on errors
- Ensures session stays alive during active conversations

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 8: Add Missing Service Methods (if needed)

**Goal:** Ensure SettingsService has saveLLMConfigs method if missing.

**Files:**
- Modify: `src/services/SettingsService.ts` (if needed)

**Step 1: Check if saveLLMConfigs exists**

```bash
grep -n "saveLLMConfigs" src/services/SettingsService.ts
```

**Step 2: If missing, add saveLLMConfigs method**

```tsx
async saveLLMConfigs(configs: StoredLLMConfig[], password: string): Promise<void> {
  try {
    const settings = await this.getSettings();

    // Encrypt all API keys
    const encryptedConfigs = await Promise.all(
      configs.map(async (config) => ({
        ...config,
        apiKey: await this.encrypt(config.apiKey, password),
      }))
    );

    settings.llmConfigs = encryptedConfigs;
    settings.lastUpdated = Date.now();

    await Database.update('SETTINGS', settings);
  } catch (error) {
    console.error('Failed to save LLM configs:', error);
    throw error;
  }
}
```

**Step 3: Test the method**

Create a test or manually test saving multiple configs.

**Step 4: Commit (if changes made)**

```bash
git add src/services/SettingsService.ts
git commit -m "feat: add saveLLMConfigs method to SettingsService

Allows bulk update of provider configs with re-encryption.
Used for changing default model.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 9: Add Integration Tests

**Goal:** Test complete provider management flow end-to-end.

**Files:**
- Create: `src/tests/integration/provider-management.integration.test.tsx`

**Step 1: Write integration test**

```tsx
// src/tests/integration/provider-management.integration.test.tsx
import { describe, it, expect, beforeEach } from 'vitest';
import { SettingsService } from '../../services/SettingsService';
import { AccountService } from '../../services/AccountService';
import { SettingsHelper } from '../../services/SettingsHelper';

describe('Provider Management Integration', () => {
  const testUsername = 'testuser';
  const testPassword = 'testpassword123';

  beforeEach(async () => {
    // Create test account
    await AccountService.createAccount(testUsername, testPassword);
  });

  it('should add, change default, and delete provider', async () => {
    // Add first provider
    const config1 = {
      id: crypto.randomUUID(),
      provider: 'anthropic' as const,
      modelName: 'claude-sonnet-4-5-20250929',
      apiKey: 'test-key-1',
      isDefault: true,
    };

    await SettingsService.addLLMConfig(config1, testPassword);

    // Verify added
    const configs1 = await SettingsService.getLLMConfigs(testPassword);
    expect(configs1).toHaveLength(1);
    expect(configs1[0].isDefault).toBe(true);

    // Add second provider
    const config2 = {
      id: crypto.randomUUID(),
      provider: 'openai' as const,
      modelName: 'gpt-4-turbo',
      apiKey: 'test-key-2',
      isDefault: false,
    };

    await SettingsService.addLLMConfig(config2, testPassword);

    // Verify both exist
    const configs2 = await SettingsService.getLLMConfigs(testPassword);
    expect(configs2).toHaveLength(2);

    // Change default
    const updatedConfigs = configs2.map(c => ({
      ...c,
      isDefault: c.id === config2.id,
    }));

    await SettingsService.saveLLMConfigs(updatedConfigs, testPassword);

    // Verify default changed
    const configs3 = await SettingsService.getLLMConfigs(testPassword);
    const newDefault = configs3.find(c => c.id === config2.id);
    expect(newDefault?.isDefault).toBe(true);

    // Delete first provider
    await SettingsService.removeLLMConfig(config1.id);

    // Verify only one remains
    const configs4 = await SettingsService.getLLMConfigs(testPassword);
    expect(configs4).toHaveLength(1);
    expect(configs4[0].id).toBe(config2.id);
  });

  it('should clear cache after operations', async () => {
    const config = {
      id: crypto.randomUUID(),
      provider: 'anthropic' as const,
      modelName: 'claude-sonnet-4-5-20250929',
      apiKey: 'test-key',
      isDefault: true,
    };

    await SettingsService.addLLMConfig(config, testPassword);

    // Get config (caches it)
    const cached1 = await SettingsHelper.getActiveModelConfig();
    expect(cached1).toBeDefined();

    // Clear cache
    SettingsHelper.clearConfigCache();

    // Get again (should re-decrypt)
    const cached2 = await SettingsHelper.getActiveModelConfig();
    expect(cached2).toBeDefined();
  });
});
```

**Step 2: Run test**

```bash
npm test src/tests/integration/provider-management.integration.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/tests/integration/provider-management.integration.test.tsx
git commit -m "test: add integration tests for provider management

- Test add, change default, delete flow
- Test cache invalidation
- End-to-end verification of encryption/decryption

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 10: Add E2E Tests for UI

**Goal:** Test complete UI flow with user interactions.

**Files:**
- Create: `src/tests/e2e/provider-management.e2e.test.tsx`

**Step 1: Write E2E test**

```tsx
// src/tests/e2e/provider-management.e2e.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SettingsPage from '../../components/SettingsPage';

describe('Provider Management E2E', () => {
  it('should complete full provider management flow', async () => {
    const user = userEvent.setup();

    render(<SettingsPage />);

    // Navigate to LLM Configuration tab
    const llmTab = screen.getByText(/LLM Configuration/i);
    await user.click(llmTab);

    // Click Add Provider
    const addButton = screen.getByText(/Add Provider/i);
    await user.click(addButton);

    // Fill in form
    await user.type(screen.getByLabelText(/password/i), 'testpass123');
    await user.selectOptions(screen.getByLabelText(/provider/i), 'anthropic');
    await user.type(screen.getByLabelText(/api key/i), 'test-api-key');
    await user.selectOptions(screen.getByLabelText(/model/i), 'claude-sonnet-4-5-20250929');

    // Submit
    const submitButton = screen.getByText(/Add Provider/i);
    await user.click(submitButton);

    // Verify provider appears
    await waitFor(() => {
      expect(screen.getByText(/Anthropic/i)).toBeInTheDocument();
      expect(screen.getByText(/claude-sonnet-4-5-20250929/i)).toBeInTheDocument();
    });

    // Add second provider
    await user.click(addButton);
    await user.type(screen.getByLabelText(/password/i), 'testpass123');
    await user.selectOptions(screen.getByLabelText(/provider/i), 'openai');
    await user.type(screen.getByLabelText(/api key/i), 'test-api-key-2');
    await user.selectOptions(screen.getByLabelText(/model/i), 'gpt-4-turbo');
    await user.click(screen.getByText(/Add Provider/i));

    // Wait for second provider
    await waitFor(() => {
      expect(screen.getByText(/OpenAI/i)).toBeInTheDocument();
    });

    // Change default to second provider
    const setDefaultButton = screen.getAllByText(/Set as Default/i)[0];
    await user.click(setDefaultButton);

    // Re-authenticate
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'testpass123');
    await user.click(screen.getByText(/Confirm/i));

    // Verify default changed
    await waitFor(() => {
      expect(screen.getByText(/Default/i)).toBeInTheDocument();
    });

    // Delete first provider
    const deleteButtons = screen.getAllByText(/🗑️/);
    await user.click(deleteButtons[0]);

    // Confirm deletion
    await user.type(screen.getByLabelText(/username/i), 'testuser');
    await user.type(screen.getByLabelText(/password/i), 'testpass123');
    await user.click(screen.getByText(/Delete Provider/i));

    // Verify only one provider remains
    await waitFor(() => {
      const providers = screen.getAllByText(/OpenAI|Anthropic/i);
      expect(providers).toHaveLength(1);
    });
  });
});
```

**Step 2: Run test**

```bash
npm test src/tests/e2e/provider-management.e2e.test.tsx
```

Expected: PASS

**Step 3: Commit**

```bash
git add src/tests/e2e/provider-management.e2e.test.tsx
git commit -m "test: add E2E tests for provider management UI

- Test complete add/change/delete flow
- Test re-authentication dialogs
- Verify UI state changes
- User interaction simulation

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 11: Update Documentation

**Goal:** Document new provider management flow for users.

**Files:**
- Create: `docs/user-guide/provider-management.md`

**Step 1: Write user documentation**

```markdown
# LLM Provider Management

## Overview

Manage multiple LLM providers (Anthropic, OpenAI, Custom) with encrypted API key storage and activity-based session management.

## Adding a Provider

1. Navigate to **Settings** → **LLM Configuration**
2. Click **Add Provider**
3. Enter your password (for encryption)
4. Select provider (Anthropic, OpenAI, or Custom)
5. Paste your API key
6. Select model from dropdown
7. Optionally check "Set as default"
8. Click **Add Provider**

Your API key is encrypted with your password and stored securely in the browser.

## Changing Default Model

1. Click on any non-default provider card
2. Enter username and password to confirm
3. Click **Confirm**

The selected provider becomes your default for new conversations.

## Deleting a Provider

1. Click the trash icon (🗑️) on the provider card
2. Confirm provider name and model
3. Enter username and password
4. Click **Delete Provider**

If you delete the default provider, you'll be prompted to select a new default.

## Session Management

Your password session lasts **30 minutes of conversation inactivity**. The timer resets every time you:
- Send a message
- Receive a message from the LLM
- Receive streaming chunks

After 30 minutes of no conversation activity, you'll be prompted to re-enter your password.

## Security

- API keys encrypted with AES-GCM (256-bit)
- Password-based key derivation (PBKDF2, 100k iterations)
- Session timeout after inactivity
- Re-authentication required for sensitive operations
- Password never stored permanently

## Troubleshooting

**"Invalid username or password"**
- Verify credentials are correct
- Session may have expired - try logging in again

**"Failed to decrypt"**
- Password may be incorrect
- Try logging out and back in

**Session expired during conversation**
- Re-enter password in the modal
- Conversation will resume automatically
```

**Step 2: Commit documentation**

```bash
git add docs/user-guide/provider-management.md
git commit -m "docs: add user guide for provider management

Complete documentation for:
- Adding providers with encryption
- Changing default model
- Deleting providers
- Session management
- Security features
- Troubleshooting

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 12: Final Testing & Verification

**Goal:** Run all tests and verify complete functionality.

**Step 1: Run all tests**

```bash
npm test
```

Expected: All new tests pass, pre-existing failures unchanged

**Step 2: Run type checking**

```bash
npm run typecheck
```

Expected: No type errors

**Step 3: Run linting**

```bash
npm run lint
```

Expected: No lint errors in new code

**Step 4: Manual testing checklist**

Test each scenario:
- [ ] Add provider with Anthropic
- [ ] Add provider with OpenAI
- [ ] Add provider with Custom endpoint
- [ ] Set provider as default during add
- [ ] Change default model with re-auth
- [ ] Delete non-default provider
- [ ] Delete default provider (verify new default prompt)
- [ ] Session timeout after 30 min inactivity
- [ ] Session refresh on message send
- [ ] Session refresh on message receive
- [ ] Wrong password on add (verify error)
- [ ] Wrong password on delete (verify error)
- [ ] Wrong password on change default (verify error)
- [ ] Account tab only shows 2 buttons
- [ ] Provider cards show correct info
- [ ] Cache cleared after operations

**Step 5: Build for production**

```bash
npm run build
```

Expected: Clean build, no errors

**Step 6: Final commit**

```bash
git add .
git commit -m "test: verify complete provider management implementation

All tests passing:
- Unit tests for dialogs
- Integration tests for service layer
- E2E tests for UI flow
- Manual testing completed

Feature complete and ready for review.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"
```

---

## Task 13: Merge to Main

**Goal:** Merge feature branch back to main.

**Step 1: Ensure all tests pass**

```bash
npm test && npm run build
```

**Step 2: Push feature branch**

```bash
git push -u origin feature/settings-provider-management
```

**Step 3: Create pull request (or merge directly)**

Option A: Create PR on GitHub
```bash
gh pr create --title "Settings Provider Management Redesign" --body "Complete redesign of provider management with inline auth and encrypted storage"
```

Option B: Merge directly to main
```bash
git checkout main
git merge feature/settings-provider-management
git push origin main
```

**Step 4: Clean up worktree**

```bash
cd ../../..  # Back to main worktree
git worktree remove .worktrees/settings-provider-management
git branch -d feature/settings-provider-management  # If merged
```

---

## Implementation Complete

**Summary:**
- ✅ Account tab simplified
- ✅ AddProviderDialog with inline auth
- ✅ ConfirmDeleteProviderDialog with re-auth
- ✅ ChangeDefaultModelDialog with re-auth
- ✅ Session refresh on conversation activity
- ✅ Integration tests
- ✅ E2E tests
- ✅ User documentation

**Next Steps:**
1. Monitor for issues in production
2. Gather user feedback
3. Consider future enhancements (biometric unlock, sync across devices)

---

## Execution Options

Plan complete and saved to `docs/plans/2025-11-17-settings-provider-management.md`.

**Two execution options:**

**1. Subagent-Driven (this session)** - I dispatch fresh subagent per task, review between tasks, fast iteration with quality gates

**2. Parallel Session (separate)** - Open new session with executing-plans, batch execution with review checkpoints

**Which approach would you prefer?**
