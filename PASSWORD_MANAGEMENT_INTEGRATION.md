# Password Management Integration Guide

## Overview

This document describes the password management infrastructure implemented for CCIDE's encrypted settings and LLM integration.

## Components Created

### 1. PasswordDialog Component (`src/components/common/PasswordDialog.tsx`)

A modal dialog for secure password entry with the following features:

- **Show/Hide Password Toggle**: Eye icon to reveal/hide password
- **Validation**: Minimum 8 characters required
- **Error Display**: Shows validation and authentication errors
- **Remember for Session**: Optional checkbox to store password in sessionStorage
- **Auto-Focus**: Automatically focuses the password input when opened
- **Keyboard Navigation**: ESC to close, Enter to submit

**Usage:**
```tsx
import { PasswordDialog } from '../components/common/PasswordDialog';

<PasswordDialog
  isOpen={showPasswordDialog}
  onClose={() => setShowPasswordDialog(false)}
  onSubmit={(password, remember) => handlePassword(password, remember)}
  error={passwordError}
  title="Unlock Settings"
  description="Your API keys are encrypted. Please enter your password."
  showRememberOption={true}
/>
```

### 2. usePasswordSession Hook (`src/hooks/usePasswordSession.ts`)

A custom hook for managing password sessions with security features:

- **In-Memory Storage**: Password stored in React state, cleared on unmount
- **Optional Persistence**: Can store in sessionStorage (obfuscated, not secure encryption)
- **Auto-Expiry**: 30-minute session timeout
- **Security Cleanup**: Automatically clears password from memory on unmount

**Usage:**
```tsx
import { usePasswordSession, usePasswordWarning } from '../../hooks/usePasswordSession';

const { password, hasPassword, setPassword, clearPassword } = usePasswordSession();
usePasswordWarning(hasPassword); // Shows browser warning when leaving with password in memory
```

### 3. SettingsHelper Utilities (`src/services/SettingsHelper.ts`)

Helper functions for working with encrypted settings:

- **getActiveModelConfig(modelId, password)**: Get decrypted model configuration
- **getDefaultModelConfig(password)**: Get default model with decrypted API key
- **validatePassword(password)**: Quickly validate password without full decryption
- **hasEncryptedSettings()**: Check if settings are encrypted
- **getAvailableModels()**: Get model metadata without API keys
- **clearConfigCache()**: Clear cached configurations

**Features:**
- **Caching**: Decrypted configs cached in memory for 5 minutes
- **Performance**: Avoids repeated decryption operations
- **Security**: Cache is only in memory, never persisted

**Usage:**
```tsx
import { validatePassword, getDefaultModelConfig } from '../../services/SettingsHelper';

// Validate password
const isValid = await validatePassword(password);

// Get decrypted model config
const modelConfig = await getDefaultModelConfig(password);
if (modelConfig) {
  // Use modelConfig.apiKey for LLM calls
}
```

### 4. SecurityStatus Component (`src/components/common/SecurityStatus.tsx`)

Visual indicators for encryption status:

- **SecurityStatus**: Full status display with unlock button
- **SecurityStatusBadge**: Compact badge for headers/footers

**Usage:**
```tsx
import { SecurityStatus, SecurityStatusBadge } from '../../components/common/SecurityStatus';

<SecurityStatus
  isUnlocked={hasPassword}
  onUnlockClick={() => setShowPasswordDialog(true)}
/>

<SecurityStatusBadge
  isUnlocked={hasPassword}
  onClick={() => setShowPasswordDialog(true)}
/>
```

## Integration Example

Here's how to integrate password management into a component that needs to call LLM APIs:

