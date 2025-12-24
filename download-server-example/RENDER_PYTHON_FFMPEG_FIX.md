# Fix: yt-dlp ENOENT Error on Render

## Problem
The error `spawn yt-dlp ENOENT` means the `yt-dlp` binary is not found or not executable.

## Solution Options

### Option 1: Use Render's Docker (Recommended)

Render's Docker environment has Python and FFmpeg pre-installed.

1. **Create a Dockerfile** in `download-server-example/`:

```dockerfile
FROM node:18-slim

# Install Python, FFmpeg, and dependencies
RUN apt-get update && apt-get install -y \
    python3 \
    python3-pip \
    ffmpeg \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install Node dependencies
RUN npm install

# Copy application files
COPY . .

# Expose port
EXPOSE 10000

# Start server
CMD ["node", "server.js"]
```

2. **Update Render Settings**:
   - **Environment**: Change from "Node" to **"Docker"**
   - **Dockerfile Path**: `download-server-example/Dockerfile`
   - Keep other settings the same

### Option 2: Use Render Blueprint (render.yaml)

The `render.yaml` file I created should work, but Render's free tier may have limitations.

### Option 3: Upgrade to Render Starter ($7/month)

Render Starter plan has better support for system dependencies.

### Option 4: Use Alternative Service

Consider:
- **Railway.app** (has Python/FFmpeg by default)
- **Fly.io** (good Docker support)
- **Oracle Cloud Free Tier** (always-on VM)

## Quick Test

To verify if Python/FFmpeg are available on your Render instance:

1. Go to Render Dashboard → Your Service → **Shell** tab
2. Run:
   ```bash
   python3 --version
   ffmpeg -version
   ```

If these commands fail, you need to use Docker (Option 1).

## Current Status

The code now:
- ✅ Downloads yt-dlp binary automatically
- ✅ Makes it executable
- ✅ Tests the binary on startup
- ✅ Provides better error messages

But Render's free tier Node.js environment may not have Python/FFmpeg.

