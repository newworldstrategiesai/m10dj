# How to Change Render Service from Node to Docker

## Step-by-Step Instructions

### Step 1: Go to Service Settings (Not Environment Variables)

1. **In the left sidebar**, look for the service name "m10dj" at the top
2. **Click on "m10dj"** (the service name itself, not "Environment")
3. This should take you to the **main service page** or **Settings**

### Step 2: Find the Settings Tab

Look for one of these:
- A **"Settings"** tab at the top of the page
- A **gear icon** ⚙️ or **"Configure"** button
- Scroll down to find **"Build & Deploy"** or **"Runtime"** section

### Step 3: Change Runtime to Docker

Once in Settings, look for:

1. **"Environment"** or **"Runtime"** dropdown
   - Current: `Node`
   - Change to: `Docker`

2. **"Dockerfile Path"** or **"Dockerfile"** field
   - Set to: `download-server-example/Dockerfile`

3. **"Root Directory"** (should already be set)
   - Should be: `download-server-example`

### Alternative: If You Can't Find Settings

If you don't see a Settings option:

1. **Go to the main Render Dashboard**: https://dashboard.render.com
2. **Click on your service** "m10dj" from the services list
3. **Look for tabs** at the top: "Logs", "Metrics", "Settings", etc.
4. **Click "Settings"** tab
5. **Scroll to "Build & Deploy"** section
6. **Change "Environment"** from `Node` to `Docker`
7. **Set "Dockerfile Path"** to `download-server-example/Dockerfile`

## What You're Looking For

The setting you need is typically labeled as:
- **"Environment"** (dropdown: Node/Docker/Python/etc.)
- **"Runtime"** 
- **"Build Environment"**

It's usually in the **"Build & Deploy"** or **"Configuration"** section of Settings.

## If Still Can't Find It

1. **Check the top navigation** - there might be a "Settings" link
2. **Look for a "..." menu** (three dots) on the service page
3. **Try clicking "Manual Deploy"** - sometimes settings are nearby
4. **Check if you need to upgrade** - some settings might be locked on free tier (but Docker should work on free tier)

## After Making the Change

1. **Click "Save Changes"** or **"Update Service"**
2. **Render will automatically trigger a new deployment**
3. **Wait 3-5 minutes** for the build to complete
4. **Check the "Logs" tab** to see the build progress

## Quick Test

After deployment, test:
```bash
curl https://m10dj.onrender.com/health
```

You should see: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`

