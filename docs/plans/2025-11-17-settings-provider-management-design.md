# Settings Page Provider Management Redesign

**Date:** 2025-11-17
**Status:** Design Approved
**Author:** Claude Code

## Overview

Redesign the settings page to simplify LLM provider management by:
- Simplifying the Account tab to only "Change Password" and "Delete Account"
- Requiring username/password only when adding new providers
- Storing encrypted API keys using password-derived encryption
- Adding provider management UI (delete, change default)
- Implementing activity-based session timeout (30 minutes of conversation inactivity)

## Goals

1. **Simplified UX**: Username/password only required for provider operations, not every settings access
2. **Secure Storage**: All API keys encrypted with PBKDF2-derived AES-GCM keys
3. **Session-Based Access**: 30-minute timeout based on conversation activity, not wall-clock time
4. **Provider Management**: Easy add/delete providers with trash icons and confirmation dialogs
5. **Fresh Start**: No migration needed - clean slate for new encryption scheme

## Architecture

### UI Structure

**Three tabs:**
1. **LLM Configuration** (default/active)
   - List of configured providers (cards)
   - "Add Provider" button
   - Each card shows: provider name, model, "Default" badge (if applicable), trash icon
   - Click non-default card to change default model

2. **Account** (simplified)
   - "Change Password" button
   - "Delete Account" button
   - No other account information displayed

3. **About**
   - Existing content unchanged

### Component Architecture

```
SettingsPage.tsx (modified)
├── LLM Configuration Tab
│   ├── Add Provider Button → AddProviderDialog
│   └── Provider Cards List
│       ├── Provider Card (clickable)
│       │   ├── Provider Name + Model
│       │   ├── "Default" Badge (conditional)
│       │   └── Trash Icon → ConfirmDeleteProviderDialog
│       └── Change Default → ChangeDefaultModelDialog
│
├── Account Tab (simplified)
│   ├── Change Password Button → Change Password Dialog
│   └── Delete Account Button → Delete Account Dialog
│
└── About Tab (unchanged)
```

### New Components

1. **AddProviderDialog.tsx**
   - Username field (auto-filled from session)
   - Password field (for encryption key derivation)
   - Provider dropdown (Anthropic, OpenAI, Custom)
   - API Key field
   - Model dropdown (populated based on provider)
   - "Set as default" checkbox
   - Custom endpoint field (only for Custom provider)

2. **ConfirmDeleteProviderDialog.tsx**
   - Shows provider name and model to be deleted
   - Username/password re-entry (security gate)
   - Warning text
   - Verify credentials via `AccountService.verifyPasswordOnly()`

3. **ChangeDefaultModelDialog.tsx**
   - Shows: "Current default → New default"
   - Username/password re-entry (security gate)
   - Updates `isDefault` flags on all configs

### Modified Components

1. **SettingsPage.tsx**
   - Remove most Account tab content
   - Keep only "Change Password" and "Delete Account" buttons on Account tab
   - Add "Add Provider" button to LLM Configuration tab
   - Render provider cards with trash icons
   - Add click handlers for changing default

2. **ConversationPane.tsx** (or message handler component)
   - Import `usePasswordSession` hook
   - Call `refreshSession()` on:
     - User message submit
     - LLM response start
     - Each streaming chunk received
     - LLM response complete

3. **LLMService.ts**
   - Call `refreshSession()` after successful API calls
   - Handle session expiry by triggering `ReauthModal`

### Reused Components

- **ReauthModal.tsx** - For session expiry re-authentication
- **Change Password Dialog** - Enhanced to re-encrypt all providers
- **Delete Account Dialog** - Existing functionality

## Data Model

### No Schema Changes Required

Existing `SETTINGS` store structure supports this design:

