import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3001;

// Enable CORS for requests from the Vite dev server
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
}));

// Parse JSON request bodies
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'CCIDE API Proxy' });
});

// Proxy endpoint for Anthropic Claude API
app.post('/api/anthropic/messages', async (req, res) => {
  try {
    const { apiKey, ...requestBody } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required',
        type: 'invalid_request_error'
      });
    }

    console.log('[Proxy] Forwarding request to Anthropic API...');
    console.log('[Proxy] Model:', requestBody.model);
    console.log('[Proxy] Messages:', requestBody.messages?.length || 0);
    console.log('[Proxy] Stream:', requestBody.stream || false);

    // Forward request to Anthropic API
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Proxy] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Proxy] API error:', error);
      return res.status(response.status).json({
        error: error,
        type: 'api_error',
        status: response.status
      });
    }

    // If streaming, pipe the response
    if (requestBody.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Pipe the response stream
      response.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
        abort(err) {
          console.error('[Proxy] Stream error:', err);
          res.end();
        }
      }));
    } else {
      // Non-streaming response
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({
      error: error.message || 'Internal server error',
      type: 'internal_error'
    });
  }
});

// Proxy endpoint for OpenAI API
app.post('/api/openai/chat/completions', async (req, res) => {
  try {
    const { apiKey, ...requestBody } = req.body;

    if (!apiKey) {
      return res.status(400).json({
        error: 'API key is required'
      });
    }

    console.log('[Proxy] Forwarding request to OpenAI API...');
    console.log('[Proxy] Model:', requestBody.model);
    console.log('[Proxy] Messages:', requestBody.messages?.length || 0);
    console.log('[Proxy] Stream:', requestBody.stream || false);

    // Forward request to OpenAI API
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('[Proxy] Response status:', response.status);

    if (!response.ok) {
      const error = await response.text();
      console.error('[Proxy] API error:', error);
      return res.status(response.status).json({ error });
    }

    // If streaming, pipe the response
    if (requestBody.stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      // Pipe the response stream
      response.body.pipeTo(new WritableStream({
        write(chunk) {
          res.write(chunk);
        },
        close() {
          res.end();
        },
        abort(err) {
          console.error('[Proxy] Stream error:', err);
          res.end();
        }
      }));
    } else {
      // Non-streaming response
      const data = await response.json();
      res.json(data);
    }
  } catch (error) {
    console.error('[Proxy] Error:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
});

app.listen(PORT, () => {
  console.log(`
╔═══════════════════════════════════════════════════════╗
║                                                       ║
║   🚀 CCIDE API Proxy Server                          ║
║                                                       ║
║   Server running on: http://localhost:${PORT}         ║
║   Health check: http://localhost:${PORT}/health      ║
║                                                       ║
║   Proxying requests to:                              ║
║   - Anthropic Claude API                             ║
║   - OpenAI GPT API                                   ║
║                                                       ║
║   CORS enabled for: http://localhost:3000            ║
║                                                       ║
╚═══════════════════════════════════════════════════════╝
  `);
});
