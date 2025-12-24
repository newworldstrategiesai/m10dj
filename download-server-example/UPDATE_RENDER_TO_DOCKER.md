# Update Render Service to Use Docker

## ⚠️ Important Note

The Render CLI **does not support** updating the runtime environment of an existing service. You need to use the Render Dashboard.

## Quick Steps (2 minutes)

### Option 1: Update Existing Service (Recommended)

1. **Go to Render Dashboard**: https://dashboard.render.com
2. **Click on your service**: `m10dj` (or whatever you named it)
3. **Go to Settings tab**
4. **Scroll to "Environment" section**
5. **Change Environment**:
   - Current: `Node`
   - Change to: `Docker`
6. **Set Dockerfile Path**:
   - `download-server-example/Dockerfile`
7. **Click "Save Changes"**
8. **Render will automatically redeploy** (takes 3-5 minutes)

### Option 2: Use Render Blueprint (render.yaml)

If you want to use the `render.yaml` file:

1. **Go to Render Dashboard**
2. **Click "New +" → "Blueprint"**
3. **Connect your GitHub repo**
4. **Select the `render.yaml` file**
5. **Render will create/update services automatically**

**Note**: This might create a duplicate service, so Option 1 is safer.

## Verify the Change

After deployment completes:

1. **Check logs** in Render Dashboard → Logs tab
2. **Look for**: `✅ yt-dlp binary ready` or `✅ yt-dlp initialized successfully`
3. **Test health endpoint**:
   ```bash
   curl https://m10dj.onrender.com/health
   ```
4. **Try a download** from your local app

## What Happens

- **Before**: Node.js environment → No Python/FFmpeg → ENOENT error
- **After**: Docker with Python/FFmpeg → yt-dlp works ✅

## Troubleshooting

If you see errors in logs:

1. **Check Dockerfile path** is correct: `download-server-example/Dockerfile`
2. **Check Root Directory** is still: `download-server-example`
3. **Check environment variables** are still set correctly
4. **View build logs** to see if Docker build succeeded

## Alternative: Render CLI (Limited)

The Render CLI can:
- ✅ View logs: `render logs [SERVICE_ID]`
- ✅ Restart service: `render restart [SERVICE_ID]`
- ✅ Trigger deploys: `render deploys create [SERVICE_ID]`
- ❌ **Cannot** change runtime environment (Node → Docker)

For changing runtime, you **must use the Dashboard**.