```typescript
interface StoredLLMConfig {
  id: string;              // UUID for uniqueness
  provider: 'anthropic' | 'openai' | 'custom';
  modelName: string;
  apiKey: string;          // Encrypted with AES-GCM
  isDefault: boolean;
  maxTokens?: number;
  temperature?: number;
  endpoint?: string;       // For custom providers
}

interface Settings {
  id?: number;
  llmConfigs: StoredLLMConfig[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    defaultModel?: string;
    autoSave: boolean;
  };
  encryptedData?: string;  // JSON: {encrypted, keyInfo: {salt, iv}}
  lastUpdated: number;
}
```

### Encryption Strategy

**Password-Only Derivation:**
- Username used for authentication only, NOT encryption
- API keys encrypted with password-derived key using existing PBKDF2 approach
- Algorithm: AES-GCM with 256-bit keys
- Key derivation: PBKDF2 with SHA-256, 100,000 iterations
- Random 16-byte salt per settings object
- Random 12-byte IV per encryption operation

**Encryption Flow:**
```
Password → PBKDF2 (100k iterations, SHA-256, 16-byte salt) → 256-bit key
API Key + Key + Random IV → AES-GCM → Encrypted data
Store: {encrypted: base64, keyInfo: {salt: base64, iv: base64}}
```

**Decryption Flow:**
```
Password + Stored Salt → PBKDF2 → 256-bit key
Encrypted data + Key + Stored IV → AES-GCM decrypt → API Key
```

## Security Model

### Session Management

**Activity-Based Timeout:**
- Session timeout: 30 minutes of **conversation inactivity**
- Activity defined as: message sent or received in Conversation pane
- `usePasswordSession.refreshSession()` called on:
  - User sends message to LLM
  - LLM response received
  - Each chunk during streaming response
- Timer resets to full 30 minutes on each activity
- Password stored in memory only (not persistent storage)

**Password Session Hook** (`usePasswordSession`):
- Storage: In-memory React state + optional sessionStorage (XOR obfuscated)
- Duration: 30 minutes from last activity
- Auto-clear: On tab close or timeout
- Methods: `setPassword()`, `clearPassword()`, `refreshSession()`, `isSessionExpired()`

### Security Gates

**Operations requiring re-authentication:**
- Add provider (encrypt new API key)
- Delete provider (security gate)
- Change default model (security gate)
- Change password (re-encrypt all providers)
- Delete account (security gate)

