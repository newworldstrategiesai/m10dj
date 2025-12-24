# Render.com Setup Guide - YouTube Download Server

## Step 1: Sign In to Render
1. Go to https://dashboard.render.com
2. Click "GitHub" button to sign in
3. Authorize Render to access your GitHub account
4. You should see the Render dashboard

## Step 2: Create New Web Service
1. Click the **"New +"** button (top right)
2. Select **"Web Service"**
3. You'll be prompted to connect a repository

## Step 3: Connect GitHub Repository
1. If not already connected, click "Connect account" next to GitHub
2. Authorize Render to access your repositories
3. Select your repository: **`newworldstrategiesai/m10dj`**
4. Click "Connect"

## Step 4: Configure the Service
Once the repo is connected, you'll see configuration options:

### Basic Settings:
- **Name**: `youtube-download-server` (or any name you prefer)
- **Region**: Choose closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `download-server-example` ⚠️ **IMPORTANT**

### Build & Deploy:
- **Environment**: `Node`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Plan:
- Select **"Free"** plan

## Step 5: Add Environment Variables
Click "Add Environment Variable" and add these:

1. **PORT** = `10000` (Render sets this automatically, but we'll set a default)
2. **SUPABASE_URL** = `your-supabase-url` (from your Vercel env vars)
3. **SUPABASE_SERVICE_ROLE_KEY** = `your-service-role-key` (from your Vercel env vars)
4. **DOWNLOAD_SERVER_API_KEY** = `generate-a-random-32-char-key-here` (use a password generator)

**To generate API key:**
```bash
# Run this in terminal:
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## Step 6: Deploy
1. Click **"Create Web Service"**
2. Render will start building and deploying
3. Wait for deployment to complete (~2-3 minutes)

## Step 7: Get Your Server URL
Once deployed, you'll see:
- **Service URL**: `https://youtube-download-server.onrender.com` (or similar)
- Copy this URL

## Step 8: Update Vercel Environment Variables
Go to your Vercel dashboard and add:

1. **DOWNLOAD_SERVER_URL** = `https://youtube-download-server.onrender.com` (your Render URL)
2. **DOWNLOAD_SERVER_API_KEY** = `same-key-you-used-in-render`

## Step 9: Test
1. Go to your admin panel
2. Try downloading a YouTube audio
3. It should now work!

## Important Notes

### Render Free Tier Limitations:
- ⚠️ **Spins down after 15 minutes of inactivity**
- ⚠️ **First request after spin-down takes ~30 seconds** (cold start)
- ✅ **750 hours/month free** (more than enough)
- ✅ **Auto-deploys on git push**

### If You Need Always-On:
Consider upgrading to Render's **Starter plan ($7/month)** for always-on service, or use **Oracle Cloud Free Tier** (truly free, always-on).

## Troubleshooting

### Build Fails:
- Check that `Root Directory` is set to `download-server-example`
- Verify `package.json` exists in that directory
- Check build logs in Render dashboard

### Server Crashes:
- Check logs in Render dashboard
- Verify all environment variables are set
- Make sure Python and FFmpeg are available (Render should have them)

### Downloads Fail:
- Check Render logs for errors
- Verify Supabase credentials are correct
- Check that API key matches in both Vercel and Render

## Next Steps After Setup

Once everything is working:
1. Test a few downloads
2. Monitor Render logs for any issues
3. Consider setting up a custom domain (optional)
4. Set up monitoring/alerting (optional)

