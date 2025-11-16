# Contributing to CCIDE

Thank you for your interest in contributing to CCIDE! This document provides guidelines and instructions for contributing.

## Code of Conduct

By participating in this project, you agree to maintain a respectful and inclusive environment for all contributors.

## Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 9.0.0
- Git
- A code editor (VS Code recommended)

### Setting Up Development Environment

1. **Fork and Clone**
   ```bash
   git clone https://github.com/YOUR_USERNAME/ccide.git
   cd ccide
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Start Development Server**
   ```bash
   npm run dev
   ```

4. **Run Tests**
   ```bash
   npm test
   ```

## Development Workflow

### Branch Naming Convention

Use descriptive branch names with prefixes:
- `feature/` - New features (e.g., `feature/add-dark-mode`)
- `fix/` - Bug fixes (e.g., `fix/authentication-error`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `refactor/` - Code refactoring (e.g., `refactor/simplify-state`)
- `test/` - Test additions/updates (e.g., `test/add-component-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### Commit Message Guidelines

Follow the [Conventional Commits](https://www.conventionalcommits.org/) specification:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation changes
- `style` - Code style changes (formatting, etc.)
- `refactor` - Code refactoring
- `test` - Adding or updating tests
- `chore` - Maintenance tasks
- `perf` - Performance improvements
- `ci` - CI/CD changes

**Examples:**
```bash
feat(agents): add new coding agent for code generation
fix(storage): resolve IndexedDB quota exceeded error
docs(readme): add installation instructions
test(services): add unit tests for encryption service
```

### Pull Request Process

1. **Create a Feature Branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make Your Changes**
   - Write clean, readable code
   - Follow existing code style
   - Add/update tests as needed
   - Update documentation

3. **Test Your Changes**
   ```bash
   npm test                  # Run all tests
   npm run test:coverage     # Check coverage
   npm run lint              # Check linting
   npm run type-check        # Check TypeScript types
   ```

4. **Commit Your Changes**
   ```bash
   git add .
   git commit -m "feat: add amazing feature"
   ```

5. **Push to Your Fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Open a Pull Request**
   - Go to the CCIDE repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template
   - Request review

### Pull Request Guidelines

- **Title**: Use conventional commit format
- **Description**: Clearly describe what changes and why
- **Tests**: Include relevant tests
- **Documentation**: Update docs if needed
- **Screenshots**: Include for UI changes
- **Breaking Changes**: Clearly mark and explain

### Code Review Process

1. At least one maintainer review required
2. All CI checks must pass
3. Code coverage must not decrease
4. Changes must align with project goals
5. Feedback should be addressed promptly

## Coding Standards

### TypeScript

- Use strict TypeScript settings
- Avoid `any` type - use specific types
- Define interfaces for all data structures
- Use type guards for runtime type checking
- Document complex types with JSDoc

### React

- Use functional components with hooks
- Follow React best practices
- Keep components small and focused
- Use meaningful component names
- Avoid prop drilling - use context when needed
- Memoize expensive computations

### Testing

- Write tests for all new features
- Maintain minimum 80% code coverage
- Use descriptive test names
- Test edge cases and error scenarios
- Mock external dependencies
- Use test fixtures for data

### Code Style

- Run Prettier before committing
- Follow ESLint rules
- Use meaningful variable names
- Keep functions small and focused
- Comment complex logic
- Remove dead code

## Project Structure

```
ccide/
├── src/
│   ├── components/      # React components
│   ├── agents/          # AI agent implementations
│   ├── services/        # Business logic
│   ├── hooks/           # Custom React hooks
│   ├── types/           # TypeScript definitions
│   ├── utils/           # Utility functions
│   └── tests/           # Test files
├── docs/                # Documentation
├── public/              # Static assets
└── scripts/             # Build/deployment scripts
```

## Testing Guidelines

### Unit Tests
- Test individual functions/components in isolation
- Mock external dependencies
- Cover edge cases and error scenarios
- Use descriptive test names

### Integration Tests
- Test interactions between components/services
- Test database operations
- Test state management

### E2E Tests
- Test complete user flows
- Test critical paths
- Test error recovery

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- path/to/test.ts

# Run tests in watch mode
npm test -- --watch

# Run with coverage
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## Documentation

- Update README.md for user-facing changes
- Add JSDoc comments for public APIs
- Update CHANGELOG.md with your changes
- Create/update examples for new features
- Include inline comments for complex logic

## Performance

- Optimize bundle size
- Use code splitting
- Lazy load components
- Memoize expensive operations
- Avoid unnecessary re-renders
- Profile before optimizing

## Security

- Never commit API keys or secrets
- Sanitize user inputs
- Use parameterized queries
- Follow OWASP guidelines
- Report security issues privately

## Getting Help

- 💬 [GitHub Discussions](https://github.com/ccide/ccide/discussions)
- 🐛 [Issue Tracker](https://github.com/ccide/ccide/issues)
- 📧 Email: dev@ccide.dev

## Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Mentioned in release notes
- Acknowledged in the community

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to CCIDE! 🎉