**Operations using session password:**
- Normal LLM interactions (decrypt default provider's API key)
- Reading provider list (decrypt API keys for display)
- Config cache access (5-minute TTL)

### Config Cache

**Purpose:** Reduce decryption overhead during normal usage

**Behavior:**
- TTL: 5 minutes
- Caches decrypted `StoredLLMConfig` objects
- Managed by `SettingsHelper.getActiveModelConfig()`
- Invalidated on: add, delete, change default, password change
- Prevents repeated PBKDF2 operations during conversation

## User Flows

### Add Provider Flow

1. User clicks "Add Provider" button
2. `AddProviderDialog` opens with:
   - Username auto-filled from session
   - Empty password field
   - Provider dropdown (default: Anthropic)
   - Empty API key field
   - Model dropdown (populated with provider's models)
   - "Set as default" checkbox (checked if no providers exist)
3. User enters:
   - Password
   - Selects provider
   - Pastes API key
   - Selects model
   - Optionally checks "Set as default"
4. User clicks "Add"
5. System:
   - Verifies username/password via `AccountService.login()`
   - Generates UUID for provider ID
   - Encrypts API key: `SettingsService.encrypt(apiKey, password)`
   - Saves config: `SettingsService.addLLMConfig(config)`
   - Clears password from form memory
   - Password remains in session for continued use
   - Shows success message
   - Closes dialog
   - Refreshes provider list

### Delete Provider Flow

1. User clicks trash icon on provider card
2. `ConfirmDeleteProviderDialog` opens showing:
   - Provider name and model
   - Username/password fields (empty)
   - Warning: "This will delete the provider configuration"
3. User enters username/password
4. User clicks "Delete"
5. System:
   - Verifies credentials via `AccountService.verifyPasswordOnly()`
   - If invalid: show error, keep dialog open
   - If valid:
     - Remove config: `SettingsService.removeLLMConfig(id)`
     - If deleted provider was default:
       - If other providers exist: prompt to select new default
       - If only one remains: auto-set as default
       - If none remain: show "Add Provider" prompt
     - Clear password from form memory (session continues)
     - Clear config cache
     - Show success message
     - Close dialog
     - Refresh provider list

### Change Default Model Flow

1. User clicks on non-default provider card
2. `ChangeDefaultModelDialog` opens showing:
   - "Current default: [Provider] ([Model])"
   - "New default: [Provider] ([Model])"
   - Username/password fields (empty)
3. User enters username/password
4. User clicks "Confirm"
5. System:
   - Verifies credentials via `AccountService.verifyPasswordOnly()`
   - If invalid: show error, keep dialog open
   - If valid:
     - Update `isDefault` flags on all configs (only one true)
     - Save: `SettingsService.saveLLMConfigs()`
     - Clear password from form memory (session continues)
     - Clear config cache
     - Show success message
     - Close dialog
     - Refresh provider list

### Normal LLM Interaction Flow

1. User types message in Conversation pane
2. User sends message
3. System:
   - Calls `usePasswordSession.refreshSession()` (resets 30-min timer)
   - Retrieves default config: `SettingsHelper.getActiveModelConfig()`
     - If cached (< 5 min): return cached config
     - If not cached: decrypt using session password
   - Uses decrypted API key for LLM API call
   - **No re-authentication required** (within 30-min window)
4. LLM response streams in
5. System:
   - Calls `refreshSession()` on each chunk received
   - Displays response to user
6. Session timer reset to 30 minutes

### Session Expiry Flow

1. 30 minutes pass with NO conversation activity
2. Session expires (password cleared from memory)
3. User attempts to send message
4. System:
   - Detects expired session
   - Shows `ReauthModal` with username/password fields
5. User re-enters credentials
6. System:
   - Verifies via `AccountService.login()`
   - Restores password to session
   - Clears config cache
   - Re-decrypts default provider config
   - Resumes normal operation

### Change Password Flow

1. User clicks "Change Password" on Account tab
2. Dialog opens with:
   - Old password field
   - New password field
   - Confirm new password field
3. User enters passwords
4. User clicks "Change"
5. System:
   - Retrieves all encrypted configs
   - Decrypts each API key with old password
   - If decryption fails: show error "Invalid old password", abort
   - Generates new salt for password hash
   - Hashes new password: PBKDF2 with new salt
   - Re-encrypts each API key with new password
   - Updates account: `AccountService.changePassword()`
   - Saves all re-encrypted configs
   - Clears old password from memory
   - Updates session with new password
   - Clears config cache
   - Shows success message
   - **All-or-nothing:** Either all configs updated or none

### Delete Account Flow

1. User clicks "Delete Account" on Account tab
2. Dialog opens with:
   - Warning: "This will delete ALL data including conversations, providers, and projects"
   - Username/password fields
   - Confirmation checkbox: "I understand this cannot be undone"
3. User enters credentials and checks confirmation
4. User clicks "Delete Account"
5. System:
   - Verifies credentials via `AccountService.deleteAccount()`
   - If invalid: show error
   - If valid:
     - Clears all database stores: ACCOUNTS, SETTINGS, MESSAGES, PROJECTS
     - Clears session
     - Clears all caches
     - Redirects to account setup page

## Error Handling

### Session Expiry During Operation

**Scenario:** Password session expires while user is in Settings

**Handling:**
- Show `ReauthModal` immediately
- On successful re-auth:
  - Resume operation
  - Clear config cache
  - Re-decrypt with new password

### No Default Provider

**Scenario:** User deletes the default provider

**Handling:**
- If other providers exist:
  - Show dialog: "Select new default provider"
  - Present list of remaining providers
  - User selects new default
- If only one provider remains:
  - Auto-set as default
  - Show message: "X is now your default provider"
- If no providers remain:
  - Show empty state with "Add Provider" button
  - Message: "Add an LLM provider to get started"

### Decryption Failures

**Scenario:** Wrong password during add/delete/change operations

**Handling:**
- Show error: "Invalid username or password"
- Keep dialog open for retry
- Don't clear form fields (except password)
- Increment failed attempt counter (optional: lockout after N attempts)

### API Key Validation

**Approach:** No client-side validation

**Rationale:**
- API key formats vary by provider
- Validation would require actual API call
- Invalid keys fail gracefully during conversation

**Handling:**
- Allow any non-empty string as API key
- Invalid keys produce errors during LLM API calls
- Errors shown in conversation pane, not settings
- User can return to settings to update API key

### Config Cache Invalidation

**Trigger Events:**
- Add provider
- Delete provider
- Change default model
- Password change
- Session expiry

**Mechanism:**
- Call `SettingsHelper.clearConfigCache()`
- Next `getActiveModelConfig()` forces fresh decrypt

### Password Change with Multiple Providers

**Challenge:** Must re-encrypt all API keys

**Flow:**
1. Decrypt all existing API keys with old password
2. If ANY decryption fails:
   - Abort entire operation
   - Show error: "Invalid old password"
   - Don't proceed with ANY re-encryption
3. If all decrypt successfully:
   - Generate new password hash
   - Re-encrypt each API key with new password
   - Update account password
   - Save all re-encrypted configs
4. Clear old password, store new password in session

**Guarantee:** All-or-nothing atomicity

### Account Deletion

**Confirmation Required:**
- Username/password verification
- Warning dialog with explicit text
- Confirmation checkbox

**Deletion Process:**
- Verify credentials
- Clear ACCOUNTS store (removes account)
- Clear SETTINGS store (removes all LLM configs)
- Clear MESSAGES store (removes conversation history)
- Clear PROJECTS store (removes project metadata)
- Clear session and caches
- Redirect to account setup

**No Undo:** This is irreversible

## Migration Strategy

### Fresh Start Approach

**Decision:** No migration needed

**Rationale:**
- New encryption scheme is compatible with existing database structure
- Existing users can delete and re-add providers
- Simpler implementation than migrating encrypted data

**User Impact:**
- Existing providers must be deleted and re-added
- API keys must be re-entered
- Conversation history preserved (not encrypted with provider passwords)

**Communication:**
- Release notes: "LLM provider settings have been reset for enhanced security"
- Instructions: "Please re-add your LLM providers with API keys"

## Service Integration

### Existing Services (No Changes Needed)

**SettingsService.ts:**
- `encrypt(data, password)` - AES-GCM encryption
- `decrypt(encrypted, password, keyInfo)` - AES-GCM decryption
- `addLLMConfig(config)` - Add new provider config
- `removeLLMConfig(id)` - Delete provider config
- `saveLLMConfigs(configs)` - Update all configs
- `getLLMConfigs(password)` - Retrieve and decrypt all configs

**SettingsHelper.ts:**
- `getActiveModelConfig()` - Get default provider config (with cache)
- `clearConfigCache()` - Invalidate cache
- Cache TTL: 5 minutes

**AccountService.ts:**
- `login(username, password)` - Full authentication
- `verifyPasswordOnly(username, password)` - Re-auth without updating lastLogin
- `changePassword(username, oldPassword, newPassword)` - Update password with re-encryption
- `deleteAccount(username, password)` - Delete account and all data

**usePasswordSession Hook:**
- `setPassword(password)` - Store in session
- `clearPassword()` - Remove from session
- `refreshSession()` - Reset 30-min timer
- `isSessionExpired()` - Check expiry
- `getTimeUntilExpiry()` - Remaining time

### New Integration Points

**ConversationPane.tsx:**
```typescript
import { usePasswordSession } from '../hooks/usePasswordSession';

// In message handler
const handleSendMessage = async (message: string) => {
  const { refreshSession } = usePasswordSession();
  refreshSession(); // Reset session timer

  // Send message to LLM...
};

// In streaming response handler
const handleStreamChunk = (chunk: string) => {
  const { refreshSession } = usePasswordSession();
  refreshSession(); // Reset session timer

  // Display chunk...
};
```

**LLMService.ts:**
```typescript
// After successful API call
async sendMessage(message: string) {
  const response = await fetch(/* API call */);

  // Refresh session on successful response
  if (passwordSession) {
    passwordSession.refreshSession();
  }

  return response;
}
```

## Implementation Checklist

### Phase 1: UI Components
- [ ] Modify `SettingsPage.tsx` to simplify Account tab
- [ ] Remove Account tab content (keep only 2 buttons)
- [ ] Add "Add Provider" button to LLM Configuration tab
- [ ] Add trash icons to provider cards
- [ ] Add click handlers for changing default
- [ ] Create `AddProviderDialog.tsx` component
- [ ] Create `ConfirmDeleteProviderDialog.tsx` component
- [ ] Create `ChangeDefaultModelDialog.tsx` component

### Phase 2: Session Management
- [ ] Add `refreshSession()` calls to `ConversationPane.tsx`
- [ ] Add `refreshSession()` calls to message send handler
- [ ] Add `refreshSession()` calls to streaming response handler
- [ ] Add `refreshSession()` call to `LLMService.ts`
- [ ] Test 30-minute inactivity timeout
- [ ] Test timer reset on conversation activity

### Phase 3: Provider Operations
- [ ] Implement add provider flow with encryption
- [ ] Implement delete provider flow with confirmation
- [ ] Implement change default model flow
- [ ] Add auto-fill username from session
- [ ] Add password verification gates
- [ ] Test encryption/decryption cycles

### Phase 4: Error Handling
- [ ] Handle session expiry during operations
- [ ] Handle no default provider edge case
- [ ] Handle decryption failures
- [ ] Implement config cache invalidation
- [ ] Test password change with multiple providers
- [ ] Test account deletion flow

### Phase 5: Testing
- [ ] Test add provider with valid credentials
- [ ] Test add provider with invalid credentials
- [ ] Test delete provider confirmation
- [ ] Test change default model
- [ ] Test session timeout after 30 min inactivity
- [ ] Test session persistence during conversation
- [ ] Test password change re-encryption
- [ ] Test account deletion
- [ ] Test UI with 0, 1, 2, and 5+ providers

### Phase 6: Documentation
- [ ] Update user documentation
- [ ] Add release notes for breaking change
- [ ] Document new provider management flow
- [ ] Update security documentation

## Success Metrics

1. **Usability**
   - Users enter password once per 30-minute session
   - No re-authentication needed for normal conversations
   - Clear feedback on all operations

2. **Security**
   - All API keys encrypted with AES-GCM + PBKDF2
   - Password never persisted to disk
   - Session expires after inactivity
   - Re-authentication required for sensitive operations

3. **Reliability**
   - All-or-nothing password change (no partial updates)
   - Config cache prevents performance degradation
   - Clear error messages guide users

4. **Maintainability**
   - Reuses existing encryption services
   - No database schema changes
   - Clean component architecture

## Future Enhancements

- [ ] Multiple account support
- [ ] API key rotation reminders
- [ ] Export/import encrypted configs
- [ ] Provider usage analytics
- [ ] Biometric unlock (Touch ID / Face ID)
- [ ] Hardware security key support
- [ ] Sync across devices (encrypted)

---

**Design approved:** 2025-11-17
**Ready for implementation planning**
