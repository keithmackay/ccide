# LLM Service Initialization and Conversation Flow

## Overview

CCIDE automatically initializes the LLM service when users log in, using their configured default model and provider. All conversations are then routed through this initialized service.

## Complete Flow

### 1. User Login

When a user logs in:
```typescript
// LoginScreen.tsx
const validPassword = await accountService.login(username, password);
onLoginSuccess(validPassword); // Pass password to App

// App.tsx
const handleLoginSuccess = (loginPassword: string) => {
  setPassword(loginPassword, true); // Store in session
  setIsAuthenticated(true);
};
```

### 2. LLM Service Initialization (Automatic)

**Trigger:** Password becomes available in session
**Location:** `src/App.tsx:84-142`

```typescript
useEffect(() => {
  const initLLMService = async () => {
    if (!password) {
      resetLLMService();
      return;
    }

    // 1. Get default model config with decrypted API key
    const modelConfig = await getDefaultModelConfig(password);

    if (!modelConfig) {
      console.log('No default model configured');
      return;
    }

    // 2. Convert to LLM config format
    const llmConfig: LLMConfig = {
      provider: modelConfig.provider,
      model: modelConfig.modelName,
      apiKey: modelConfig.apiKey, // Decrypted
      endpoint: modelConfig.endpoint,
      maxTokens: modelConfig.maxTokens,
      temperature: modelConfig.temperature,
    };

    // 3. Initialize global LLM service instance
    initializeLLMService(llmConfig);

    // Service is now ready for all conversations
  };

  initLLMService();
}, [password]); // Runs when password changes
```

### 3. Console Output on Successful Initialization

```
═══════════════════════════════════════════════════
[App] 🔐 User logged in - Initializing LLM service...
═══════════════════════════════════════════════════
[App] ✓ Default model config retrieved:
  → Provider: anthropic
  → Model: claude-sonnet-4-5-20250929
  → Endpoint: proxy (default)
  → API key: ✓ present
  → API key length: 108 chars
  → Max tokens: 4096
  → Temperature: 0.7

[App] ✅ LLM service initialized successfully!
[App] 🚀 All conversations will use: claude-sonnet-4-5-20250929
[App] 🔄 Conversations will be routed through configured LLM service
═══════════════════════════════════════════════════
```

### 4. Visual Confirmation in UI

When LLM service is initialized, users see a status banner:

```
┌────────────────────────────────────────────────┐
│ ● Using claude-sonnet-4-5-20250929 (anthropic)│
└────────────────────────────────────────────────┘
```

**Indicator:**
- Green pulsing dot = Service active
- Shows model name and provider
- Only appears when service is configured

### 5. Conversation Routing

**Every conversation message:**

```typescript
// ConversationView.tsx:103-108
try {
  llmService = getLLMService(); // Get initialized service
  console.log('[ConversationView] ✓ LLM service retrieved successfully');
  console.log('[ConversationView] Using model:', selectedModel?.name);
  console.log('[ConversationView] Provider:', selectedModel?.provider);
  console.log('[ConversationView] All conversations will use this configured LLM service');
} catch (err) {
  // Falls back to simulated responses if not configured
  llmService = null;
}
```

**Request Flow:**
```
User Message
    ↓
ConversationView.handleSendWithStreaming()
    ↓
getLLMService() → Returns initialized instance
    ↓
llmService.streamRequest({ messages, systemPrompt })
    ↓
ClaudeLLMService or OpenAILLMService
    ↓
Proxy Server (http://localhost:3001)
    ↓
LLM Provider API (Anthropic/OpenAI)
    ↓
Streaming response back to UI
```

## Configuration Requirements

### For LLM Service to Initialize:

1. **Account Created**
   - User has account in CCIDE
   - Account password set

2. **User Logged In**
   - Password available in session
   - Session not expired

3. **Default Model Configured**
   - At least one LLM configuration exists
   - One configuration marked as "default"
   - API key encrypted and stored

4. **Proxy Server Running**
   - `npm run proxy` or `npm run dev:all`
   - Listening on http://localhost:3001

## Default Model Configuration

### Setting a Default Model:

1. Open Settings (gear icon)
2. Enter account password to unlock
3. Add LLM Configuration:
   - **Provider**: `anthropic` or `openai`
   - **Model Name**: e.g., `claude-sonnet-4-5-20250929`
   - **API Key**: Your actual API key
   - **Check "Set as default"** ✓
4. Save configuration

### How Default is Determined:

