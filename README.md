# Qwen3.5-Omni Multimodal API Tester - Deployment Guide

## Overview

A web application for testing the Qwen3.5-Omni multimodal API with support for:

- **Input modalities**: Text, Image, Audio, Video
- **Output modalities**: Text-only or Text + Audio
- **Modes**: Non-realtime (SSE streaming) and Realtime (WebSocket)
- **Models**: Qwen3.5-Omni-Plus, Qwen3-Omni-Flash, Qwen-Omni-Turbo (and their realtime variants)
- **Languages**: English and Chinese (default: English)
- **Design**: Apple-style minimalist white interface

## Prerequisites

- Node.js 18 or higher (required for native `fetch` API)
- npm or yarn
- A valid DashScope API key from [Alibaba Cloud](https://dashscope.aliyuncs.com/)

## Quick Start

### 1. Install Dependencies

```bash
git clone https://github.com/WhiteMasky/qwen-omni-tester.git
```

### 2. Start the Server

```bash
cd qwen-omni-tester
```

### 3. Install Dependencies

```bash
npm install
```

### 4. Start the Server

```bash
npm start
```

The application will be available at: http://localhost:3456

### 3. Configure API Key

1. Open http://localhost:3456 in your browser
2. Enter your DashScope API key in the sidebar
3. Select your region (Beijing for China, Singapore for International)
4. Start testing!

## Architecture

```
qwen-omni-tester/
├── server.js              # Express backend
│   ├── POST /api/chat/completions    # Non-realtime API proxy (SSE)
│   └── WS /ws/realtime               # Realtime API WebSocket relay
├── public/
│   └── index.html         # Frontend single-page application
├── package.json           # Project dependencies
└── DEPLOY.md              # This file
```

### Backend (server.js)

The Node.js Express server acts as a proxy between the browser and the DashScope API:

- **Non-realtime mode**: Proxies HTTP POST requests with SSE streaming to `dashscope.aliyuncs.com/compatible-mode/v1/chat/completions`
- **Realtime mode**: Relays WebSocket messages between the browser and `dashscope.aliyuncs.com/api-ws/v1/realtime`

The server handles:
- API key forwarding via headers (non-realtime) or query params (realtime)
- Region routing (Beijing vs Singapore endpoints)
- Large payload support (up to 200MB for media files)
- WebSocket connection lifecycle management

### Frontend (public/index.html)

A single-file application containing HTML, CSS, and JavaScript:

- **Apple-style UI**: SF Pro fonts, white backgrounds, subtle borders, blur effects
- **Bilingual support**: Full English and Chinese translations
- **Non-realtime chat**: SSE streaming with markdown-like text rendering and audio playback
- **Realtime session**: WebSocket-based live audio/video conversation with:
  - Microphone input (16kHz PCM)
  - Camera input (JPEG frames at ~1fps)
  - Audio output playback (24kHz PCM with queue-based scheduling)
  - Audio visualizer (frequency bar chart)
  - VAD (Voice Activity Detection) configuration
- **All API parameters exposed**: Temperature, top_p, top_k, max_tokens, repetition_penalty, enable_search, enable_thinking, voice selection, audio format
- **Media handling**: File attachments for images, audio, video; in-browser audio recording

## Configuration Options

### Server Configuration

Edit `server.js` to change the listening port (default: 3456):

```javascript
const PORT = 3456;
```

### API Parameters

All parameters are configurable through the UI sidebar:

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Temperature | 0 - 2 | 0.70 | Controls randomness |
| Top P | 0 - 1 | 0.80 | Nucleus sampling |
| Top K | 1 - 100 | 50 | Top-k sampling |
| Max Tokens | 1 - 32768 | 2048 | Maximum output length |
| Repetition Penalty | 1.0 - 2.0 | 1.00 | Penalize repetition |
| Enable Search | toggle | off | Enable web search (Qwen3.5 only) |
| Enable Thinking | toggle | off | Enable reasoning mode (Flash only) |

### Output Configuration

- **Output Modality**: Text-only or Text + Audio
- **Voice**: 55+ voices for Qwen3.5-Omni (default: Tina), 41+ for Flash (default: Cherry), 4 for Turbo
- **Audio Format**: WAV, MP3, or PCM (non-realtime only)

### VAD Configuration (Realtime Mode)

| Parameter | Range | Default | Description |
|-----------|-------|---------|-------------|
| Enable VAD | toggle | on | Auto-detect speech |
| Threshold | 0 - 1 | 0.50 | Speech detection sensitivity |
| Silence Duration | 100 - 5000 ms | 800 | Silence before response |
| Prefix Padding | 0 - 3000 ms | 500 | Audio padding before speech |

## Deployment Options

### Local Development

```bash
npm install
npm start
```

Access at http://localhost:3456

### Production with PM2

For production deployments, use PM2 for process management:

```bash
# Install PM2 globally
npm install -g pm2

# Start with PM2
pm2 start server.js --name qwen-omni-tester

# Enable auto-restart on server reboot
pm2 startup
pm2 save

# Monitor
pm2 monit

# View logs
pm2 logs qwen-omni-tester
```

### Behind Nginx Reverse Proxy

For production deployments with HTTPS:

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3456;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;  # For long-lived WebSocket connections
    }
}
```

### Docker Deployment

Create a `Dockerfile`:

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --production
COPY . .
EXPOSE 3456
CMD ["node", "server.js"]
```

Build and run:

```bash
docker build -t qwen-omni-tester .
docker run -p 3456:3456 qwen-omni-tester
```

### Cloud Platform Deployment

The application can be deployed to any platform that supports Node.js:

- **Vercel**: Requires serverless function adaptation
- **Railway**: Direct deployment supported
- **Render**: Direct deployment supported
- **AWS EC2 / GCP Compute**: Standard Node.js deployment
- **Fly.io**: Container-based deployment

## Browser Requirements

- Modern browser with WebSocket and Web Audio API support
- Chrome 80+, Safari 14+, Firefox 75+, Edge 80+
- Microphone access for realtime audio input
- Camera access for realtime video input (optional)

## Security Notes

- API keys are entered client-side and forwarded to the DashScope API
- The server does not store API keys
- Use HTTPS in production to protect API key transmission
- Consider adding authentication for production deployments

## Troubleshooting

### WebSocket Connection Fails

- Check that the server is running
- Verify API key is valid
- Check network/firewall settings for WebSocket traffic
- Ensure Nginx is configured for WebSocket upgrade headers

### Audio Playback Issues

- Ensure browser allows autoplay for audio
- Check browser permissions for microphone/camera
- Verify audio output device is configured correctly

### Large Media Files

- The server supports up to 200MB payloads
- Video files are sent as base64 data URLs
- Consider compressing large files before upload

## API Endpoints

### Non-Realtime API

```
POST /api/chat/completions
Headers:
  Content-Type: application/json
  X-API-Key: <your-api-key>
  X-Region: beijing | singapore
Body: Standard OpenAI-compatible format with Qwen extensions
```

### Realtime WebSocket

```
WS /ws/realtime?apiKey=<key>&model=<model>&region=<region>
Protocol: DashScope Realtime API
```

## License

This project is for testing purposes only. Please refer to the Qwen and DashScope documentation for API usage terms and conditions.

## Resources

- [Qwen Documentation](https://help.aliyun.com/zh/model-studio/getting-started/models-qwen)
- [DashScope API Docs](https://help.aliyun.com/zh/dashscope/)
- [Qwen3.5-Omni API Reference](https://help.aliyun.com/zh/model-studio/developer-reference/qwen-omni)
