const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
const PORT = 3456;

app.use(express.json({ limit: '200mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Proxy non-realtime API calls
app.post('/api/chat/completions', async (req, res) => {
  const apiKey = req.headers['x-api-key'];
  const region = req.headers['x-region'] || 'beijing';
  
  const baseUrl = region === 'singapore'
    ? 'https://dashscope-intl.aliyuncs.com'
    : 'https://dashscope.aliyuncs.com';

  try {
    const response = await fetch(`${baseUrl}/compatible-mode/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });

    // Stream the response
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      res.write(decoder.decode(value, { stream: true }));
    }
    res.end();
  } catch (error) {
    console.error('Proxy error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create HTTP server
const server = http.createServer(app);

// WebSocket proxy for realtime API
const wss = new WebSocket.Server({ server, path: '/ws/realtime' });

wss.on('connection', (clientWs, req) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const apiKey = url.searchParams.get('apiKey');
  const model = url.searchParams.get('model') || 'qwen3.5-omni-plus-realtime';
  const region = url.searchParams.get('region') || 'beijing';

  const wsBase = region === 'singapore'
    ? 'wss://dashscope-intl.aliyuncs.com'
    : 'wss://dashscope.aliyuncs.com';

  const upstreamUrl = `${wsBase}/api-ws/v1/realtime?model=${encodeURIComponent(model)}`;
  
  const upstreamWs = new WebSocket(upstreamUrl, {
    headers: {
      'Authorization': `Bearer ${apiKey}`,
    },
  });

  upstreamWs.on('open', () => {
    clientWs.send(JSON.stringify({ type: 'proxy.connected' }));
  });

  upstreamWs.on('message', (data) => {
    if (clientWs.readyState === WebSocket.OPEN) {
      clientWs.send(data.toString());
    }
  });

  upstreamWs.on('error', (err) => {
    clientWs.send(JSON.stringify({ type: 'proxy.error', error: err.message }));
  });

  upstreamWs.on('close', (code, reason) => {
    clientWs.send(JSON.stringify({ type: 'proxy.closed', code, reason: reason.toString() }));
    clientWs.close();
  });

  clientWs.on('message', (data) => {
    if (upstreamWs.readyState === WebSocket.OPEN) {
      upstreamWs.send(data.toString());
    }
  });

  clientWs.on('close', () => {
    upstreamWs.close();
  });

  clientWs.on('error', () => {
    upstreamWs.close();
  });
});

server.listen(PORT, () => {
  console.log(`\n  Qwen-Omni Tester running at:\n`);
  console.log(`  → http://localhost:${PORT}\n`);
});
