# CCIDE - Claude Code IDE

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-blue.svg)](https://reactjs.org/)
[![Test Coverage](https://img.shields.io/badge/coverage-80%25-green.svg)](https://github.com/ccide/ccide)

> A powerful web-based IDE designed for LLM-assisted development with agent coordination and intelligent project management.

## Features

### Core Capabilities
- **Two-Panel UI**: Split interface with project management, conversation, and file browser
- **Project Management**: Create, manage, and archive projects with comprehensive metadata
- **Multi-Agent Coordination**: Orchestrate specialized AI agents for different development tasks
- **LLM Conversation Interface**: Interactive chat with Claude API and OpenAI with streaming support
- **Conversation History**: Full analytics and tracking of all LLM interactions with search and export
- **File Browser**: Native file system access (when available) with intelligent file navigation
- **Usage Analytics**: Track token usage, costs, and model performance across projects

### LLM Integration
- **Multi-Provider Support**: Works with Anthropic Claude and OpenAI GPT models
- **Streaming Responses**: Real-time streaming of LLM responses for better UX
- **Conversation Management**: Save, search, and export conversation history
- **Token Tracking**: Automatic token counting and usage analytics
- **Error Handling**: Graceful error handling with retry capabilities

### Security & Privacy
- **Client-Side Encryption**: All sensitive data encrypted using AES-256
- **No Server Storage**: All data stays in your browser's IndexedDB
- **Secure API Key Management**: Encrypted storage with secure key derivation
- **Privacy First**: No telemetry, no tracking, your code stays local

### Developer Experience
- **TypeScript First**: Full type safety and IntelliSense support
- **Modern UI**: Built with React 18 and TailwindCSS
- **Fast Performance**: Optimized bundle splitting and lazy loading
- **Offline Ready**: Works without internet (after initial load)
- **Theme Support**: Light, dark, and auto themes
- **Extensibility**: Plugin system for adding custom agents and skills

## Tech Stack

- **Frontend**: React 18 + TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **Data Fetching**: TanStack Query
- **Storage**: IndexedDB (via idb)
- **Encryption**: crypto-js
- **Testing**: Vitest
- **Linting**: ESLint + Prettier

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0
- API Key from Anthropic (Claude) or OpenAI (GPT)

### Installation

```bash
npm install
```

### Configuration

#### Setting up LLM API Keys

1. Navigate to Settings in the application
2. Add your LLM configuration:
   - **Anthropic Claude**: Get your API key from [console.anthropic.com](https://console.anthropic.com)
   - **OpenAI GPT**: Get your API key from [platform.openai.com](https://platform.openai.com)

3. Configure your LLM settings:
   ```typescript
   {
     provider: 'anthropic', // or 'openai'
     model: 'claude-sonnet-4-5-20250929', // or 'gpt-4'
     apiKey: 'your-api-key-here',
     maxTokens: 4096,
     temperature: 0.7
   }
   ```

4. Set a master password to encrypt your API keys locally
5. Your keys are encrypted using AES-256 and stored only in your browser's IndexedDB

**Security Note**: Your API keys never leave your browser and are encrypted at rest.

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Testing

```bash
npm run test
npm run test:ui
npm run test:coverage
```

### Linting

```bash
npm run lint
npm run lint:fix
npm run format
```

## Project Structure

```
ccide/
├── src/
│   ├── components/      # React components
│   │   ├── common/      # Shared UI components
│   │   ├── layout/      # Layout components
│   │   ├── projects/    # Project management UI
│   │   ├── conversation/# Chat interface
│   │   ├── files/       # File browser
│   │   ├── settings/    # Settings UI
│   │   ├── analytics/   # Analytics dashboard
│   │   └── agents/      # Agent UI components
│   ├── agents/          # Agent integration
│   ├── services/        # Business logic
│   │   ├── storage/     # IndexedDB services
│   │   ├── encryption/  # Encryption services
│   │   ├── analytics/   # Analytics services
│   │   └── agent/       # Agent coordination
│   ├── utils/           # Utility functions
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript type definitions
│   └── tests/           # Test setup and utilities
├── public/              # Static assets
└── tests/               # Integration tests
```

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## Security

For security vulnerabilities, please see our security policy. We take security seriously and encrypt all sensitive data client-side.

## Changelog

See [CHANGELOG.md](CHANGELOG.md) for version history and changes.

## Support

- 📖 [Documentation](https://docs.ccide.dev)
- 🐛 [Issue Tracker](https://github.com/ccide/ccide/issues)
- 💬 [Discussions](https://github.com/ccide/ccide/discussions)

## License

MIT - see [LICENSE](LICENSE) file for details.

---

**Made with ❤️ by the CCIDE Team**
