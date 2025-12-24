# Manual Render.com Setup - Step by Step

## Step 1: Sign In to Render
1. Go to https://dashboard.render.com
2. Click the **"GitHub"** button to sign in with your GitHub account
3. Authorize Render to access your repositories
4. You'll be redirected to the Render dashboard

## Step 2: Create New Web Service
1. Click the **"New +"** button in the top right corner
2. Select **"Web Service"** from the dropdown

## Step 3: Connect Your Repository
1. If you see "Connect a repository", click it
2. Select **GitHub** as your Git provider
3. If prompted, authorize Render to access your GitHub account
4. Find and select your repository: **`newworldstrategiesai/m10dj`**
5. Click **"Connect"**

## Step 4: Configure the Service

Fill in these settings:

### Basic Settings:
- **Name**: `youtube-download-server` (or any name you prefer)
- **Region**: Choose the closest to you (e.g., `Oregon (US West)`)
- **Branch**: `main`
- **Root Directory**: `download-server-example` ⚠️ **IMPORTANT - This must be set!**

### Build & Start:
- **Environment**: Select **"Node"**
- **Build Command**: `npm install`
- **Start Command**: `node server.js`

### Plan:
- Select **"Free"** plan

## Step 5: Add Environment Variables

Click **"Add Environment Variable"** and add these one by one:

1. **PORT**
   - Value: `10000`
   - (Render sets this automatically, but we'll set a default)

2. **SUPABASE_URL**
   - Value: Your Supabase URL (same as in Vercel)
   - Example: `https://bwayphqnxgcyjpoaautn.supabase.co`

3. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: Your Supabase service role key (same as in Vercel)
   - This is a long string starting with `eyJ...`

4. **DOWNLOAD_SERVER_API_KEY**
   - Value: Generate a random 32-character key
   - **To generate**: Run this in your terminal:
     ```bash
     node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
     ```
   - Copy the output and use it as the value
   - **Save this key** - you'll need it for Vercel too!

5. **NODE_ENV** (optional)
   - Value: `production`

## Step 6: Deploy

1. Scroll down and click **"Create Web Service"**
2. Render will start building and deploying
3. Wait 2-3 minutes for the build to complete
4. You'll see build logs in real-time

## Step 7: Get Your Server URL

Once deployment is complete:
1. You'll see a **"Your service is live"** message
2. Copy the URL shown (e.g., `https://youtube-download-server.onrender.com`)
3. This is your **DOWNLOAD_SERVER_URL**

## Step 8: Update Vercel Environment Variables

1. Go to your Vercel dashboard: https://vercel.com/dashboard
2. Select your project: **m10dj**
3. Go to **Settings** → **Environment Variables**
4. Add these two new variables:

   **DOWNLOAD_SERVER_URL**
   - Value: Your Render service URL (from Step 7)
   - Example: `https://youtube-download-server.onrender.com`
   - Environment: Production, Preview, Development (check all)

   **DOWNLOAD_SERVER_API_KEY**
   - Value: The same API key you generated in Step 5
   - Environment: Production, Preview, Development (check all)

5. Click **"Save"** for each variable

## Step 9: Redeploy Vercel (if needed)

If your Vercel app is already deployed:
1. Go to **Deployments** tab
2. Click the **"..."** menu on the latest deployment
3. Click **"Redeploy"**
4. Or just push a small change to trigger a new deployment

## Step 10: Test

1. Go to your admin panel
2. Navigate to Crowd Requests
3. Open a song request that has a YouTube link
4. Click **"Download Audio as MP3"**
5. It should now work! 🎉

## Troubleshooting

### Build Fails
- **Check**: Root Directory is set to `download-server-example`
- **Check**: Build command is `npm install`
- **Check**: Start command is `node server.js`
- **View logs**: Click on the failed deployment to see error messages

### Server Crashes
- **Check logs**: Click on your service → "Logs" tab
- **Verify**: All environment variables are set correctly
- **Common issue**: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY

### Downloads Fail
- **Check Render logs**: Look for error messages
- **Verify**: API key matches in both Vercel and Render
- **Verify**: Supabase credentials are correct
- **Note**: Render free tier has cold starts (~30 seconds after 15 min inactivity)

### Service Spins Down
- **Free tier limitation**: Service sleeps after 15 minutes of inactivity
- **First request**: Takes ~30 seconds to wake up (this is normal)
- **Solution**: Consider upgrading to Starter plan ($7/month) for always-on, or use Oracle Cloud (free, always-on)

## Important Notes

- **Free Tier**: 750 hours/month (plenty for your use case)
- **Cold Starts**: First request after inactivity takes ~30 seconds
- **Auto-Deploy**: Service auto-deploys when you push to `main` branch
- **Logs**: Always check Render logs if something isn't working

## Next Steps After Setup

1. Test a few downloads to make sure everything works
2. Monitor Render logs for any errors
3. Consider setting up a custom domain (optional)
4. If you need always-on service, consider Oracle Cloud Free Tier

