# Vercel Environment Variables to Add

## Add these to Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your **m10dj** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"** for each variable below

---

## Variable 1: DOWNLOAD_SERVER_URL

**Key**: `DOWNLOAD_SERVER_URL`

**Value**: `https://m10dj.onrender.com`

**Environment**: 
- ✅ Production
- ✅ Preview  
- ✅ Development

---

## Variable 2: DOWNLOAD_SERVER_API_KEY

**Key**: `DOWNLOAD_SERVER_API_KEY`

**Value**: `63e12a3429b1b879dc7e51139048eaeaea34d8873608f3311bee0672b1c2b5c2`

**Environment**: 
- ✅ Production
- ✅ Preview
- ✅ Development

---

## After Adding Variables:

1. **Redeploy** your Vercel app:
   - Go to **Deployments** tab
   - Click **"..."** on latest deployment
   - Click **"Redeploy"**

2. **Test** the download feature:
   - Go to admin panel → Crowd Requests
   - Open a song request with YouTube link
   - Click "Download Audio as MP3"
   - Should now work! 🎉

---

## Quick Test:

Test your Render server directly:
```bash
curl https://m10dj.onrender.com/health
```

Should return: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`

