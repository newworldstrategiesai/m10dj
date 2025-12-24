# Dedicated Server Implementation for YouTube Audio Download

## Overview
Deploy a separate Node.js server (not serverless) that handles YouTube audio downloads. This server will have Python, FFmpeg, and yt-dlp installed.

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│   Vercel App    │         │  Dedicated       │         │   Supabase      │
│  (Serverless)   │────────▶│  Download Server │────────▶│   Storage       │
│                 │  HTTP   │  (Node.js)       │  Upload │                 │
└─────────────────┘         └──────────────────┘         └─────────────────┘
```

## Implementation Options

### Option A: Separate Express Server (Recommended)
Deploy a simple Express.js server on a VPS (DigitalOcean, Linode, AWS EC2, etc.)

### Option B: Railway/Render Service
Use Railway.app or Render.com which support long-running processes

### Option C: Docker Container
Deploy a Docker container with all dependencies pre-installed

## Detailed Implementation (Option A - Express Server)

### 1. Server Setup

**File: `download-server/server.js`**
```javascript
const express = require('express');
const cors = require('cors');
const { downloadYouTubeAudio } = require('./youtube-downloader');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 3001;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Download endpoint
app.post('/api/download-youtube-audio', async (req, res) => {
  try {
    const { requestId, youtubeUrl, songTitle, songArtist } = req.body;
    
    // Validate request
    if (!requestId || !youtubeUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Authenticate (check API key or JWT)
    const apiKey = req.headers['x-api-key'];
    if (apiKey !== process.env.DOWNLOAD_SERVER_API_KEY) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Update status to processing
    await supabase
      .from('crowd_requests')
      .update({ audio_download_status: 'processing' })
      .eq('id', requestId);

    // Download audio
    const result = await downloadYouTubeAudio(
      youtubeUrl,
      requestId,
      songTitle,
      songArtist
    );

    if (!result.success) {
      // Update status to failed
      await supabase
        .from('crowd_requests')
        .update({
          audio_download_status: 'failed',
          audio_download_error: result.error
        })
        .eq('id', requestId);

      return res.status(500).json({ error: result.error });
    }

    // Update status to completed
    await supabase
      .from('crowd_requests')
      .update({
        audio_download_status: 'completed',
        downloaded_audio_url: result.url,
        audio_downloaded_at: new Date().toISOString()
      })
      .eq('id', requestId);

    res.json({
      success: true,
      url: result.url,
      path: result.path
    });

  } catch (error) {
    console.error('Download error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(PORT, () => {
  console.log(`Download server running on port ${PORT}`);
});
```

### 2. Package.json

**File: `download-server/package.json`**
```json
{
  "name": "youtube-download-server",
  "version": "1.0.0",
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "dependencies": {
    "express": "^4.18.2",
    "cors": "^2.8.5",
    "yt-dlp-wrap": "^2.3.12",
    "@supabase/supabase-js": "^2.43.4"
  }
}
```

### 3. Dockerfile (Optional)

**File: `download-server/Dockerfile`**
```dockerfile
FROM node:18-slim

# Install Python and FFmpeg
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN pip3 install yt-dlp

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 3001
CMD ["node", "server.js"]
```

### 4. Update Vercel App to Call Dedicated Server

**File: `pages/api/crowd-request/download-youtube-audio.js`**
```javascript
import { requireSuperAdmin } from '@/utils/auth-helpers/api-auth';

const DOWNLOAD_SERVER_URL = process.env.DOWNLOAD_SERVER_URL; // e.g., https://downloads.m10djcompany.com
const DOWNLOAD_SERVER_API_KEY = process.env.DOWNLOAD_SERVER_API_KEY;

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Require super admin
    await requireSuperAdmin(req, res);

    const { requestId, youtubeUrl } = req.body;

    if (!DOWNLOAD_SERVER_URL) {
      return res.status(503).json({ 
        error: 'Download server not configured. Please contact support.' 
      });
    }

    // Forward request to dedicated download server
    const response = await fetch(`${DOWNLOAD_SERVER_URL}/api/download-youtube-audio`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': DOWNLOAD_SERVER_API_KEY
      },
      body: JSON.stringify({
        requestId,
        youtubeUrl
      })
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json(data);
    }

    res.status(200).json(data);

  } catch (error) {
    console.error('Error forwarding download request:', error);
    res.status(500).json({ 
      error: 'Failed to initiate download',
      details: error.message 
    });
  }
}
```

### 5. Environment Variables

**Vercel Environment Variables:**
```
DOWNLOAD_SERVER_URL=https://downloads.m10djcompany.com
DOWNLOAD_SERVER_API_KEY=your-secure-api-key-here
```

**Download Server Environment Variables:**
```
PORT=3001
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DOWNLOAD_SERVER_API_KEY=your-secure-api-key-here
NODE_ENV=production
```

## Deployment Options (FREE TIERS)

### Option 1: Oracle Cloud Free Tier (BEST FREE OPTION) ⭐
- **Cost**: FREE forever (no credit card required for ARM instances)
- **Resources**: 
  - 2 AMD VMs (1/8 OCPU, 1GB RAM each) OR
  - 4 ARM VMs (Ampere A1: 4 OCPU, 24GB RAM total)
- **Setup**: 
  1. Sign up at cloud.oracle.com (free account)
  2. Create ARM-based VM instance (Ampere A1)
  3. Install Node.js, Python, FFmpeg via apt
  4. Clone repo and run server
  5. Use PM2 for process management
  6. Set up Nginx reverse proxy (free)
  7. Configure SSL with Let's Encrypt (free)
- **Pros**: Truly free, good resources, no time limits
- **Cons**: Slightly more setup, Oracle account required

### Option 2: Render.com Free Tier
- **Cost**: FREE (with limitations)
- **Resources**: 
  - 750 hours/month free
  - Spins down after 15 min inactivity (cold start ~30s)
- **Setup**:
  1. Connect GitHub repo
  2. Render auto-detects Node.js
  3. Add build command: `npm install`
  4. Add start command: `node server.js`
  5. Render handles deployment and SSL
- **Pros**: Very easy setup, free SSL, auto-deploy
- **Cons**: Cold starts after inactivity, limited hours

### Option 3: Fly.io Free Tier
- **Cost**: FREE (with limitations)
- **Resources**: 
  - 3 shared-cpu VMs
  - 3GB persistent volume
  - 160GB outbound data transfer
- **Setup**:
  1. Install Fly CLI
  2. Create `fly.toml` config
  3. Deploy with `fly deploy`
  4. Fly handles SSL and deployment
- **Pros**: Good free tier, fast, global edge
- **Cons**: More complex setup, CLI required

### Option 4: Railway.app ($5 Credit Monthly)
- **Cost**: FREE (with $5 monthly credit)
- **Resources**: 
  - $5 credit covers ~500 hours of usage
  - Auto-deploy from GitHub
- **Setup**: Similar to Render, very easy
- **Pros**: Easy setup, no cold starts
- **Cons**: Limited to $5/month (may need to upgrade later)

## Security Considerations

1. **API Key Authentication**: Use a strong API key
2. **Rate Limiting**: Implement rate limiting on download server
3. **Request Validation**: Validate all inputs
4. **HTTPS Only**: Use SSL/TLS for all communication
5. **IP Whitelisting**: Optionally whitelist Vercel IPs
6. **File Size Limits**: Set maximum file size limits
7. **Timeout Limits**: Set reasonable timeout limits

## Monitoring & Maintenance

1. **Health Checks**: Monitor `/health` endpoint
2. **Logging**: Log all download attempts
3. **Error Tracking**: Use Sentry or similar
4. **Disk Space**: Monitor temp directory usage
5. **Updates**: Keep yt-dlp updated regularly

## Cost Estimate (FREE OPTIONS)

### Oracle Cloud Free Tier
- **Server**: FREE forever
- **Bandwidth**: 10TB/month free
- **Storage**: 200GB free
- **Total**: $0/month ✅

### Render.com Free Tier
- **Server**: FREE (750 hours/month)
- **Bandwidth**: Included
- **Storage**: Included
- **Total**: $0/month ✅ (may need $7/month for always-on later)

### Fly.io Free Tier
- **Server**: FREE (3 VMs)
- **Bandwidth**: 160GB/month free
- **Storage**: 3GB free
- **Total**: $0/month ✅

### Railway.app
- **Server**: FREE ($5 credit/month)
- **Bandwidth**: Included
- **Storage**: Included
- **Total**: $0/month ✅ (if usage stays under $5)

## Migration Steps

1. Set up dedicated server
2. Deploy download server code
3. Test download functionality
4. Update Vercel environment variables
5. Deploy updated Vercel app
6. Monitor for issues
7. Remove serverless error handling (optional)

## Advantages

✅ Works reliably in production
✅ Can handle longer downloads
✅ Full control over environment
✅ Can scale if needed
✅ Better error handling

## Disadvantages

❌ Additional server to maintain
❌ Additional cost
❌ Need to monitor uptime
❌ SSL certificate management
❌ More complex deployment