```typescript
// SettingsService.ts
async getDefaultLLMConfig(password: string): Promise<StoredLLMConfig | null> {
  const configs = await this.getLLMConfigs(password);

  // Find config with isDefault: true
  const defaultConfig = configs.find(c => c.isDefault);

  // Fallback to first config if no default set
  return defaultConfig || configs[0] || null;
}
```

**Priority:**
1. Configuration with `isDefault: true`
2. First configuration in list
3. `null` if no configurations exist

## API Key Decryption

API keys are encrypted using AES-256-GCM with the user's account password:

```typescript
// On login, password is used to:
1. Authenticate user
2. Decrypt API keys from IndexedDB
3. Initialize LLM service with decrypted keys
4. Keys stay in memory (never written to disk unencrypted)
```

**Security:**
- Keys encrypted at rest in IndexedDB
- Decrypted in memory only
- Sent to proxy via localhost (not exposed in browser DevTools)
- Proxy forwards to API but doesn't store keys

## Troubleshooting

### LLM Service Not Initializing

**Symptom:** Yellow warning banner appears, simulated responses

**Console shows:**
```
[App] ⚠️  No default model configured
[App] 💡 User needs to configure API keys in Settings
```

**Solution:**
1. Click "Open Settings" in the warning banner
2. Enter your account password
3. Add LLM configuration with API key
4. Check "Set as default"
5. Save

### Service Initialized But Not Working

**Symptom:** Error messages in conversation

**Check Console:**
```
[ConversationView] ✓ LLM service retrieved successfully
[ConversationView] Using model: claude-sonnet-4-5-20250929
[ConversationView] Provider: anthropic
```

If you see ✓ but get errors:
1. Verify proxy server is running
2. Check API key is valid
3. Check console for network errors
4. Verify internet connection

### Proxy Server Not Running

**Symptom:** "Failed to fetch" or "ECONNREFUSED" errors

**Solution:**
```bash
# Start proxy server
npm run proxy

# Or run both servers together
npm run dev:all
```

**Verify proxy:**
```bash
curl http://localhost:3001/health
# Should return: {"status":"ok","service":"CCIDE API Proxy"}
```

## Session Management

### Session Timeout

- Sessions expire after **30 minutes of conversation inactivity**
- Timeout resets on each conversation interaction
- On expiration, re-authentication modal appears
- Enter password to continue with pending message

### Session Refresh Points

```typescript
// ConversationView.tsx
refreshSession(); // Called before and after each conversation
```

**Service Persists:**
- LLM service stays initialized during session
- No re-initialization needed per message
- Service resets when user logs out

## Architecture

```
┌─────────────────────────────────────────────────────┐
│ User Login                                          │
│ ↓                                                   │
│ Password → App.tsx useEffect                        │
│ ↓                                                   │
│ getDefaultModelConfig(password)                     │
│ ↓                                                   │
│ Decrypt API key from IndexedDB                      │
│ ↓                                                   │
│ initializeLLMService(llmConfig)                     │
│ ↓                                                   │
│ Global LLM Service Instance Created                 │
│ ↓                                                   │
│ ┌─────────────────────────────────────────────┐   │
│ │ Every Conversation Message:                  │   │
│ │                                              │   │
│ │ ConversationView                             │   │
│ │ ↓                                            │   │
│ │ getLLMService() // Returns initialized       │   │
│ │ ↓                                            │   │
│ │ llmService.streamRequest()                   │   │
│ │ ↓                                            │   │
│ │ Proxy Server (localhost:3001)                │   │
│ │ ↓                                            │   │
│ │ LLM Provider API                             │   │
│ │ ↓                                            │   │
│ │ Streaming Response                           │   │
│ └─────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────┘
```

## Code References

### Key Files

- **App.tsx:84-142** - LLM service initialization on login
- **ConversationView.tsx:103-114** - LLM service retrieval and usage
- **SettingsHelper.ts:86-102** - Default model config retrieval
- **SettingsService.ts** - API key encryption/decryption
- **LLMService.ts:319-332** - Global service instance management
- **server/proxy.js** - API proxy for CORS handling

### Key Functions

```typescript
// Initialize service (called once on login)
initializeLLMService(config: LLMConfig): void

// Get initialized service (called per message)
getLLMService(): ILLMService

// Reset service (on logout)
resetLLMService(): void

// Get default model with decrypted key
getDefaultModelConfig(password: string): Promise<StoredLLMConfig | null>
```

---

*Last updated: 2025-11-17*
