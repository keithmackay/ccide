# CCIDE - Claude Code IDE

A web-based IDE for LLMs with agent coordination and project management.

## Features

- **Two-Panel UI**: Split interface with project management, conversation, and file browser
- **Project Management**: Create, manage, and archive projects
- **Agent Coordination**: Multi-agent workflow with specialized agents
- **Analytics**: Track and analyze LLM message traffic
- **Settings**: Encrypted API key storage and model configuration
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

### Installation

```bash
npm install
```

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

## License

MIT
