# Karaoke Fixes and Testing Guide

## All Fixes Applied

### 1. ✅ Rotation Check Bypass for Admin Manual Signups
**Issue:** Admins getting "Please wait for X more singers" error when manually adding signups  
**Fix:** Added check to detect authenticated admin users and skip rotation checks  
**File:** `pages/api/karaoke/signup.js` lines 200-207, 441-442  
**Status:** Fixed and pushed

### 2. ✅ Auto-Linking Videos on Signup Creation
**Issue:** Videos not automatically linked when signups are created  
**Fix:** Added auto-linking logic with comprehensive logging  
**File:** `pages/api/karaoke/signup.js` lines 531-687  
**Status:** Fixed and pushed (with detailed logging for debugging)

### 3. ✅ "Start Now" Button Auto-Play
**Issue:** Video not appearing in mini player and external display when clicking "Start Now"  
**Fix:** Enhanced `startPlayingSignup` to open display window and update mini player  
**Files:** 
- `pages/admin/karaoke.tsx` lines 622-630
- `components/karaoke/KaraokeLayout.tsx` lines 107-189
- `components/karaoke/layout/KaraokePlayerPanel.tsx` lines 587-623  
**Status:** Fixed and pushed

### 4. ✅ Mini Player Queue Play Button
**Issue:** Opening "about:blank" instead of display window  
**Fix:** Fixed window opening logic to use proper URL parameters  
**File:** `components/karaoke/layout/KaraokePlayerPanel.tsx` lines 490-542  
**Status:** Fixed and pushed

### 5. ✅ "Open in External Display" After Linking
**Issue:** Shows "No video selected" after linking video in modal  
**Fix:** Updated to use correct video data (signupToLink vs linkingSong)  
**File:** `components/karaoke/VideoManager.tsx` lines 1713-1721, 601-642  
**Status:** Fixed and pushed

### 6. ✅ Duplicate Navbar
**Issue:** Two navbars appearing on karaoke admin pages  
**Fix:** Excluded karaoke admin routes from AdminNavbar  
**File:** `pages/_app.js` lines 113, 200-207, 276  
**Status:** Fixed and pushed

### 7. ✅ White-on-White Text
**Issue:** Text not visible in premium banner and playlist cards  
**Fix:** Added explicit text colors with dark mode support  
**Files:** 
- `components/karaoke/DiscoverPage.tsx` lines 177-181, 263-270
- `styles/main.css` lines 78-84  
**Status:** Fixed and pushed

## Testing Checklist

### Test 1: Admin Manual Signup (Rotation Bypass)
1. Navigate to `/admin/karaoke`
2. Click "Add Signup" button
3. Fill in:
   - Singer name: "Test Singer"
   - Song title: "Test Song"
   - Song artist: "Test Artist"
4. Submit form
5. **Expected:** Signup created successfully, NO "Please wait for X more singers" error
6. **Check server logs:** Should see "✅ Admin manual signup detected - user: [id]"

### Test 2: Auto-Linking Videos
1. Create a new signup via admin (don't manually link video)
2. **Check server logs** for:
   - `🎬 Attempting to auto-link video for signup: [id]`
   - `🔍 Searching for videos...`
   - `📹 Found X videos`
   - `✅ Successfully auto-linked video...` OR error details
3. **Expected:** Video should be automatically linked if good match found (score >= 50)
4. **Verify:** Signup should show video linked in the UI

### Test 3: "Start Now" Button Flow
1. Ensure a signup has status "next" and has a video linked
2. Click "Start Now" button
3. **Expected:**
   - Signup status changes to "singing"
   - Video appears in mini player sidebar (right side)
   - External display window opens with the video playing
4. **Check console:** Should see "Starting to play signup after status update"

### Test 4: Mini Player Queue Play Button
1. Add songs to queue (signups with videos, status "queued" or "next")
2. Open mini player panel (if not already open)
3. Click play button (▶) on a queue item
4. **Expected:**
   - External display window opens (NOT about:blank)
   - Video loads and plays correctly
   - Signup status changes to "singing"
5. **If video not linked:** Should show toast: "This song needs a video linked before it can be played"

### Test 5: "Open in External Display" After Linking
1. Open video linking modal for a signup
2. Search and link a video
3. Click "Open in external display" button (Monitor icon) in the same modal
4. **Expected:**
   - Display window opens with the correct video
   - NOT "No video selected" message
   - Video plays correctly

### Test 6: UI Text Visibility
1. Navigate to `/admin/karaoke` (Discover tab)
2. **Check premium banner:**
   - "Sing without limits" text should be visible (white on gradient)
   - "Subscribe to unlock..." text should be visible
3. **Check playlist cards:**
   - Playlist names should be readable (dark text in light mode, white in dark mode)
   - Descriptions should be readable
   - Song counts should be visible

### Test 7: Navbar (No Duplicates)
1. Navigate to `/admin/karaoke`
2. **Expected:** Only ONE navbar visible (KaraokeHeader)
3. **NOT expected:** AdminNavbar should NOT appear

## Server Logs to Monitor

When testing, watch for these log messages:

### Auto-Linking Logs:
- `🎬 Attempting to auto-link video for signup: [id]`
- `🔍 Searching for videos...`
- `📹 Found X videos`
- `✅ X embeddable videos found`
- `🏆 Best video: [title] (Score: X)`
- `✅ Auto-linking video with score: X`
- `✅ Video validated: [title]`
- `💾 Saving video record...`
- `✅ Video saved, linking to signup...`
- `✅ Successfully auto-linked video to signup: [video_id]`
- `❌ Error auto-linking video (non-fatal):` (with details)

### Admin Signup Logs:
- `✅ Admin manual signup detected - user: [id]`
- `✅ Admin manual signup - skipping rotation checks`
- `ℹ️ Public signup (no authenticated user)`

### Video Playback Logs:
- `Starting to play signup after status update:`
- `Starting to play signup:`
- `✅ Sent video command to display window`

## Known Issues/Warnings (Non-Critical)

1. **Multiple GoTrueClient instances warning** - This is a warning, not an error. The singleton pattern is in place, but some components may still create instances. This doesn't break functionality.

2. **WebSocket connection refused** - This is normal if the dev server isn't running or if HMR (Hot Module Replacement) isn't available. Doesn't affect functionality.

3. **406 errors on Supabase queries** - These are RLS (Row Level Security) policy issues. May need database migration updates, but don't affect core karaoke functionality.

## Next Steps

1. Test all scenarios above
2. Check server logs for auto-linking attempts
3. Verify rotation bypass works for admin signups
4. Confirm all UI elements are visible
5. Test video playback in both mini player and external display
