# Browser Test Results - Karaoke Admin Page

**Date:** January 26, 2026  
**URL Tested:** https://www.tipjar.live/admin/karaoke  
**Browser:** Cursor IDE Browser

## Test Results Summary

### ✅ **PASSED Tests:**

1. **Single Navigation Header**
   - ✅ Only karaoke-specific navigation header visible
   - ✅ No duplicate AdminNavbar present
   - **Status:** FIXED

2. **Text Contrast/Visibility**
   - ✅ "Upgrade to Premium" button text is visible (pink on light gray)
   - ✅ "See All" links are visible (pink text)
   - ✅ Playlist cards have proper contrast
   - **Status:** FIXED

3. **Page Load & Initial State**
   - ✅ Page loads successfully
   - ✅ Discover tab displays correctly
   - ✅ Queue tab accessible
   - ✅ Stats display correctly (Total: 9, Completed: 8, In Queue: 0)

### ⚠️ **ISSUES FOUND:**

1. **"Add Signup" Button Opens "about:blank"**
   - **Issue:** Clicking "Add Signup" button causes browser to navigate to "about:blank"
   - **Expected:** Should open a modal dialog with ManualKaraokeSignup form
   - **Actual:** Browser navigates away from page to "about:blank"
   - **Severity:** HIGH - Blocks admin manual signup functionality
   - **Location:** `pages/admin/karaoke.tsx` line 984
   - **Code:** `onClick={() => setShowManualSignup(true)}`
   - **Note:** The Dialog component at line 3137 should handle this, but something is causing navigation instead

2. **Video Display Window Opens Unexpectedly**
   - **Issue:** When "Add Signup" was clicked, a video display window also opened
   - **URL:** `https://www.tipjar.live/karaoke/video-display?videoId=D8AVkDUdfOI&title=&artist=`
   - **Expected:** Should not open when clicking "Add Signup"
   - **Severity:** MEDIUM - May indicate event handler conflict

## Testing Notes

- The page structure is correct
- UI elements are properly styled and visible
- Navigation works between tabs (Discover, Queue, Videos, Settings)
- Queue shows correct empty state messaging
- Stats display correctly

## Recommended Fixes

1. **Investigate "Add Signup" Button:**
   - Check if button is wrapped in a `<form>` or `<a>` tag
   - Verify event propagation isn't causing navigation
   - Check if Dialog component is properly preventing default behavior
   - Look for any `window.open()` calls that might be triggered

2. **Check Event Handlers:**
   - Review all click handlers on the page
   - Ensure `e.preventDefault()` is called where needed
   - Check for event bubbling issues

3. **Video Display Window:**
   - Investigate why video display opens when clicking "Add Signup"
   - Check if there's a global event listener causing this
   - Verify no auto-play logic is triggering

## Next Steps

1. Fix the "Add Signup" button to properly open modal
2. Test admin manual signup creation (rotation bypass)
3. Test auto-linking functionality
4. Test "Start Now" button flow
5. Test mini player queue play button
6. Test "Open in external display" after linking video
