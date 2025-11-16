# Code Review Checklist

This checklist ensures code quality, security, and best practices for CCIDE.

## Security

### Input Validation
- [ ] All user inputs are validated and sanitized
- [ ] API keys and sensitive data are never logged
- [ ] No SQL/NoSQL injection vulnerabilities
- [ ] XSS prevention: proper escaping of user-generated content
- [ ] CSRF protection where applicable

### Data Protection
- [ ] Sensitive data (API keys, tokens) is encrypted at rest
- [ ] Encryption keys are properly managed (not hardcoded)
- [ ] Proper use of HTTPS for all external API calls
- [ ] No sensitive data in URLs or query parameters
- [ ] Secure random number generation for cryptographic purposes

### Authentication & Authorization
- [ ] Proper session management
- [ ] API keys are validated before use
- [ ] Rate limiting implemented for API calls
- [ ] Secure storage of credentials (IndexedDB with encryption)

## Error Handling

- [ ] All async operations have proper error handling
- [ ] User-friendly error messages (no stack traces exposed)
- [ ] Errors are logged appropriately
- [ ] Graceful degradation when services fail
- [ ] Network errors are handled with retry logic
- [ ] Database errors don't crash the application
- [ ] Edge cases are tested and handled

## TypeScript Type Safety

- [ ] No usage of `any` type (or justified with comments)
- [ ] Proper type definitions for all functions
- [ ] Interfaces/types for all data structures
- [ ] Null/undefined checks where necessary
- [ ] Type guards used appropriately
- [ ] No type assertions without justification
- [ ] Strict mode enabled in tsconfig.json

## Code Quality

### Readability
- [ ] Clear, descriptive variable and function names
- [ ] Functions are small and focused (single responsibility)
- [ ] Complex logic is well-commented
- [ ] Consistent code style (follows Prettier config)
- [ ] No commented-out code (use git history instead)

### Performance
- [ ] No unnecessary re-renders in React components
- [ ] Proper use of `useMemo` and `useCallback`
- [ ] Large lists use virtualization
- [ ] Images are optimized and lazy-loaded
- [ ] Code splitting for large dependencies
- [ ] No memory leaks (event listeners cleaned up)

### Testing
- [ ] Unit tests for all business logic
- [ ] Component tests for UI components
- [ ] Integration tests for critical paths
- [ ] Edge cases are tested
- [ ] Minimum 80% code coverage
- [ ] Tests are meaningful (not just for coverage)
- [ ] Mock external dependencies properly

## Accessibility

- [ ] Semantic HTML elements used
- [ ] Proper ARIA labels where needed
- [ ] Keyboard navigation works
- [ ] Focus management is correct
- [ ] Color contrast meets WCAG standards
- [ ] Screen reader compatible
- [ ] Form inputs have associated labels

## React Best Practices

- [ ] Hooks follow rules (no conditional hooks)
- [ ] Dependencies arrays are correct
- [ ] Keys are stable and unique in lists
- [ ] No side effects in render
- [ ] Proper component composition
- [ ] State is lifted appropriately
- [ ] Context is used wisely (not overused)

## Database Operations

- [ ] Indexes are defined for queried fields
- [ ] Transactions are used for multi-step operations
- [ ] Database version migrations are handled
- [ ] Quota exceeded errors are handled
- [ ] Data is validated before storage
- [ ] Cleanup of old data is implemented

## Documentation

- [ ] JSDoc comments for public APIs
- [ ] Complex algorithms are explained
- [ ] README is up to date
- [ ] Breaking changes are documented
- [ ] Examples are provided for new features

## Git Practices

- [ ] Commits are atomic and focused
- [ ] Commit messages are clear and descriptive
- [ ] No secrets in commit history
- [ ] Branch naming follows conventions
- [ ] PR description explains the changes

## Review Status

### Issues Found
List any issues found during review:

1.
2.
3.

### Recommendations
List recommendations for improvement:

1.
2.
3.

### Approval Status
- [ ] Approved - Ready to merge
- [ ] Approved with comments - Merge after addressing comments
- [ ] Changes requested - Needs revision

---

**Reviewer:** ________________________
**Date:** ________________________
**Review Duration:** ________________________
