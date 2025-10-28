# 🏢 Venue Autocomplete - Quick Start

Your service selection page now has **Google-powered venue autocomplete**! Leads can search for venues and get addresses automatically filled.

---

## ✨ What Your Leads See

### Before (Manual Entry):
❌ Type venue name → Type full address separately  
❌ Risk of typos in address  
❌ Time consuming  

### After (With Autocomplete):
✅ Start typing "Peabody"  
✅ See dropdown with "The Peabody Memphis"  
✅ Click it → **Address auto-fills instantly!** 🎉  
✅ Can still edit if needed  

---

## 🧪 Test It Right Now

### Option 1: Demo Page (No Setup)
```bash
http://localhost:3000/select-services/demo
```

**Try typing:**
- "Peabody" → The Peabody Memphis
- "Dixon" → Dixon Gallery and Gardens
- "Memphis" → Various Memphis venues
- "Graceland" → Graceland

### Option 2: With API Key (Full Experience)

**Step 1:** Get Google Places API Key
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Create project → Enable Places API → Get API key
- **See `GOOGLE_PLACES_SETUP.md` for detailed steps**

**Step 2:** Add to `.env.local`
```bash
GOOGLE_PLACES_API_KEY=your_api_key_here
```

**Step 3:** Restart server
```bash
# Stop server (Ctrl+C)
npm run dev
```

**Step 4:** Test autocomplete
```bash
http://localhost:3000/select-services/demo
```

---

## 🎯 Features

### Smart Search
- **Location bias**: Memphis, TN area
- **Top 5 results** shown in dropdown
- **Real-time search** as you type (500ms debounce)
- **Venue info**: Name, full address, ratings

### Visual Feedback
- 🔍 **Search icon** when idle
- ⏳ **Loading spinner** while searching
- ✅ **Green checkmark** when auto-filled
- 📍 **Map pin icons** for each result

### User-Friendly
- **Click outside** to close dropdown
- **Still editable** after auto-fill
- **Manual entry** works if preferred
- **Graceful fallback** if API not configured

---

## 🔄 How It Works

```
User types "Pea..." 
    ↓
[500ms delay - debounced]
    ↓
API call to /api/google/venue-lookup
    ↓
Google Places API Text Search
    ↓
Filter & format top 5 results
    ↓
Display dropdown with venues
    ↓
User clicks venue
    ↓
✨ Name + Address auto-filled! ✨
```

---

## 💰 Costs

**Free Tier**: $200/month credit
**Usage**: ~$32 per 1,000 searches
**Your Reality**: 
- ~5-10 searches per lead
- ~100 leads/month
- = ~500-1,000 API calls
- = **~$16-32/month**
- = **100% covered by free tier!** 🎉

---

## 🔐 Without API Key

**Don't want to set up Google API?** No problem!

**Still works as:**
- Regular text input for venue name
- Regular text input for address
- No autocomplete dropdown
- No additional features

**To use without API:**
- Simply don't add `GOOGLE_PLACES_API_KEY` to `.env.local`
- Everything else works normally

---

## 🐛 Troubleshooting

### "No venues found"
- ✅ Check API key is added to `.env.local`
- ✅ Restart server after adding key
- ✅ Check Places API is enabled in Google Cloud
- ✅ Try searching for well-known venues first

### Dropdown not appearing
- ✅ Type at least 3 characters
- ✅ Wait 500ms (debounce delay)
- ✅ Check browser console for errors
- ✅ Verify API key is valid

### "API not configured" message
- ✅ Add `GOOGLE_PLACES_API_KEY` to `.env.local`
- ✅ Restart development server
- ✅ Check for typos in environment variable name

---

## 📱 Mobile Support

Works perfectly on mobile:
- ✅ Touch-friendly dropdowns
- ✅ Responsive layout
- ✅ Keyboard-friendly
- ✅ Smooth scrolling

---

## 🎨 Dark Mode

Fully optimized for both themes:
- ✅ Light mode styling
- ✅ Dark mode styling
- ✅ Smooth transitions
- ✅ Accessible contrast

---

## 🚀 Next Steps

1. **Test the demo page** (works without API key)
2. **Set up Google Places API** (see `GOOGLE_PLACES_SETUP.md`)
3. **Send test link** to a real contact
4. **Monitor API usage** in Google Cloud Console

---

## 📊 What Gets Saved

When a lead selects a venue:
```json
{
  "venue_name": "The Peabody Memphis",
  "venue_address": "149 Union Ave, Memphis, TN 38103"
}
```

Stored in `service_selections` table and `contacts` table.

---

## 🎯 Summary

**Setup Time**: 10 minutes (with API) or 0 minutes (without)  
**Cost**: Free (within limits)  
**UX Improvement**: ⭐⭐⭐⭐⭐  
**Fallback**: Works without API too  

**Bottom line:** Your leads get a smoother experience, and you get more accurate venue data! 🎉

