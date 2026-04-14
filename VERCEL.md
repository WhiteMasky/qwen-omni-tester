# Vercel Deployment Guide

## Important: Realtime WebSocket Limitation

Vercel's Serverless architecture **does not support long-lived WebSocket connections**. This means:

- **Non-realtime mode**: Works perfectly
- **Realtime mode**: Will NOT work on Vercel

If you need realtime functionality, consider deploying to:
- Railway.app
- Render.com
- Fly.io
- Any VPS with Node.js support

## Deploying to Vercel (Non-Realtime Only)

### Option 1: Via Vercel Dashboard

1. Push your code to GitHub
2. Go to [vercel.com](https://vercel.com)
3. Click "Add New..." → "Project"
4. Import your repository
5. Vercel will auto-detect the configuration from `vercel.json`
6. Click "Deploy"

### Option 2: Via Vercel CLI

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy as preview
vercel deploy

# Deploy to production
vercel deploy --prod
```

### Option 3: Via Vercel Git Integration

1. Connect your GitHub/GitLab/Bitbucket account
2. Every push to main branch will trigger automatic deployment
3. Pull requests get preview deployments

## Project Structure for Vercel

```
qwen-omni-tester/
├── api/
│   └── chat-completions.js    # Serverless function for non-realtime API
├── public/
│   └── index.html             # Static frontend
├── vercel.json                # Vercel configuration
├── package.json
└── DEPLOY.md
```

## Environment Variables

You can set these in Vercel Dashboard → Project Settings → Environment Variables:

- `DASHSCOPE_API_KEY` (optional): Default API key
- `DEFAULT_REGION`: Default region (beijing or singapore)

## Limitations

1. **No WebSocket**: Realtime mode requires persistent connections which Vercel doesn't support
2. **Serverless Timeout**: Maximum execution time is 60 seconds (Hobby) or 15 minutes (Pro)
3. **Request Body Size**: Limited to 4.5MB for serverless functions
4. **No State**: Each request is stateless, no session persistence

## Alternative: Hybrid Approach

If you want both modes:

1. Deploy the **frontend + non-realtime API** to Vercel
2. Deploy the **WebSocket server** (server.js) to Railway/Render
3. Update the frontend to point to the WebSocket server URL for realtime mode

## Updating the Frontend for Hybrid Deployment

If using a separate WebSocket server, update `public/index.html`:

```javascript
// Change this line in rtConnect():
const wsUrl = `wss://your-websocket-server.com/ws/realtime?apiKey=...`
```

## Cost Estimation

- **Vercel Hobby**: Free (100GB bandwidth, suitable for testing)
- **Vercel Pro**: $20/month (1TB bandwidth)
- **WebSocket Server**: Railway ~$5/month or Render free tier
