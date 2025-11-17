# Security Policy

## Supported Versions

We release patches for security vulnerabilities for the following versions:

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**Please do not report security vulnerabilities through public GitHub issues.**

Instead, please report them via email to: **security@ccide.dev**

You should receive a response within 48 hours. If for some reason you do not, please follow up via email to ensure we received your original message.

Please include the following information in your report:

- Type of vulnerability
- Full paths of source file(s) related to the manifestation of the vulnerability
- Location of the affected source code (tag/branch/commit or direct URL)
- Step-by-step instructions to reproduce the issue
- Proof-of-concept or exploit code (if possible)
- Impact of the vulnerability, including how an attacker might exploit it

This information will help us triage your report more quickly.

## Security Measures

### Client-Side Encryption

CCIDE uses AES-256 encryption for all sensitive data:
- API keys are encrypted before storage in IndexedDB
- Encryption keys are derived using PBKDF2
- Random salts and IVs are generated for each encryption

### Data Storage

- All data is stored client-side in IndexedDB
- No data is transmitted to CCIDE servers
- Users maintain full control over their data
- Data can be exported and deleted at any time

### API Key Security

- API keys are never logged or transmitted to our servers
- Keys are encrypted at rest
- Keys are only decrypted when needed for API calls
- Keys are sent directly to the respective LLM providers (Anthropic, OpenAI, etc.)

### Input Validation

- All user inputs are sanitized
- XSS protection is implemented
- No eval() or similar dangerous functions
- Content Security Policy headers

### Dependencies

- Regular security audits via npm audit
- Dependencies are kept up to date
- Only trusted, well-maintained packages are used
- Minimal dependency footprint

## Security Best Practices for Users

1. **Protect Your API Keys**
   - Never share your API keys
   - Rotate keys if compromised
   - Use environment-specific keys

2. **Browser Security**
   - Keep your browser updated
   - Use a secure browser
   - Enable browser security features
   - Be cautious with browser extensions

3. **Data Protection**
   - Export important data regularly
   - Clear browser data when using shared computers
   - Use strong master passwords if we add that feature

4. **Network Security**
   - Use HTTPS always
   - Be cautious on public WiFi
   - Consider using a VPN for sensitive work

## Disclosure Policy

When we receive a security bug report, we will:

1. Confirm the problem and determine affected versions
2. Audit code to find similar problems
3. Prepare fixes for all supported versions
4. Release patches as soon as possible

## Comments on This Policy

If you have suggestions on how this process could be improved, please submit a pull request or email security@ccide.dev.

## Security Updates

Security updates will be released as patch versions (e.g., 0.1.1) and announced:
- In the CHANGELOG.md
- On GitHub Releases
- Via GitHub Security Advisories

## Hall of Fame

We recognize and thank the following security researchers for their responsible disclosure:

(None yet - be the first!)

---

Thank you for helping keep CCIDE and our users safe!
