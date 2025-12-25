# 🔧 Fix Event Page Caching Issue

## Problem
The event page at `/events/live/dj-ben-murray-silky-osullivans-2026-12-27` looks great locally but shows an older version in production.

## Root Cause
The service worker is using a "stale-while-revalidate" caching strategy that serves cached content immediately and updates in the background. This means users see the old cached version until the background update completes.

## Solution Applied

### 1. Updated Cache Version
Changed cache version from `v1` to `v2` to force all users to get fresh content:
- `m10dj-v1` → `m10dj-v2`
- `m10dj-static-v1` → `m10dj-static-v2`
- `m10dj-dynamic-v1` → `m10dj-dynamic-v2`
- `m10dj-images-v1` → `m10dj-images-v2`

### 2. Network-First Strategy for Event Pages
Modified the service worker to use **network-first** strategy for all `/events/` pages instead of stale-while-revalidate. This ensures:
- Event pages always fetch fresh content from the network first
- Cache is only used as a fallback if network fails
- Users always see the latest version of event pages

## Next Steps

### 1. Deploy the Changes
```bash
git add public/sw.js
git commit -m "Fix event page caching - use network-first strategy"
git push
```

### 2. Clear Browser Cache (For Testing)
After deployment, users can:
- **Chrome/Edge**: Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Firefox**: Press `Ctrl+Shift+Delete` (Windows) or `Cmd+Shift+Delete` (Mac)
- **Safari**: Press `Cmd+Option+E` to clear cache

Or manually:
1. Open DevTools (F12)
2. Go to Application tab
3. Click "Clear storage"
4. Check "Cache storage" and "Service Workers"
5. Click "Clear site data"

### 3. Verify the Fix
1. Deploy to production
2. Visit the event page in an incognito/private window
3. Check that the latest version appears
4. Verify service worker is using v2 cache

## Technical Details

### Before (Stale-While-Revalidate)
```
User Request → Check Cache → Return Cached (if exists) → Update Cache in Background
```
**Problem**: Users see old cached content immediately

### After (Network-First for Events)
```
User Request → Fetch from Network → Update Cache → Return Fresh Content
If Network Fails → Fallback to Cache
```
**Solution**: Users always see fresh content for event pages

## Expected Results

✅ Event pages always show latest version
✅ Cache version updated forces refresh for all users
✅ Better user experience with fresh content
✅ Fallback to cache if network fails (offline support)

## Monitoring

After deployment, monitor:
- Service worker registration in browser DevTools
- Cache version should show `v2`
- Event pages should load fresh content
- Network tab should show network-first requests

---

**Last Updated**: December 2024
**Status**: ✅ Fixed - Ready to deploy

