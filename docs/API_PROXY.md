# API Proxy Server

## Overview

CCIDE uses a local proxy server to handle API requests to LLM providers. This is necessary because browsers block direct API calls due to CORS (Cross-Origin Resource Sharing) restrictions.

## Why a Proxy Server?

Modern browsers enforce CORS policies that prevent web applications from making direct requests to external APIs. LLM provider APIs (Anthropic, OpenAI, etc.) don't include CORS headers that would allow browser-based applications to call them directly.

The proxy server:
- Runs locally on your machine (http://localhost:3001)
- Receives requests from the CCIDE frontend
- Forwards requests to the actual LLM APIs
- Returns responses back to the frontend
- Keeps your API keys secure (never exposed in browser network logs)

## Starting the Proxy Server

### Option 1: Run Both Servers Together (Recommended)
```bash
npm run dev:all
```

This starts both the Vite dev server (port 3000) and the proxy server (port 3001) simultaneously.

### Option 2: Run Servers Separately

**Terminal 1 - Frontend:**
```bash
npm run dev
```

**Terminal 2 - Proxy:**
```bash
npm run proxy
```

## Health Check

Verify the proxy is running:
```bash
curl http://localhost:3001/health
```

Expected response:
```json
{
  "status": "ok",
  "service": "CCIDE API Proxy"
}
```

## Supported Endpoints

### Anthropic Claude API
- **Endpoint:** `POST /api/anthropic/messages`
- **Request Body:**
  ```json
  {
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 4096,
    "temperature": 0.7,
    "system": "System prompt...",
    "messages": [
      { "role": "user", "content": "Hello!" }
    ],
    "stream": true
  }
  ```

### OpenAI GPT API
- **Endpoint:** `POST /api/openai/chat/completions`
- **Request Body:**
  ```json
  {
    "apiKey": "sk-...",
    "model": "gpt-4",
    "max_tokens": 4096,
    "temperature": 0.7,
    "messages": [
      { "role": "system", "content": "System prompt..." },
      { "role": "user", "content": "Hello!" }
    ],
    "stream": true
  }
  ```

## Security Considerations

### API Key Handling
- API keys are encrypted in IndexedDB using your account password
- Keys are decrypted in memory only when needed
- Keys are sent to the proxy via HTTPS-like localhost connection
- Proxy forwards keys to actual APIs but doesn't log or store them
- Keys never appear in browser DevTools Network tab

### Local-Only Access
- Proxy only accepts requests from http://localhost:3000 (CORS restricted)
- Server only listens on localhost (not accessible from network)
- No external connections except to LLM provider APIs

## Troubleshooting

### "Failed to fetch" Errors

**Symptom:** Console shows "Failed to fetch" when sending messages

**Causes:**
1. Proxy server is not running
2. Proxy is running on wrong port
3. Firewall blocking localhost connections

**Solution:**
```bash
# Check if proxy is running
curl http://localhost:3001/health

# If not running, start it
npm run proxy

# Or run both servers together
npm run dev:all
```

### "Connection Refused" Errors

**Symptom:** `ECONNREFUSED` errors in console

**Causes:**
1. Proxy server crashed or didn't start
2. Port 3001 is already in use

**Solution:**
```bash
# Check what's using port 3001
lsof -ti:3001

# Kill any process on that port
lsof -ti:3001 | xargs kill -9

# Restart proxy
npm run proxy
```

### CORS Errors (Even with Proxy)

**Symptom:** CORS errors still appearing

**Causes:**
1. Frontend is running on a different port than 3000
2. Proxy CORS configuration is incorrect

**Solution:**
- Ensure Vite is running on http://localhost:3000
- Check proxy CORS configuration in `server/proxy.js`

### API Key Errors

**Symptom:** "API key is required" or "invalid x-api-key" errors

**Causes:**
1. API key not configured in Settings
2. Wrong account password (decryption failed)
3. API key is invalid or expired

**Solution:**
1. Open Settings (gear icon)
2. Enter your account password
3. Add/Update LLM Configuration with valid API key
4. Verify key at provider's console:
   - Anthropic: https://console.anthropic.com/
   - OpenAI: https://platform.openai.com/api-keys

## Architecture

```
┌─────────────────┐
│  Browser        │
│  (Frontend)     │
│  localhost:3000 │
└────────┬────────┘
         │
         │ HTTP Request (with API key in body)
         │
         ▼
┌─────────────────┐
│  Proxy Server   │
│  Node.js        │
│  localhost:3001 │
└────────┬────────┘
         │
         │ HTTPS Request (with API key in headers)
         │
         ▼
┌─────────────────┐
│  LLM API        │
│  Anthropic      │
│  OpenAI         │
│  etc.           │
└─────────────────┘
```

## Configuration

### Changing Proxy Port

Edit `server/proxy.js`:
```javascript
const PORT = 3001; // Change to desired port
```

Edit `src/services/LLMService.ts`:
```typescript
// Update both ClaudeLLMService and OpenAILLMService endpoints
this.apiEndpoint = config.endpoint || 'http://localhost:YOUR_PORT/api/anthropic/messages';
```

### Adding More CORS Origins

Edit `server/proxy.js`:
```javascript
app.use(cors({
  origin: ['http://localhost:3000', 'http://localhost:5173'], // Add more origins
  credentials: true,
}));
```

## Production Deployment

**⚠️ WARNING:** This proxy is designed for local development only.

For production deployment:
1. Use environment variables for sensitive configuration
2. Implement proper authentication/authorization
3. Add rate limiting
4. Use HTTPS with valid certificates
5. Deploy proxy separately from frontend
6. Consider using a managed proxy service or serverless functions

## Development

### Proxy Server Code Location
```
server/
  └── proxy.js    # Express server with API forwarding
```

### Testing the Proxy

```bash
# Test health endpoint
curl http://localhost:3001/health

# Test Anthropic proxy (requires valid API key)
curl -X POST http://localhost:3001/api/anthropic/messages \
  -H "Content-Type: application/json" \
  -d '{
    "apiKey": "sk-ant-...",
    "model": "claude-sonnet-4-5-20250929",
    "max_tokens": 100,
    "messages": [{"role": "user", "content": "Hello!"}]
  }'
```

### Logging

The proxy logs all requests to console:
- Request method and endpoint
- Model being used
- Number of messages
- Response status codes
- Errors (if any)

View logs in the terminal where you ran `npm run proxy`.

---

*Last updated: 2025-11-17*
