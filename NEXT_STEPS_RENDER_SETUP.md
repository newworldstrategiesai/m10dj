# Next Steps: Complete Render + Vercel Integration

## ✅ Completed
- [x] Render server deployed and live at `https://m10dj.onrender.com`
- [x] Health check working: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`
- [x] Code pushed to GitHub

---

## 🔧 Step 1: Add Environment Variables to Vercel

### Go to Vercel Dashboard:
1. Visit: https://vercel.com/dashboard
2. Select your **m10dj** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"** for each variable below

### Variable 1: DOWNLOAD_SERVER_URL
- **Key**: `DOWNLOAD_SERVER_URL`
- **Value**: `https://m10dj.onrender.com`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

### Variable 2: DOWNLOAD_SERVER_API_KEY
- **Key**: `DOWNLOAD_SERVER_API_KEY`
- **Value**: `63e12a3429b1b879dc7e51139048eaeaea34d8873608f3311bee0672b1c2b5c2`
- **Environments**: ✅ Production, ✅ Preview, ✅ Development

---

## 🔄 Step 2: Redeploy Vercel

After adding the environment variables:

1. Go to **Deployments** tab in Vercel
2. Find your latest deployment
3. Click **"..."** (three dots) → **"Redeploy"**
4. Wait for deployment to complete

**Why?** Environment variables are only available to new deployments.

---

## ✅ Step 3: Verify Render Server Environment Variables

Make sure Render has these variables set:

1. Go to: https://dashboard.render.com
2. Select your **m10dj** service
3. Go to **Environment** tab
4. Verify these are set:
   - `PORT` = `10000` (or auto-assigned)
   - `NODE_ENV` = `production`
   - `SUPABASE_URL` = `https://bwayphqnxgcyjpoaautn.supabase.co`
   - `SUPABASE_SERVICE_ROLE_KEY` = (your actual service role key)
   - `DOWNLOAD_SERVER_API_KEY` = `63e12a3429b1b879dc7e51139048eaeaea34d8873608f3311bee0672b1c2b5c2`

**Note**: If `SUPABASE_SERVICE_ROLE_KEY` is missing, copy it from Vercel's environment variables.

---

## 🧪 Step 4: Test the Integration

### Test 1: Render Server Health
```bash
curl https://m10dj.onrender.com/health
```
**Expected**: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`

### Test 2: End-to-End Download (In Production)
1. Go to your production admin panel: `/admin/crowd-requests`
2. Find a song request with a YouTube link
3. Click **"Request Details"**
4. In the modal, look for **"Download Audio (Super Admin)"** section
5. Click **"Download Audio as MP3"**
6. Wait for the download to complete (may take 30-60 seconds)
7. Check that the status updates to "completed"
8. Verify the audio file URL is saved

---

## 🐛 Troubleshooting

### Issue: "Failed to connect to download server"
- **Check**: Vercel environment variables are set correctly
- **Check**: Vercel deployment was redeployed after adding variables
- **Check**: Render server is running (check Render dashboard)

### Issue: "Unauthorized - Invalid API key"
- **Check**: `DOWNLOAD_SERVER_API_KEY` matches in both Vercel and Render
- **Check**: The API key in the request header matches Render's expected key

### Issue: Download fails with "yt-dlp not found"
- **Check**: Render server logs for Python/FFmpeg installation
- **Note**: Render Free Tier may have limitations - check logs

### Issue: "Missing Supabase configuration"
- **Check**: Render has `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` set
- **Fix**: Copy these from Vercel's environment variables

---

## 📊 Monitoring

### Render Logs
- View real-time logs: Render Dashboard → Your Service → **Logs** tab
- Look for:
  - `🚀 YouTube Download Server running on port...`
  - Download request logs: `[timestamp] Download request: {...}`
  - Success: `[timestamp] Download successful: {...}`

### Vercel Logs
- View function logs: Vercel Dashboard → Your Project → **Functions** tab
- Look for:
  - `Using dedicated download server: https://m10dj.onrender.com`
  - Any error messages from the download API

---

## 🎉 Success Indicators

You'll know everything is working when:

1. ✅ Render server health check returns OK
2. ✅ Vercel environment variables are set
3. ✅ Vercel deployment completed successfully
4. ✅ Admin can click "Download Audio as MP3"
5. ✅ Status changes from "pending" → "processing" → "completed"
6. ✅ `downloaded_audio_url` is populated in the database
7. ✅ Audio file is accessible via the URL

---

## 📝 Next Steps After Testing

Once everything works:

1. **Monitor usage**: Check Render logs for any errors
2. **Test with different YouTube videos**: Ensure various formats work
3. **Check storage**: Monitor Supabase Storage usage for audio files
4. **Performance**: Note download times (typically 30-60 seconds)

---

## 🔐 Security Notes

- The API key (`DOWNLOAD_SERVER_API_KEY`) should be kept secret
- Only super admins can trigger downloads (enforced in Vercel API)
- Render server validates API key on each request
- Audio files are stored in Supabase Storage (private bucket)

---

## 💰 Cost Considerations

### Render Free Tier:
- ✅ 750 hours/month free
- ⚠️ Spins down after 15 minutes of inactivity
- ⚠️ First request after spin-down may be slow (~30 seconds)

### If you exceed free tier:
- Consider upgrading to Render Starter ($7/month)
- Or migrate to Oracle Cloud Free Tier (always-on)

---

## 🆘 Need Help?

If something isn't working:

1. Check Render logs first (most issues show there)
2. Check Vercel function logs
3. Verify all environment variables are set
4. Test Render health endpoint directly
5. Check Supabase Storage bucket permissions

