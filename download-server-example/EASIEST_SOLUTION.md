# Easiest Solution: Create New Docker Service

Since finding the Docker setting is difficult, let's just **create a new service** with Docker from scratch. This is actually easier!

## Step-by-Step (5 minutes)

### Step 1: Create New Service
1. Go to: https://dashboard.render.com
2. Click **"New +"** button (top right)
3. Select **"Web Service"**

### Step 2: Connect Repository
1. If prompted, connect GitHub
2. Select repository: **`newworldstrategiesai/m10dj`**
3. Click **"Connect"**

### Step 3: Configure Service
Fill in these fields:

- **Name**: `m10dj-docker` (or keep `m10dj` if you'll delete the old one)
- **Region**: Choose closest to you
- **Branch**: `main`
- **Root Directory**: `download-server-example` ⚠️ **IMPORTANT**
- **Environment**: **Select "Docker"** ⚠️ **CRITICAL - Don't pick Node!**
- **Dockerfile Path**: `download-server-example/Dockerfile`
- **Plan**: **Free**

### Step 4: Add Environment Variables
Click **"Add Environment Variable"** and add:

1. **SUPABASE_URL**
   - Value: `https://bwayphqnxgcyjpoaautn.supabase.co`

2. **SUPABASE_SERVICE_ROLE_KEY**
   - Value: (copy from your old service or Vercel)

3. **DOWNLOAD_SERVER_API_KEY**
   - Value: `63e12a3429b1b879dc7e51139048eaeaea34d8873608f3311bee0672b1c2b5c2`

4. **PORT** (optional)
   - Value: `10000`

### Step 5: Create Service
1. Click **"Create Web Service"**
2. Wait 3-5 minutes for build
3. Note the new URL (might be `m10dj-docker.onrender.com`)

### Step 6: Update Vercel (if URL changed)
If the new service has a different URL:

1. Go to Vercel Dashboard
2. Settings → Environment Variables
3. Update `DOWNLOAD_SERVER_URL` to the new URL

### Step 7: Delete Old Service (Optional)
Once the new one works:

1. Go to old service settings
2. Scroll to bottom
3. Click "Delete Service"

## Why This Is Easier

- ✅ No hunting for hidden settings
- ✅ Docker configured from the start
- ✅ Clean setup
- ✅ Can test before deleting old service

## Verification

After deployment, check logs. You should see:
- ✅ Docker build steps
- ✅ `Installing Python, FFmpeg...`
- ✅ `✅ yt-dlp binary ready`

Not:
- ❌ `==> Running 'npm run start'` (that's Node)

