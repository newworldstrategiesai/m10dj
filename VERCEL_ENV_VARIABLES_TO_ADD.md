# Vercel Environment Variables to Add

## Add these to Vercel Dashboard:

1. Go to: https://vercel.com/dashboard
2. Select your **m10dj** project
3. Go to **Settings** → **Environment Variables**
4. Click **"Add New"** for each variable below

---

## CRITICAL: Variables Required for Karaoke Auto-Linking

### SUPABASE_SERVICE_ROLE_KEY

**Key**: `SUPABASE_SERVICE_ROLE_KEY`

**Value**: (Get from Supabase Dashboard → Settings → API → service_role key)

**Environment**: 
- ✅ Production
- ✅ Preview  
- ✅ Development

**Why**: Required for auto-linking karaoke videos during public signups (bypasses RLS)

---

### YOUTUBE_API_KEY

**Key**: `YOUTUBE_API_KEY`

**Value**: (Your YouTube Data API v3 key)

**Environment**: 
- ✅ Production
- ✅ Preview  
- ✅ Development

**Why**: Required for searching YouTube for karaoke videos during auto-linking

---

## LiveKit (Voice / Dialer / Ben agent)

Add these for the Dialer, outbound calls, and Ben voice agent. Use the same values in **.env.local** (local) and **Vercel** → Settings → Environment Variables.

| Variable | Where to get it | Required? |
|----------|-----------------|-----------|
| **LIVEKIT_URL** | [LiveKit Cloud](https://cloud.livekit.io) → your project → **Settings** (or **Project Settings**) → **Keys** → **WebSocket URL** (e.g. `wss://your-project.livekit.cloud`) | Yes (Dialer, tokens, webhook) |
| **LIVEKIT_API_KEY** | Same page → **API Key** | Yes |
| **LIVEKIT_API_SECRET** | Same page → **API Secret** | Yes |
| **LIVEKIT_SIP_OUTBOUND_TRUNK_ID** | LiveKit Cloud → **SIP** / **Telephony** → **Outbound trunk** → copy the trunk ID. Or CLI: `lk sip outbound list` | Yes for real outbound phone calls |
| **M10DJ_TWILIO_PHONE_NUMBER** | Your Twilio number in E.164 (e.g. `+19015551234`) for outbound caller ID | Optional |
| **LIVEKIT_AGENT_CONFIG_TOKEN** | You generate this: any long random string (e.g. `openssl rand -hex 32`). Set the **same** value in Vercel and in the Python agent env so the agent can call `GET /api/livekit/agent-config` | Optional (only if Ben agent loads config from your app) |

**Environment**: ✅ Production, ✅ Preview, ✅ Development (for LiveKit vars)

---

## Variable 1: DOWNLOAD_SERVER_URL

**Key**: `DOWNLOAD_SERVER_URL`

**Value**: `https://m10dja.onrender.com`

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

