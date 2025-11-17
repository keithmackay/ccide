# CCIDE Troubleshooting Guide

## Browser Extension Errors

### Error: "merchantID is required" in console

**Symptoms:**
- Console shows error: `Uncaught error that a merchantID is required at vx (container.js:...)`
- Error comes from `container.js`, not CCIDE source code

**Cause:**
This error is from a **browser extension** (likely related to Google Pay, shopping assistants, or payment autofill features), not from CCIDE itself.

**Solution:**
This error is **harmless and automatically suppressed** by CCIDE's error handling. The application will continue to work normally.

**If you want to eliminate the error completely:**

1. **Disable browser extensions temporarily:**
   - Chrome: Go to `chrome://extensions/`
   - Edge: Go to `edge://extensions/`
   - Firefox: Go to `about:addons`
   - Disable extensions one by one to identify the culprit

2. **Common extensions that cause this:**
   - Google Pay or payment autofill extensions
   - Shopping assistants (Honey, Capital One Shopping, etc.)
   - Coupon finders
   - Price comparison tools

3. **Alternative: Use Incognito/Private Mode:**
   - Extensions are usually disabled in incognito mode
   - Test CCIDE in incognito to verify it's an extension issue

**Verification:**
After implementing error handling (v0.2.1+), you should see:
```
[Global] External script error suppressed (likely from browser extension): merchantID is required
```

This confirms the error is being caught and won't affect CCIDE functionality.

---

## LLM Conversation Errors

### Error: "LLM service not initialized"

**Symptoms:**
- Console shows: `[ConversationView] LLM service not initialized, using simulated response`
- Conversations show simulated responses instead of real AI

**Cause:**
- No API key configured in Settings
- Settings locked (password not entered)
- API key failed to decrypt

**Solution:**
1. Open Settings (gear icon in right panel)
2. Enter your account password to unlock Settings
3. Add LLM Configuration:
   - Provider: `anthropic` or `openai`
   - Model Name: `claude-sonnet-4-5-20250929` (or your preferred model)
   - API Key: Your actual API key (starts with `sk-ant-` for Anthropic)
4. Check "Set as default"
5. Save configuration
6. Reload the page

**Verification:**
Console should show:
```
[App] LLM service initialized successfully with model: claude-sonnet-4-5-20250929
```

---

### Error: "Claude API error: 401"

**Symptoms:**
- Console shows: `[ClaudeLLMService] Response status: 401`
- Error message: `invalid x-api-key`

**Cause:**
Invalid or expired API key

**Solution:**
1. Verify your API key at https://console.anthropic.com/
2. Generate a new API key if needed
3. Update the key in Settings
4. Ensure the key starts with `sk-ant-`

---

### Error: "Network error: Failed to fetch"

**Symptoms:**
- Console shows: `[ClaudeLLMService] Fetch error: TypeError: Failed to fetch`
- Conversations fail immediately

**Cause:**
- No internet connection
- Firewall blocking API requests
- CORS issues
- VPN interference

**Solution:**
1. Check internet connection
2. Try disabling VPN temporarily
3. Check if corporate firewall is blocking `api.anthropic.com`
4. Verify network tab in DevTools for failed requests

---

### Error: "API key present: false"

**Symptoms:**
- Console shows: `[ClaudeLLMService] API key present: false`
- API key length: 0

**Cause:**
- API key not saved in Settings
- Decryption failed (wrong password)
- Settings database corrupted

**Solution:**
1. Re-enter API key in Settings
2. Verify you're using the correct account password
3. If issue persists, try creating a new account:
   - This will clear all encrypted data
   - You'll need to re-enter API keys

---

## Session and Authentication Issues

### Session expires too quickly

**Behavior:**
Session expires even though you're actively using the app

**Explanation:**
Sessions expire after **30 minutes of conversation inactivity**, not general app usage.

**To extend session:**
- Send at least one LLM message every 30 minutes
- Each conversation interaction resets the 30-minute timer

---

### Re-authentication modal appears unexpectedly

**Cause:**
30 minutes have passed since your last LLM conversation

**Solution:**
- Enter your password in the modal
- Your pending message will send automatically
- Session will be refreshed for another 30 minutes

---

## Database Issues

### Error: "Failed to open database"

**Symptoms:**
- Cannot save settings
- Account creation fails
- IndexedDB errors in console

**Cause:**
- Browser storage disabled
- Incognito mode with restricted storage
- Storage quota exceeded
- Browser privacy settings too strict

**Solution:**
1. Check browser storage settings
2. Clear old IndexedDB data: DevTools → Application → IndexedDB → Delete `ccide_db`
3. Ensure cookies/storage are enabled
4. Try a different browser

---

### Lost encrypted data after password change

**Explanation:**
Changing your account password does **NOT** re-encrypt stored data. You must:
1. Change LLM encryption password separately
2. Or delete account and create new one with new password

**To safely change password:**
1. Export your LLM configurations (save API keys elsewhere)
2. Delete account in Settings
3. Create new account with new password
4. Re-enter LLM configurations

---

## Development Issues

### Vite dev server not starting

**Solution:**
```bash
# Kill existing processes on port 3000
lsof -ti:3000 | xargs kill -9

# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Start dev server
npm run dev
```

---

### TypeScript errors after pulling latest code

**Solution:**
```bash
# Clean build artifacts
rm -rf dist

# Type check
npm run type-check

# Build to see errors
npm run build
```

---

## Getting Help

If your issue isn't listed here:

1. **Check console logs:**
   - Open DevTools (F12)
   - Look for `[App]`, `[ConversationView]`, or `[ClaudeLLMService]` logs
   - Copy relevant error messages

2. **Check browser:**
   - Try incognito mode (disables extensions)
   - Try different browser
   - Clear cache and cookies

3. **Report issue:**
   - GitHub: https://github.com/keithmackay/ccide/issues
   - Include:
     - Browser version
     - Console logs
     - Steps to reproduce
     - Screenshots if helpful

---

## Known Issues

- **merchantID error from browser extensions** - Automatically suppressed (v0.2.1+)
- **Session expires during long reads** - Working as designed (conversation inactivity timeout)
- **Cannot recover forgotten password** - By design for security (local encryption)

---

*Last updated: 2025-01-17*
