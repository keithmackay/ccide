# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Planned - Provider Management Enhancement
- Biometric unlock support for supported browsers
- Cross-device encrypted sync with separate encryption key
- API key validation before saving configurations
- Provider health monitoring and quota tracking
- Enhanced error messages and user feedback

## [0.3.0] - 2025-11-17

### Added - Project Folder Management System

Comprehensive project folder management system implemented using a 5-agent swarm approach with TDD, code review, optimization, and publishing preparation.

#### Core Features

- **Automatic Folder Structure Creation**: When a new project is created, a structured folder hierarchy is automatically generated:
  - `projects/{project-name}/` (spaces replaced with dashes)
  - Subfolders: `docs/`, `components/`, `pages/`, `src/`, `assets/`, `tests/`

- **File System Operations** (Agent 2):
  - New `ProjectFolderService` for managing files and folders in IndexedDB
  - Project-based file storage with full CRUD operations
  - Automatic file routing based on file type and purpose
  - Search, filter, and analytics capabilities
  - Import/export functionality for projects

- **Tree View Component** (Agent 3):
  - Enhanced `FilesView` component with hierarchical file tree display
  - Expandable/collapsible folders with visual hierarchy
  - Real-time search across all files in project
  - Color-coded file type icons (15+ file types supported)
  - Loading states, error handling, and empty states
  - Performance optimizations with React.memo and useMemo

- **File Preview System** (Agent 4):
  - `FilePreviewPanel` for displaying file contents
  - Syntax highlighting for 15+ programming languages (JS, TS, Python, Java, C/C++, etc.)
  - Markdown rendering with full formatting support
  - File metadata display (size, path, last modified)
  - Integration with phase completion workflow
  - `PhaseFilesPanel` for viewing all files generated in a phase

- **Comprehensive Testing** (Agent 5):
  - 109+ test cases across unit and integration tests
  - Security testing (XSS prevention, path traversal protection)
  - Performance testing and optimization
  - Accessibility testing
  - ~1,366 lines of test code

#### New Files Created

**Services:**
- `src/services/FileService.ts` - Mock file service with tree generation
- `src/services/ProjectFolderService.ts` - IndexedDB-based file storage

**Components:**
- `src/components/FileIcon.tsx` - File type icons with color coding
- `src/components/RightPanel/FilePreview/FilePreviewPanel.tsx` - Main preview component
- `src/components/RightPanel/FilePreview/CodeHighlighter.tsx` - Syntax highlighting
- `src/components/RightPanel/FilePreview/MarkdownRenderer.tsx` - Markdown rendering
- `src/components/RightPanel/FilePreview/FileMetadata.tsx` - File information display
- `src/components/RightPanel/FilePreview/PhaseFilesPanel.tsx` - Phase deliverables view

**Utilities:**
- `src/utils/projectFileSystem.ts` - Path utilities and folder operations
- `src/utils/filePreview.ts` - File type detection and helpers
- `src/hooks/useDebouncedValue.ts` - Performance optimization hook

**Tests:**
- `src/tests/unit/components/FilesView.test.tsx` (32 tests)
- `src/tests/unit/stores/appStore.fileTree.test.ts` (37 tests)
- `src/tests/integration/fileTreePreview.integration.test.tsx` (40+ tests)

**Documentation:**
- `docs/FILE_PREVIEW_SYSTEM.md` - Comprehensive guide
- `AGENT_5_CODE_REVIEW.md` - Security and quality review
- `OPTIMIZATION_GUIDE.md` - Performance optimization roadmap
- `AGENT_5_FINAL_REPORT.md` - Complete implementation summary

#### Modified Files

**Database:**
- `src/services/Database.ts` - Added PROJECT_FILES and PROJECT_FOLDERS stores (DB version 3)

**Services:**
- `src/services/ProjectService.ts` - Integrated automatic folder creation
- `src/services/index.ts` - Exported new services

**Components:**
- `src/components/LeftPanel/FilesView.tsx` - Complete rebuild with enhanced features
- `src/components/RightPanel/RightPanelWorkpane.tsx` - Integrated file preview
- `src/components/RightPanel/PhaseReviewPanel.tsx` - Added "View All Files" feature

**Types:**
- `src/types/models.ts` - Added ProjectFile and ProjectFolder interfaces
- `src/types/ui.ts` - Extended FileNode and PhaseDeliverable interfaces

### Security

- **Fixed**: Path traversal vulnerability in file operations
- **Added**: Input validation for filenames (prevents `../`, null bytes, etc.)
- **Added**: Filename length validation (255 character limit)
- **Verified**: XSS protection via React's built-in escaping

### Performance

- **Optimized**: Tree view rendering with React.memo
- **Optimized**: Search performance with debouncing hook
- **Optimized**: File operations with efficient IndexedDB queries
- **Added**: Virtual scrolling recommendations for large file trees (>500 files)

### Changed

- Database upgraded from version 2 to version 3
- Enhanced project creation flow with automatic folder generation
- Improved file tree display with professional UI/UX
- Package version bumped to 0.3.0

### Technical Details

**Development Methodology:**
- Multi-agent swarm implementation with 5 specialized agents
- Test-Driven Development (TDD) approach
- Comprehensive code review and security audit
- Performance optimization and profiling
- Publication-ready package preparation

**Agent Roles:**
1. Agent 1: Research and design
2. Agent 2: File system operations
3. Agent 3: Tree view component
4. Agent 4: File preview system
5. Agent 5: TDD, review, and optimization

**Package Readiness:** 8.5/10 - Production ready with minor conditions

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
