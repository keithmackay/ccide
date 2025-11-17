# LLM Provider Management

## Overview

CCIDE provides secure, encrypted management of multiple LLM providers (Anthropic, OpenAI, Custom) with activity-based session management. Your API keys are encrypted using AES-GCM encryption and stored securely in your browser's IndexedDB.

## Key Features

- **Multi-Provider Support**: Configure Anthropic Claude, OpenAI GPT, or custom LLM endpoints
- **Encrypted Storage**: API keys encrypted with AES-GCM (256-bit) using PBKDF2 key derivation
- **Session Management**: 30-minute activity-based timeout with automatic re-authentication
- **Security Gates**: Re-authentication required for sensitive operations
- **Local-First**: All data stored locally in your browser, never leaves your device

## Getting Started

### First-Time Setup

1. Navigate to **Settings** (click the gear icon or press `Ctrl+,`)
2. You'll be prompted to create an encryption password
3. Enter a strong password (minimum 8 characters)
4. Click **Set Password**

> **Important**: This password is used to encrypt your API keys. If you forget it, you'll need to reset all your configurations.

## Managing LLM Providers

### Adding a Provider

1. Go to **Settings** → **LLM Configuration** tab
2. Click **Add LLM Configuration**
3. Select your provider:
   - **Anthropic**: For Claude models (Sonnet, Opus, Haiku)
   - **OpenAI**: For GPT models (GPT-4, GPT-3.5)
   - **Custom**: For self-hosted or other LLM endpoints
4. Enter your API key (it will be encrypted automatically)
5. Select a model from the dropdown (or enter custom model name)
6. Optionally set max tokens and temperature
7. Check **"Set as default model"** if you want to use this for new conversations
8. Click **Add Configuration**

### Removing a Provider

1. Find the provider in your configured models list
2. Click the **Remove** button
3. Confirm the deletion

> **Note**: If you remove your default provider and have other providers configured, you'll need to set a new default.

### Changing the Default Model

Currently, you can set a model as default when adding it. To change the default later, you'll need to add a new configuration with the "Set as default" option checked, or remove the current default and re-add your preferred model as default.

## Session Management

### How Sessions Work

Your password is kept in memory for **30 minutes of conversation inactivity**. The timer automatically resets when you:
- Send a message to the LLM
- Receive a response from the LLM
- Interact with LLM streaming responses

### Re-Authentication

When your session expires:
1. A modal dialog will appear
2. Enter your password to continue
3. Your conversation will resume automatically
4. The session timer resets to 30 minutes

### Session Security

- Password stored in memory only (cleared on tab close)
- Optional obfuscated sessionStorage (additional security layer)
- Automatic cleanup on browser tab close
- No permanent password storage

## Security Features

### Encryption

- **Algorithm**: AES-GCM (256-bit encryption)
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Hash Function**: SHA-256
- **Random IV**: Generated per encryption operation
- **Random Salt**: Generated per password

### Best Practices

1. **Use a strong password**: Minimum 8 characters, mix of letters, numbers, symbols
2. **Don't share your password**: Each browser/device should have its own setup
3. **Regular updates**: Periodically rotate your API keys
4. **Browser security**: Keep your browser up to date
5. **Secure environment**: Only use CCIDE on trusted devices

### What's Encrypted

- ✅ API keys
- ✅ Provider configurations
- ❌ Model names and provider types (metadata only)
- ❌ Preferences and non-sensitive settings

### What's Stored Locally

All data is stored in your browser's IndexedDB:
- Encrypted API keys
- Model configurations
- Conversation history
- Project data
- User preferences

**Nothing is sent to external servers** except when making API calls to your configured LLM providers.

## Exporting Settings

1. Go to **Settings** → **Account** tab
2. Unlock your settings (if locked)
3. Click **Export Settings**
4. Save the JSON file

> **Note**: Exported settings do NOT include your API keys for security reasons. The export contains only model metadata and preferences.