```tsx
import React, { useState } from 'react';
import { PasswordDialog } from '../components/common/PasswordDialog';
import { usePasswordSession, usePasswordWarning } from '../hooks/usePasswordSession';
import { validatePassword, getDefaultModelConfig } from '../services/SettingsHelper';
import { LLMServiceFactory } from '../services/LLMService';

export const MyComponent: React.FC = () => {
  const [showPasswordDialog, setShowPasswordDialog] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // Use password session hook
  const { password, hasPassword, setPassword, clearPassword } = usePasswordSession();
  usePasswordWarning(hasPassword);

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

  const sendMessageToLLM = async (message: string) => {
    // Check if we need password
    if (!password) {
      setShowPasswordDialog(true);
      return;
    }

    try {
      // Get decrypted model config
      const modelConfig = await getDefaultModelConfig(password);

      if (!modelConfig || modelConfig.apiKey === '***ENCRYPTED***') {
        // Password is wrong, clear and ask again
        clearPassword();
        setPasswordError('Failed to decrypt API key. Please try again.');
        setShowPasswordDialog(true);
        return;
      }

      // Initialize LLM service
      const llmService = LLMServiceFactory.createService({
        provider: modelConfig.provider,
        model: modelConfig.modelName,
        apiKey: modelConfig.apiKey,
        endpoint: modelConfig.endpoint,
        maxTokens: modelConfig.maxTokens,
        temperature: modelConfig.temperature,
      });

      // Send request
      const response = await llmService.sendRequest({
        messages: [{ role: 'user', content: message }],
      });

      console.log('Response:', response.text);
    } catch (error) {
      // Handle decryption errors
      if (error.message.includes('decrypt') || error.message.includes('password')) {
        clearPassword();
        setPasswordError('Session expired. Please enter your password again.');
        setShowPasswordDialog(true);
      } else {
        console.error('Error:', error);
      }
    }
  };

  return (
    <div>
      {/* Your component UI */}

      <PasswordDialog
        isOpen={showPasswordDialog}
        onClose={() => {
          setShowPasswordDialog(false);
          setPasswordError('');
        }}
        onSubmit={handlePasswordSubmit}
        error={passwordError}
        title="Unlock Settings"
        description="Your API keys are encrypted. Please enter your password."
        showRememberOption={true}
      />
    </div>
  );
};
```

## Security Considerations

### Strong Points

1. **Password Never Logged**: Code ensures passwords are never logged or exposed
2. **In-Memory Storage**: Primary storage is in React state (memory only)
3. **Auto-Clear**: Password cleared on component unmount
4. **Session Timeout**: 30-minute auto-expiry
5. **Browser Warning**: Warns user when leaving page with password in memory
6. **Validation**: Minimum 8 characters enforced

### Limitations

1. **SessionStorage Obfuscation**: The "encryption" in sessionStorage is just obfuscation (XOR with constant), not cryptographically secure
2. **XSS Vulnerability**: If app has XSS vulnerabilities, password in memory could be accessed
3. **No Server-Side Validation**: Password validation happens client-side only
4. **Cache in Memory**: Decrypted configs cached in JS memory for performance

### Recommendations

1. **Use HTTPS**: Always serve CCIDE over HTTPS to prevent network sniffing
2. **Content Security Policy**: Implement strict CSP to prevent XSS
3. **Clear on Lock**: Provide explicit "Lock" button to clear password
4. **Audit Trail**: Consider logging password unlock events (without password value)
5. **Rate Limiting**: Add rate limiting to password validation attempts

## Testing

The implementation includes test files:

- `src/tests/unit/hooks/usePasswordSession.test.ts`: Tests for password session hook
- Integration tests can be added for the full flow

## Future Enhancements

1. **Biometric Authentication**: Support WebAuthn for fingerprint/face unlock
2. **Hardware Tokens**: Support for YubiKey or similar
3. **Multiple Password Tiers**: Different passwords for different sensitivity levels
4. **Auto-Lock on Idle**: Clear password after X minutes of inactivity
5. **Password Strength Meter**: Visual indicator of password strength
6. **Master Password Change**: UI flow to change encryption password

## Migration from Simple Implementation

If you have an existing simple password implementation, migration is straightforward:

1. Replace simple state with `usePasswordSession` hook
2. Replace basic password modal with `PasswordDialog` component
3. Use `SettingsHelper` functions instead of direct `SettingsService` calls
4. Add `SecurityStatus` indicator to your UI

Example migration:

**Before:**
```tsx
const [password, setPassword] = useState('');
```

**After:**
```tsx
const { password, setPassword, clearPassword, hasPassword } = usePasswordSession();
usePasswordWarning(hasPassword);
```

## Conclusion

This password management infrastructure provides a secure, user-friendly foundation for encrypted settings in CCIDE. The components are reusable, well-documented, and follow security best practices for client-side applications.

For questions or improvements, refer to the source code comments or update this documentation.
