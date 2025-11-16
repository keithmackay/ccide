# CCIDE Data Persistence & Analytics Layer

This directory contains the data persistence, analytics, and settings management systems for CCIDE (Claude Code IDE).

## Architecture Overview

The data layer is built on top of **IndexedDB**, a browser-based NoSQL database that provides:
- Local-first data storage
- Offline capability
- Fast query performance
- No server-side dependencies

### Core Components

#### 1. Database Service (`services/Database.ts`)
A low-level IndexedDB wrapper providing:
- **Object Stores**: Messages, Settings, Projects
- **CRUD Operations**: Add, get, update, delete records
- **Querying**: Index-based queries and custom filtering
- **Type Safety**: Full TypeScript support

**Key Features:**
- Singleton pattern for single database instance
- Promise-based async API
- Automatic index creation
- Error handling and validation

#### 2. Analytics Service (`services/AnalyticsService.ts`)
Tracks all LLM interactions for analytics and insights:
- **Message Logging**: Records every user-LLM conversation
- **Project Tagging**: Associates messages with specific projects
- **Token Tracking**: Monitors token usage across projects and models
- **Data Export**: JSON export for backup and analysis

**Analytics Capabilities:**
- Total messages and token counts
- Per-project statistics
- Per-model usage tracking
- Date range filtering
- Search functionality
- Recent message history

#### 3. Settings Service (`services/SettingsService.ts`)
Manages encrypted storage of sensitive configuration:
- **API Key Encryption**: Uses Web Crypto API (AES-GCM)
- **Password Protection**: PBKDF2 key derivation (100,000 iterations)
- **LLM Configurations**: Stores multiple model configurations
- **User Preferences**: Theme, default model, auto-save settings

**Security Features:**
- Client-side encryption (data never leaves browser)
- Salt and IV randomization for each encryption
- Password validation
- Secure password change functionality

#### 4. Project Service (`services/ProjectService.ts`)
Manages project lifecycle and metadata:
- **Project Creation**: Generate unique project IDs
- **Status Management**: Active/archived project states
- **Metadata Tracking**: Creation/update timestamps, tags, descriptions
- **Search & Filter**: Find projects by name, tag, or status
- **Markdown Export/Import**: Sync with markdown file lists

## Data Models

### Message
```typescript
interface Message {
  id?: number;
  timestamp: number;
  projectId: string;
  userMessage: string;
  llmResponse: string;
  tokens: number;
  model: string;
  status: 'success' | 'error';
}
```

### StoredLLMConfig
```typescript
interface StoredLLMConfig {
  id: string;
  provider: 'anthropic' | 'openai' | 'custom';
  modelName: string;
  apiKey: string;  // Encrypted in storage
  isDefault: boolean;
  maxTokens?: number;
  temperature?: number;
  endpoint?: string;
}
```

### Settings
```typescript
interface Settings {
  id?: number;
  llmConfigs: StoredLLMConfig[];
  preferences: {
    theme: 'light' | 'dark' | 'auto';
    defaultModel?: string;
    autoSave: boolean;
  };
  encryptedData?: string;
  lastUpdated: number;
}
```

### Project
```typescript
interface Project {
  id: string;
  name: string;
  status: 'active' | 'archived';
  createdAt: number;
  updatedAt: number;
  path: string;
  description?: string;
  tags?: string[];
}
```

## UI Components

### SettingsPage (`components/SettingsPage.tsx`)
Provides a comprehensive settings interface with three sections:

1. **Account Section**
   - Password setup for encryption
   - Settings unlock interface
   - Export functionality

2. **LLM Configuration Section**
   - Add/remove LLM models
   - Configure API keys (encrypted)
   - Set default model
   - Adjust model parameters (max tokens, temperature)

3. **About Section**
   - Application information
   - Feature overview
   - Privacy and security details

### AnalyticsPage (`components/AnalyticsPage.tsx`)
Displays comprehensive analytics dashboard:

**Filters:**
- Project selection (all or specific)
- Date ranges (7d, 30d, custom)
- Custom date picker

**Statistics:**
- Total messages count
- Total token usage
- Active projects count
- Models used count

**Visualizations:**
- Project breakdown table
- Model usage statistics
- Recent message history
- Average tokens per message

## Encryption Details

### Algorithm: AES-GCM
- **Key Size**: 256 bits
- **Mode**: Galois/Counter Mode (authenticated encryption)
- **Random IV**: 12 bytes per encryption
- **Random Salt**: 16 bytes for key derivation

### Key Derivation: PBKDF2
- **Hash**: SHA-256
- **Iterations**: 100,000
- **Purpose**: Derives encryption key from user password

### Storage Format
Encrypted data is stored as base64-encoded JSON:
```json
{
  "encrypted": "<base64-encoded-ciphertext>",
  "keyInfo": {
    "salt": "<base64-encoded-salt>",
    "iv": "<base64-encoded-iv>"
  }
}
```

## Usage Examples

### Initialize Database
```typescript
import { getDatabase } from './services/Database';

const db = getDatabase();
await db.init();
```

### Log Analytics Message
```typescript
import { getAnalyticsService } from './services/AnalyticsService';

const analytics = getAnalyticsService();
await analytics.logMessage(
  'project-123',
  'User question',
  'LLM response',
  1500,  // tokens
  'claude-sonnet-4-5'
);
```

### Save Encrypted Settings
```typescript
import { getSettingsService } from './services/SettingsService';

const settings = getSettingsService();
await settings.addLLMConfig({
  id: 'anthropic-1',
  provider: 'anthropic',
  modelName: 'claude-sonnet-4-5-20250929',
  apiKey: 'sk-ant-...',
  isDefault: true
}, 'user-password');
```

### Manage Projects
```typescript
import { getProjectService } from './services/ProjectService';

const projects = getProjectService();
const project = await projects.createProject(
  'My New Project',
  'A description',
  ['tag1', 'tag2']
);
```

## Security Considerations

1. **Client-Side Only**: All encryption happens in the browser
2. **No Server Storage**: Data never transmitted to servers
3. **Password Protection**: Required for accessing encrypted settings
4. **Secure Defaults**: Strong encryption algorithms and parameters
5. **No Plaintext Storage**: API keys never stored unencrypted

## Browser Compatibility

Requires modern browsers with support for:
- IndexedDB API
- Web Crypto API (SubtleCrypto)
- ES6+ JavaScript features
- TypeScript (for development)

**Tested on:**
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Future Enhancements

1. **Data Sync**: Cloud backup with end-to-end encryption
2. **Export Formats**: CSV, Excel export options
3. **Advanced Analytics**: Charts and graphs
4. **Settings Import**: Import configurations from file
5. **Multi-Device**: Encrypted sync across devices
6. **Backup/Restore**: Complete database backup functionality

## File Structure

```
src/
├── services/
│   ├── Database.ts           # IndexedDB wrapper
│   ├── AnalyticsService.ts   # Message analytics
│   ├── SettingsService.ts    # Encrypted settings
│   ├── ProjectService.ts     # Project management
│   └── index.ts              # Service exports
├── components/
│   ├── SettingsPage.tsx      # Settings UI
│   ├── AnalyticsPage.tsx     # Analytics UI
│   └── index.ts              # Component exports
├── types/
│   ├── models.ts             # Data models
│   └── index.ts              # Type exports
└── README.md                 # This file
```

## License

Part of the CCIDE project. See project root for license information.