## Troubleshooting

### "Invalid Password" Error

**Problem**: Error when trying to unlock settings or add a provider

**Solutions**:
- Verify you're entering the correct password
- Check for caps lock or keyboard language
- If forgotten, you'll need to clear settings and start over

### "Failed to Decrypt" Error

**Problem**: Settings won't decrypt even with correct password

**Solutions**:
- Browser may have corrupted IndexedDB data
- Try logging out and back in
- Last resort: Clear browser data and reconfigure

### Session Expires Too Quickly

**Problem**: Re-authentication prompt appears too often

**Current Design**: Sessions expire after 30 minutes of **conversation inactivity**
- Timer resets on message send/receive
- Timer does NOT reset on UI interactions (clicking tabs, scrolling)

**Workaround**: Send a message or interact with the LLM to refresh the session

### No Models Available

**Problem**: Model dropdown is empty when trying to start a conversation

**Solutions**:
1. Go to Settings → LLM Configuration
2. Verify you have at least one provider configured
3. Unlock settings to decrypt your configurations
4. Ensure at least one model is set as default

### API Key Not Working

**Problem**: LLM requests fail with authentication errors

**Solutions**:
1. Verify your API key is valid on the provider's dashboard
2. Check for typos when entering the key
3. Ensure the key has proper permissions
4. Remove and re-add the provider configuration

## Advanced Configuration

### Custom Endpoints

For self-hosted LLMs or alternative providers:

1. Select **Custom** as provider
2. Enter your custom endpoint URL (e.g., `https://api.example.com`)
3. Enter the model name exactly as expected by your endpoint
4. Add your authentication key (if required)

### Multiple Models from Same Provider

You can configure multiple models from the same provider:
- Multiple Claude models (e.g., Sonnet for speed, Opus for quality)
- Multiple GPT models (e.g., GPT-4 and GPT-3.5)
- Each can have different temperature/token settings

## Privacy & Data Storage

### What Data is Stored

| Data Type | Location | Encrypted | Persists |
|-----------|----------|-----------|----------|
| API Keys | IndexedDB | ✅ Yes | Yes |
| Model Configs | IndexedDB | ✅ Yes | Yes |
| Password | Memory/SessionStorage | ⚠️ Obfuscated | No (30 min) |
| Conversations | IndexedDB | ❌ No | Yes |
| Preferences | IndexedDB | ❌ No | Yes |

### Clearing Data

To completely reset CCIDE:

1. Open browser DevTools (F12)
2. Go to Application → Storage
3. Clear Site Data for the CCIDE domain
4. Refresh the page

**Warning**: This will delete all conversations, projects, and settings. Cannot be undone.

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| Open Settings | `Ctrl+,` or `Cmd+,` |
| Close Settings | `Esc` |

## Planned Features

The following features are planned for future releases:

- **Inline authentication dialogs**: Add providers without navigating to settings
- **Change default model UI**: Click to set any model as default without re-adding
- **Security gates for deletion**: Re-authenticate before deleting providers
- **Biometric unlock**: Use fingerprint/face recognition where supported
- **Cross-device sync**: Optionally sync encrypted configs (with separate key)
- **API key testing**: Validate API keys before saving
- **Provider health monitoring**: Track API availability and quota usage

## Support

For issues, feature requests, or questions:
- GitHub Issues: [https://github.com/ccide/ccide/issues](https://github.com/ccide/ccide/issues)
- Documentation: [https://github.com/ccide/ccide/docs](https://github.com/ccide/ccide/docs)

## Changelog

### Version 0.2.0 (Current)
- ✅ Encrypted API key storage
- ✅ Activity-based session timeout (30 min)
- ✅ Multi-provider support (Anthropic, OpenAI, Custom)
- ✅ Re-authentication modal on session expire
- ✅ Password-based encryption (AES-GCM)

### Version 0.1.0
- Basic conversation management
- Project organization
- Analytics tracking
