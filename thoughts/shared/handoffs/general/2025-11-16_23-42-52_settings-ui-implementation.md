---
date: 2025-11-16T23:42:52-05:00
researcher: Claude Code
git_commit: e8962d069b287fd80204a71caf2fa9dc6701319b
branch: main
repository: ccide
topic: "Settings UI and LLM Configuration Implementation Strategy"
tags: [settings, ui-enhancement, encryption, llm-configuration, right-panel]
status: complete
last_updated: 2025-11-16
last_updated_by: Claude Code
type: implementation_strategy
---

# Handoff: Settings UI Implementation and LLM Service Planning

## Task(s)

### Completed Tasks:
1. **Settings Navigation Enhancement** - ✅ Complete
   - Moved Settings page from left panel to right panel workpane
   - Added gear icon (⚙️) in left panel footer to open Settings
   - Implemented close button (X icon) in Settings header

2. **Settings UI Improvements** - ✅ Complete
   - Improved text contrast with darker colors (text-gray-100, text-gray-200, text-gray-300)
   - Enabled scrollable form content with fixed headers (overflow-y-auto)
   - Changed "Model Name" label to "Default Model"
   - Implemented full-height flex layout for Settings page

3. **LLM Provider Integration** - ✅ Complete
   - Created provider-to-models mapping for Anthropic and OpenAI
   - Implemented dynamic model dropdown that populates based on selected provider
   - Added support for custom providers with manual model entry

4. **API Key Encryption and Storage** - ✅ Complete
   - Integrated with existing SettingsService (AES-GCM encryption)
   - Implemented password-protected API key encryption (min 8 characters)
   - API keys stored in IndexedDB with PBKDF2 key derivation

5. **Model State Management** - ✅ Complete
   - Created setAvailableModels action in app store
   - Implemented model loading on app initialization (App.tsx)
   - Auto-select default model in Conversation pane
   - Model selector in footer displays available models

### Planned/Discussed Tasks (Not Started):
6. **LLM Service Implementation** - 🔴 Not Started
   - Create LLMService for API integration
   - Implement Anthropic API client with streaming
   - Implement OpenAI API client with streaming
   - Add token counting and usage tracking

7. **Conversation UI Implementation** - 🔴 Not Started
   - Update ConversationView to send/receive messages
   - Add message input component
   - Implement streaming response display
   - Save conversations to database for analytics
   - Add error handling for API failures

## Critical References

1. `src/services/SettingsService.ts` - Existing encryption service (AES-GCM, PBKDF2)
2. `src/services/Database.ts` - IndexedDB wrapper for local storage
3. `src/types/models.ts` - Data models including StoredLLMConfig, Settings

## Recent Changes

**Type System Changes:**
- `src/types/ui.ts:6-7` - Added RightPanelMode type ('content' | 'settings')
- `src/types/ui.ts:72` - Added rightPanelMode to AppState
- `src/types/ui.ts:79` - Added setRightPanelMode action
- `src/types/ui.ts:90` - Added setAvailableModels action

**Store Changes:**
- `src/stores/appStore.ts:2` - Imported RightPanelMode type
- `src/stores/appStore.ts:28` - Initialized rightPanelMode: 'content'
- `src/stores/appStore.ts:37-38` - Added setRightPanelMode action
- `src/stores/appStore.ts:101-102` - Added setAvailableModels action

**Component Changes:**
- `src/components/LeftPanel/LeftPanelFooter.tsx:11` - Changed to use setRightPanelMode
- `src/components/LeftPanel/LeftPanelFooter.tsx:42` - Gear icon triggers right panel settings
- `src/components/LeftPanel/LeftPanelWorkpane.tsx:1-17` - Removed Settings rendering
- `src/components/RightPanel/RightPanelWorkpane.tsx:4` - Imported SettingsPage
- `src/components/RightPanel/RightPanelWorkpane.tsx:7,11,14-16` - Added Settings mode rendering

**Settings Page Rewrite:**
- `src/components/SettingsPage.tsx:7` - Added X icon import from lucide-react
- `src/components/SettingsPage.tsx:17-33` - Created PROVIDER_MODELS mapping
- `src/components/SettingsPage.tsx:36` - Default to 'llm' tab instead of 'account'
- `src/components/SettingsPage.tsx:50,60-66` - Dynamic model dropdown based on provider
- `src/components/SettingsPage.tsx:291` - Changed label to "Default Model"
- `src/components/SettingsPage.tsx:292-317` - Conditional rendering (dropdown vs text input)
- `src/components/SettingsPage.tsx:436-478` - Full-height flex layout with scrolling
- `src/components/SettingsPage.tsx:440-446` - Close button with X icon
- All text elements updated with darker colors (text-gray-100, text-gray-200, text-gray-300)

**App Initialization:**
- `src/App.tsx:1,6-7` - Added useEffect, SettingsService, LLMModel imports
- `src/App.tsx:11-53` - Model loading logic on app startup

## Learnings

### Key Patterns:
1. **Settings moved to right panel** - Better UX as settings don't replace navigation
2. **Full-height flex layout** - Headers fixed, content scrollable prevents form field cutoff
3. **Dynamic dropdowns** - useEffect with dependency on provider selection
4. **Encryption already implemented** - SettingsService handles all crypto operations
5. **IndexedDB structure** - Single settings record (id: 1) with encrypted data field

