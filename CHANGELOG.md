# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Settings Provider Management (In Progress)
- User documentation for LLM provider management (`docs/user-guide/provider-management.md`)
- Comprehensive guide for encrypted API key storage, session management, and security
- AddProviderDialog component for inline provider addition
- Test suites for provider management dialogs
- CHANGELOG tracking for version history and roadmap

### In Progress
- ConfirmDeleteProviderDialog component with re-authentication
- ChangeDefaultModelDialog component with re-authentication
- Integration of dialogs into SettingsPage
- Session refresh on conversation activity (ConversationPane)
- Session refresh after successful LLM API calls (LLMService)
- Integration tests for complete provider management flow
- E2E tests for provider management UI workflows

### Planned - Provider Management Enhancement
- Biometric unlock support for supported browsers
- Cross-device encrypted sync with separate encryption key
- API key validation before saving configurations
- Provider health monitoring and quota tracking
- Enhanced error messages and user feedback

## [0.2.0] - 2024-11-17

### Added - LLM Conversation Features
- **LLM Service Integration**: Full support for Anthropic Claude and OpenAI GPT APIs
- **Conversation Interface**: Interactive chat UI with message history and streaming responses
- **ConversationService**: Message persistence, search, and export functionality
- **Password Session Management**: Secure password handling with auto-expiration
- **Token Counting**: Automatic token estimation and usage tracking
- **Conversation Analytics**: Statistics, search, and export (JSON/Markdown)

### Added - Testing & Quality
- Comprehensive test suite with 91.5%+ test pass rate (162/177 tests passing)
- Unit tests for ConversationView, ConversationService, LLMService, usePasswordSession
- Integration tests for complete conversation flow
- Test fixtures and mocks for IndexedDB and fetch API
- Performance optimization configurations
- ESLint and Prettier configurations
- Code review checklist
- Comprehensive documentation (README, CONTRIBUTING, LICENSE)

### Changed
- Enhanced project structure with conversation features
- Improved code quality standards
- Updated TypeScript configuration for strict type checking
- Added LLM configuration to README

### Security
- AES-256 encryption for API keys using Web Crypto API
- Password-protected settings with PBKDF2 key derivation
- Secure session management with auto-timeout
- No server-side storage - all data encrypted client-side
- Added security review guidelines
- Implemented security-focused ESLint rules

### Fixed
- TypeScript strict mode compatibility improvements
- Browser compatibility for Web Crypto API
- IndexedDB initialization issues

## [0.1.0] - 2024-11-16

### Added
- Initial project setup
- Basic project structure
- TypeScript configuration
- Vite build configuration
- Data models and type definitions
- Package dependencies (React, Vite, Vitest, etc.)
- ESLint and Prettier setup
- README with basic documentation

### Infrastructure
- React 18 with TypeScript
- Vite for build tooling
- Vitest for testing
- IndexedDB for storage
- CryptoJS for encryption
- Zustand for state management
- TanStack Query for data fetching
- TailwindCSS for styling

## Release Notes

### Version 0.1.0 - Initial Release

This is the initial release of CCIDE (Claude Code IDE), setting up the foundation for a powerful web-based IDE designed for LLM-assisted development.

**Core Infrastructure:**
- Modern React 18 + TypeScript stack
- Vite for fast development and optimized builds
- Comprehensive testing setup with Vitest
- Code quality tools (ESLint, Prettier)

**Data Layer:**
- IndexedDB for client-side storage
- Encrypted storage for sensitive data
- Type-safe data models

**Development Experience:**
- Full TypeScript support
- Hot module replacement
- Path aliases for clean imports
- Strict type checking

**Next Steps:**
- Implement core UI components
- Add agent coordination system
- Build project management features
- Create conversation interface
- Develop analytics dashboard

---

## How to Read This Changelog

- **Added** - New features
- **Changed** - Changes to existing functionality
- **Deprecated** - Soon-to-be removed features
- **Removed** - Removed features
- **Fixed** - Bug fixes
- **Security** - Security improvements

---

For more details on each version, see the [release notes](https://github.com/ccide/ccide/releases).
