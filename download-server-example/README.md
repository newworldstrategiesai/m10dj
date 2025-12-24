# YouTube Download Server for Render.com

This is a dedicated server for downloading YouTube audio files. It runs on Render.com's free tier.

## Quick Setup on Render

1. **Sign in to Render** at https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository: `newworldstrategiesai/m10dj`
4. Set **Root Directory** to: `download-server-example`
5. **Build Command**: `npm install`
6. **Start Command**: `node server.js`
7. **Plan**: Free

## Environment Variables

Add these in Render dashboard:

```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DOWNLOAD_SERVER_API_KEY=generate-random-32-char-key
PORT=10000
```

## Generate API Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## After Deployment

1. Copy your Render service URL (e.g., `https://youtube-download-server.onrender.com`)
2. Add to Vercel environment variables:
   - `DOWNLOAD_SERVER_URL` = your Render URL
   - `DOWNLOAD_SERVER_API_KEY` = same key as above

## Testing

Test the server:
```bash
curl https://your-server.onrender.com/health
```

Should return: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`

## Notes

- Render free tier spins down after 15 min inactivity
- First request after spin-down takes ~30 seconds (cold start)
- Python and FFmpeg should be available in Render's environment
- If downloads fail, check Render logs for errors