### Provider Model Mappings:
- **Anthropic**: claude-sonnet-4-5-20250929, claude-3-7-sonnet-20250219, claude-3-5-sonnet-20241022, claude-3-5-haiku-20241022, claude-3-opus-20240229
- **OpenAI**: gpt-4-turbo, gpt-4, gpt-3.5-turbo, gpt-4o, gpt-4o-mini
- **Custom**: User enters model name manually

### Encryption Details:
- Algorithm: AES-GCM with 256-bit keys
- Key derivation: PBKDF2 with 100,000 iterations, SHA-256
- Storage: Encrypted data + keyInfo (salt, iv) stored in encryptedData field
- API keys marked as "***ENCRYPTED***" in plaintext llmConfigs array

## Artifacts

### Implementation Files:
- `src/types/ui.ts` - Type definitions (RightPanelMode, AppState extensions)
- `src/stores/appStore.ts` - Zustand store with new actions
- `src/components/SettingsPage.tsx` - Complete Settings UI (654 lines)
- `src/components/LeftPanel/LeftPanelFooter.tsx` - Gear icon trigger
- `src/components/LeftPanel/LeftPanelWorkpane.tsx` - Removed Settings
- `src/components/RightPanel/RightPanelWorkpane.tsx` - Added Settings mode
- `src/App.tsx` - Model initialization on startup

### Existing Services (Reference):
- `src/services/SettingsService.ts` - Encryption/decryption service (361 lines)
- `src/services/Database.ts` - IndexedDB wrapper (313 lines)
- `src/types/models.ts` - Data models (96 lines)

### Git Commits:
- `57a4a28` - Initial Settings navigation (gear icon)
- `e8962d0` - Comprehensive Settings page enhancements (current)

## Action Items & Next Steps

### Immediate Next Steps (LLM Service Implementation):

1. **Install Dependencies**
   ```bash
   npm install @anthropic-ai/sdk openai
   npm install -D @types/node
   ```

2. **Create LLMService Interface** (`src/services/LLMService.ts`)
   - Abstract base class or interface for provider clients
   - Methods: sendMessage(), streamMessage(), countTokens()
   - Handle decryption of API keys from SettingsService

3. **Implement Anthropic Client** (`src/services/providers/AnthropicClient.ts`)
   - Use @anthropic-ai/sdk
   - Support streaming responses
   - Map StoredLLMConfig to SDK configuration

4. **Implement OpenAI Client** (`src/services/providers/OpenAIClient.ts`)
   - Use openai SDK
   - Support streaming responses
   - Map StoredLLMConfig to SDK configuration

5. **Update ConversationView** (`src/components/LeftPanel/ConversationView.tsx`)
   - Add message input component (textarea + send button)
   - Display message history
   - Show streaming responses in real-time
   - Handle loading/error states

6. **Implement Analytics**
   - Save each conversation to Database (STORES.MESSAGES)
   - Track: timestamp, projectId, userMessage, llmResponse, tokens, model, status
   - Link to activeProject

7. **Error Handling**
   - Rate limit handling
   - Invalid API key detection
   - Network errors
   - Token limit exceeded

### Architecture Considerations:

**LLM Service Structure:**
```typescript
interface ILLMProvider {
  sendMessage(prompt: string, config: StoredLLMConfig): Promise<string>;
  streamMessage(prompt: string, config: StoredLLMConfig): AsyncGenerator<string>;
  countTokens(text: string): number;
}

class LLMService {
  private getProvider(config: StoredLLMConfig): ILLMProvider;
  async sendMessage(prompt: string, password: string): Promise<Response>;
  async streamMessage(prompt: string, password: string): AsyncGenerator<string>;
}
```

**Message Flow:**
1. User types message in ConversationView input
2. ConversationView calls LLMService.streamMessage()
3. LLMService decrypts API key using SettingsService
4. LLMService delegates to appropriate provider client
5. Provider streams response chunks
6. ConversationView displays chunks in real-time
7. On completion, save to Database

## Other Notes

### Project Context:
- **CCIDE** = Claude Code IDE - web-based IDE for LLM interactions
- Built with: React 18, TypeScript, Vite, Zustand, IndexedDB, Tailwind CSS
- Two-panel layout: Left (projects/conversation/files), Right (content/settings)
- Dev server running at http://localhost:3000/

### Codebase Structure:
- `/src/components/` - UI components organized by panel
- `/src/services/` - Business logic (Database, SettingsService, future LLMService)
- `/src/stores/` - Zustand state management
- `/src/types/` - TypeScript type definitions (ui.ts, models.ts)
- `/agents/` - Agent workflow definitions (BMAD format)
- `/docs/` - Specification and planning documents

### Key Files for LLM Implementation:
- `src/components/LeftPanel/ConversationView.tsx` - Currently minimal, needs full chat UI
- `src/types/models.ts` - Message interface already defined (lines 9-18)
- `src/services/Database.ts` - STORES.MESSAGES store already configured (lines 46-54)

### Testing the Current Build:
1. Open http://localhost:3000/
2. Click gear icon (⚙️) in footer - opens Settings in right panel
3. Set up encryption password (min 8 chars)
4. Add LLM configuration with API key
5. Close Settings (X button) - returns to content view
6. Model should appear in "Select Model" dropdown in footer

### Repository Information:
- GitHub: https://github.com/keithmackay/ccide
- Branch: main
- Latest commit: e8962d069b287fd80204a71caf2fa9dc6701319b
- All changes committed and pushed
