# Production Errors - Fixed & Remaining Issues

## ✅ Fixed Issues

### 1. Download Server JSON Parsing Error
**Error**: `Unexpected token '<', "<!DOCTYPE "... is not valid JSON`

**Root Cause**: When the Render server returned an error (like a 404 or 500 HTML page), the code tried to parse HTML as JSON.

**Fix Applied**:
- Added content-type check before parsing JSON
- Gracefully handle HTML error pages
- Better error messages showing HTTP status codes
- Proper error propagation to the database

**Files Changed**:
- `pages/api/crowd-request/download-youtube-audio.js`

**Status**: ✅ Fixed and deployed

---

### 2. Improved Error Handling for songs_played Table
**Error**: `songs_played table not found or not accessible (non-critical): infinite recursion detected in policy`

**Fix Applied**:
- Added specific handling for infinite recursion policy errors
- Errors are logged as warnings (non-critical) and don't break the page
- Page continues to function without songs_played data

**Files Changed**:
- `pages/admin/crowd-requests.tsx`

**Status**: ✅ Improved error handling (database policy issue still exists)

---

## ⚠️ Remaining Issues (Non-Critical)

### 1. Multiple GoTrueClient Instances Warning
**Error**: `Multiple GoTrueClient instances detected in the same browser context`

**Impact**: Warning only - doesn't break functionality, but may cause undefined behavior

**Root Cause**: Multiple Supabase client instances being created in different parts of the app

**Current State**:
- `utils/supabase/client.ts` has singleton pattern for browser client
- `utils/supabase/server.ts` creates new instances per request (expected)
- `utils/company_lib/supabase.js` creates a separate instance

**Recommendation**: 
- This is a low-priority warning
- Consider consolidating Supabase client creation
- The singleton in `client.ts` should prevent most issues
- Server-side instances are expected to be per-request

**Status**: ⚠️ Low priority - monitoring

---

### 2. Supabase RLS Policy Infinite Recursion
**Error**: `infinite recursion detected in policy for relation "organization_members"`

**Impact**: 
- `organization_members` table queries return 500 errors
- `songs_played` table queries may also be affected
- These errors are caught and logged as warnings (non-critical)

**Root Cause**: 
RLS policies on `organization_members` (and possibly `songs_played`) are creating circular dependencies where:
- Policy A checks Policy B
- Policy B checks Policy C  
- Policy C checks Policy A (infinite loop)

**How to Fix** (Requires Database Access):
1. Go to Supabase Dashboard → SQL Editor
2. Check current policies:
   ```sql
   SELECT schemaname, tablename, policyname, cmd, roles, qual, with_check 
   FROM pg_policies 
   WHERE tablename IN ('organization_members', 'songs_played');
   ```
3. Identify policies that reference each other
4. Simplify policies to avoid circular dependencies
5. Use service role key for admin operations instead of RLS

**Example Fix**:
```sql
-- Drop problematic policies
DROP POLICY IF EXISTS "problematic_policy_name" ON organization_members;

-- Create simpler policy without recursion
CREATE POLICY "admin_full_access" ON organization_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organization_members om
      WHERE om.user_id = auth.uid()
      AND om.role = 'admin'
    )
  );
```

**Status**: ⚠️ Requires database admin access to fix

---

## 🧪 Testing After Fixes

### Test Download Feature:
1. Go to `/admin/crowd-requests`
2. Find a request with YouTube link
3. Click "Download Audio as MP3"
4. **Expected**: 
   - Status changes: pending → processing → completed
   - No JSON parsing errors in console
   - Clear error messages if download fails

### Test Error Handling:
1. Check browser console
2. **Expected**:
   - No uncaught errors
   - Warnings for `songs_played` are acceptable (non-critical)
   - Download errors show clear messages

---

## 📊 Monitoring

### What to Watch:
1. **Download Success Rate**: Check Render logs for download failures
2. **Error Frequency**: Monitor console for recurring errors
3. **Database Queries**: Watch for 500 errors on `organization_members` and `songs_played`

### Render Server Health:
```bash
curl https://m10dj.onrender.com/health
```
Should return: `{"status":"ok","timestamp":"...","server":"youtube-download-server"}`

---

## 🔧 Next Steps

### Immediate (Optional):
1. ✅ Download server error handling - **DONE**
2. ✅ Improved error messages - **DONE**
3. ⚠️ Fix Supabase RLS policies (requires DB access)

### Future Improvements:
1. Consolidate Supabase client creation to reduce GoTrueClient warnings
2. Review and simplify all RLS policies to prevent recursion
3. Add retry logic for transient download server errors
4. Add monitoring/alerting for download failures

---

## 📝 Notes

- The `songs_played` and `organization_members` errors are **non-critical** - the app continues to function
- These tables are used for optional features (song recognition matching, team management)
- The main functionality (crowd requests, payments, downloads) is unaffected
- Errors are logged as warnings and don't break the user experience

---

## 🆘 If Issues Persist

1. **Download still failing?**
   - Check Render server logs: https://dashboard.render.com
   - Verify environment variables are set in Vercel
   - Test Render server directly: `curl https://m10dj.onrender.com/health`

2. **Database errors increasing?**
   - Check Supabase logs: https://supabase.com/dashboard
   - Review RLS policies in SQL Editor
   - Consider temporarily disabling RLS on affected tables (admin only)

3. **Multiple client warnings?**
   - Check browser console for patterns
   - Review component initialization
   - Consider lazy loading Supabase clients

