# How to Find Docker Setting in Render Dashboard

## Method 1: Through Service Settings

1. **Go to**: https://dashboard.render.com
2. **Click on "m10dj"** service (from the main dashboard list, or click it in the left sidebar)
3. **Look at the TOP of the page** - you should see tabs like:
   - **Logs** | **Metrics** | **Settings** | **Events**
4. **Click "Settings"** tab
5. **Scroll down** to find one of these sections:
   - **"Build & Deploy"**
   - **"Configuration"** 
   - **"Runtime"**
6. **Look for a dropdown** that says:
   - **"Environment"** or **"Runtime"**
   - Currently shows: **"Node"**
7. **Change it to: "Docker"**
8. **Find "Dockerfile Path"** field below it
9. **Enter**: `download-server-example/Dockerfile`
10. **Click "Save Changes"**

## Method 2: If Settings Tab Doesn't Exist

Some Render interfaces are different. Try:

1. **Click the service name "m10dj"** in the top breadcrumb
2. **Look for a "..." menu** (three dots) in the top right
3. **Click it** → Look for "Settings" or "Configure"
4. **Or look for a gear icon** ⚙️

## Method 3: Check the URL

The URL should be:
- ✅ Correct: `dashboard.render.com/web/srv-XXXXX` (main service page)
- ❌ Wrong: `dashboard.render.com/web/srv-XXXXX/env` (environment variables page)

If you're on `/env`, click the service name to go back to the main page.

## Method 4: Create New Service with Docker (Easier!)

If you can't find the setting, **create a new service** with Docker from the start:

1. **Go to**: https://dashboard.render.com
2. **Click "New +"** → **"Web Service"**
3. **Connect repository**: `newworldstrategiesai/m10dj`
4. **Configure**:
   - **Name**: `m10dj-docker` (or any name)
   - **Root Directory**: `download-server-example`
   - **Environment**: Select **"Docker"** (not Node!)
   - **Dockerfile Path**: `download-server-example/Dockerfile`
   - **Start Command**: Leave empty (Dockerfile handles this)
5. **Add Environment Variables** (copy from old service):
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_ROLE_KEY`
   - `DOWNLOAD_SERVER_API_KEY`
   - `PORT` (optional, defaults to 10000)
6. **Click "Create Web Service"**
7. **Update Vercel** with new URL (if different)

## Method 5: Use Render Blueprint

1. **Go to**: https://dashboard.render.com
2. **Click "New +"** → **"Blueprint"**
3. **Connect repository**: `newworldstrategiesai/m10dj`
4. **Render will read `render.yaml`** and create services automatically
5. **This should create a Docker service**

## What to Look For

The setting you need is usually labeled as:
- **"Environment"** (dropdown)
- **"Runtime"** (dropdown)
- **"Build Environment"** (dropdown)

It's NOT:
- ❌ "Environment Variables" (that's for env vars)
- ❌ "Environment Groups" (that's for grouping)

## Screenshot Checklist

When you're on the right page, you should see:
- ✅ Service name "m10dj" at the top
- ✅ Tabs: Logs | Metrics | Settings | Events
- ✅ "Build & Deploy" or "Configuration" section
- ✅ Dropdown showing "Node" that you can change

## Still Can't Find It?

Take a screenshot of:
1. The main service page (after clicking "m10dj")
2. The Settings tab (if you can find it)
3. Or describe what you see at the top of the page

I can help guide you based on what you're seeing!

