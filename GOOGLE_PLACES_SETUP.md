# Google Places API Setup Guide

The service selection page now uses **Google Places API** to automatically fetch venue addresses based on venue names. This provides a much better user experience with autocomplete suggestions.

---

## 📋 What You Need

1. **Google Cloud Platform Account** (free tier available)
2. **Places API Enabled**
3. **API Key**

---

## 🚀 Setup Instructions

### Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click **"Select a project"** → **"New Project"**
3. Name it: `m10dj-places-api` (or your preferred name)
4. Click **"Create"**

### Step 2: Enable the Places API

1. In your project, go to **"APIs & Services"** → **"Library"**
2. Search for **"Places API"**
3. Click on **"Places API"**
4. Click **"Enable"**

### Step 3: Create API Key

1. Go to **"APIs & Services"** → **"Credentials"**
2. Click **"+ CREATE CREDENTIALS"** → **"API key"**
3. Copy the generated API key
4. **IMPORTANT**: Click **"Restrict Key"** (security best practice)

### Step 4: Restrict Your API Key (Recommended)

#### Application Restrictions:
- **For Production**: Select **"HTTP referrers"**
  - Add: `https://yourdomain.com/*`
  - Add: `https://www.yourdomain.com/*`
  
- **For Development**: Select **"IP addresses"**
  - Add your server IP
  - Or temporarily use **"None"** (less secure)

#### API Restrictions:
- Select **"Restrict key"**
- Choose **"Places API"** from the list
- Click **"Save"**

### Step 5: Add to Environment Variables

Add to your `.env.local` file:

```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Example:**
```bash
GOOGLE_PLACES_API_KEY=AIzaSyBXXXXXXXXXXXXXXXXXXXXXXXXXXX
```

### Step 6: Restart Your Server

```bash
# Stop your dev server (Ctrl+C)
# Then restart:
npm run dev
```

---

## 💰 Pricing

Google Places API is **free for the first $200/month** of usage, which covers:

- **Text Search**: $32 per 1,000 requests
- **Free Tier**: ~6,250 searches per month
- **Your Usage**: With typical lead volume, you'll likely stay within free tier

**Monitor usage:**
1. Go to Google Cloud Console
2. Navigate to **"Billing"** → **"Reports"**
3. Filter by **"Places API"**

---

## ✅ How It Works

### For Your Leads:

1. Lead starts typing a venue name (e.g., "Peabody")
2. Google suggests venues with addresses
3. Lead selects from the dropdown
4. **Address auto-fills automatically!** ✨
5. Lead can still edit if needed

### What It Searches:

- **Location bias**: Memphis, TN area
- **Type**: Establishments (venues, restaurants, hotels)
- **Results**: Top 5 matches
- **Includes**: Venue name, full address, ratings

### Fallback:

If API key is not configured:
- Manual entry still works
- No autocomplete (graceful degradation)
- No errors shown to users

---

## 🔍 Testing

### Test the Autocomplete:

1. Visit: `http://localhost:3000/select-services/demo`
2. Type in the **Venue Name** field: `Peabody`
3. You should see dropdown suggestions
4. Select one → address auto-fills!

### Test Without API Key:

1. Remove `GOOGLE_PLACES_API_KEY` from `.env.local`
2. Restart server
3. Visit demo page
4. Venue fields work as regular text inputs (fallback mode)

---

## 🐛 Troubleshooting

### "No venues found" message:
- ✅ Check API key is correct
- ✅ Verify Places API is enabled
- ✅ Check API key restrictions aren't blocking requests
- ✅ Ensure you've restarted the server after adding the key

### API key restrictions error:
- Update **Application restrictions** to include your domain
- For development, temporarily use **"None"** or add `localhost`

### Billing alerts:
- Set up budget alerts in Google Cloud Console
- Recommended: Alert at $50, $100, $150

### Rate limiting:
- Default: 1,000 requests per minute
- More than enough for your use case
- Can be increased if needed

---

## 🔐 Security Notes

### DO:
- ✅ Keep API key in `.env.local` (never commit to git)
- ✅ Use API restrictions (IP or HTTP referrers)
- ✅ Monitor usage regularly
- ✅ Set up billing alerts

### DON'T:
- ❌ Expose API key in client-side code
- ❌ Commit `.env.local` to git
- ❌ Share your API key publicly
- ❌ Use the same key for multiple projects

---

## 📊 Monitoring Usage

Check your API usage:

```bash
# Google Cloud Console → APIs & Services → Dashboard
# View:
# - Requests per day
# - Errors
# - Latency
```

**Typical Usage:**
- ~5-10 searches per lead
- ~100 leads/month = ~500-1,000 API calls
- **Well within free tier!**

---

## 🔄 Alternative: Use Without API Key

The system works fine without Google Places API:

**Benefits:**
- No setup required
- No API costs
- Simple text inputs

**Drawbacks:**
- No autocomplete
- Manual address entry
- More room for typos

**To disable**: Simply don't add the `GOOGLE_PLACES_API_KEY` environment variable.

---

## 📞 Need Help?

If you encounter issues:

1. Check the browser console for errors
2. Check server logs: `npm run dev`
3. Verify API key in `.env.local`
4. Test API key in [Google API Explorer](https://developers.google.com/apis-explorer)

---

## 🎯 Summary

**Setup Time**: 10 minutes  
**Cost**: Free (within limits)  
**Benefit**: Much better UX for leads  
**Fallback**: Works without API too  

**Recommended**: Set it up! Your leads will appreciate the smooth experience. 🎉

