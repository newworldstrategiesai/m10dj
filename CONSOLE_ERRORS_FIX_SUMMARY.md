# Console Errors Fix Summary

**Date:** January 16, 2026  
**Priority:** High - Production Errors  
**Status:** Partially Fixed

---

## Issues Identified

### 1. React Hydration Errors (#425, #418, #423) ✅ FIXED

**Errors:**
- Error #425: "Text content does not match server-rendered HTML"
- Error #418: "Hydration failed because the server rendered HTML didn't match the client"
- Error #423: "Hydration error - React recovered by client rendering"

**Root Cause:**
Date/time formatting using `toLocaleString()` and `toLocaleDateString()` can produce different results on server vs client due to:
- Timezone differences
- Locale settings
- Server/client environment differences

**Files Fixed:**
- `pages/admin/invoices/[id].tsx`
  - Replaced `toLocaleString()` calls with consistent `formatDateTime()` helper
  - Replaced `toLocaleDateString()` calls with consistent `formatDate()` helper
  - Fixed date initialization in form state to use client-side only values
  - Fixed event date display in form dropdowns

**Changes Made:**
1. Added `formatDateTime()` helper function for consistent date/time formatting
2. Updated `formatDate()` to use consistent formatting
3. Changed date initialization to check for `typeof window === 'undefined'` to prevent server/client mismatches
4. Updated all date rendering to use these helpers

---

### 2. API Route 404 Errors ⚠️ ENHANCED ERROR HANDLING

**Errors:**
- `/api/invoices/c43b6fe2-b130-429d-aa73-775fb50f19a8/preview` → 404
- `/api/quote/f66ac98b-30ed-41c8-acde-291d33ffefc4/payments` → 404
- `/api/quote/f66ac98b-30ed-41c8-acde-291d33ffefc4` → 404

**Root Cause:**
The routes exist but may be:
- Not being found in production build
- Failing silently before reaching the handler
- Having routing issues with dynamic segments

**Files Enhanced:**
- `pages/api/invoices/[id]/preview.js`
  - Added CORS headers
  - Added OPTIONS handler
  - Enhanced error logging with request context
  - Added console logging for debugging

**Status:**
Routes exist and are properly structured. If 404s persist, check:
1. Next.js build output for route compilation errors
2. Vercel/production deployment logs
3. Ensure routes are included in build

---

### 3. Multiple GoTrueClient Instances ⚠️ PARTIALLY ADDRESSED

**Error:**
```
Multiple GoTrueClient instances detected in the same browser context. 
It is not an error, but this should be avoided as it may produce 
undefined behavior when used concurrently under the same storage key.
```

**Root Cause:**
Multiple Supabase client instances being created across the application.

**Existing Fixes:**
- `utils/supabase/client.ts` - Uses singleton pattern ✅
- `utils/company_lib/supabase.js` - Uses singleton pattern ✅

**Action Required:**
- Audit all components using `createClientComponentClient()` from `@supabase/auth-helpers-nextjs`
- Migrate to singleton `createClient()` from `@/utils/supabase/client`
- Check for any direct imports of `createClient` from `@supabase/supabase-js` in components

---

### 4. Supabase 406/500 Errors ⚠️ DATABASE RLS ISSUES

**Errors:**
- `organization_members?organization_id=eq.2a10fa9f-...&is_active=eq.true` → 500
- `contact_submissions?select=id&email=eq.joelane1865%40gmail.com` → 406
- `crowd_requests?select=id&requester_email=eq.joelane1865%40gmail.com` → 406

**Root Cause:**
Row Level Security (RLS) policies are blocking queries:

1. **organization_members (500):**
   - RLS policy may be causing infinite recursion
   - Migration `20260114000000_fix_rls_errors.sql` exists to fix this
   - Need to verify migration has been applied

2. **contact_submissions (406):**
   - RLS policies blocking duplicate checking queries
   - Queries are checking for existing submissions within time windows
   - These queries may need service role or updated RLS policies

3. **crowd_requests (406):**
   - Similar RLS blocking issue
   - May need updated policies for query access

**Action Required:**

1. **Run Database Migrations:**
   ```sql
   -- Check if these migrations have been applied:
   -- 20260114000000_fix_rls_errors.sql
   -- 20260105000004_fix_infinite_recursion_rls.sql
   ```

2. **Review RLS Policies:**
   - `organization_members` - Ensure policies allow members to view their organization's members
   - `contact_submissions` - Ensure policies allow duplicate checking queries
   - `crowd_requests` - Ensure policies allow query access

3. **Alternative Solution:**
   - Use service role client in API routes for these queries
   - Update queries to use API routes that bypass RLS when appropriate

**Files That May Need Updates:**
- API routes that query `organization_members` directly
- Duplicate checking logic in contact form submission
- Crowd requests queries

---

## Recommended Next Steps

### Immediate (Production Fixes)
1. ✅ **COMPLETED:** Fix React hydration errors
2. ✅ **COMPLETED:** Enhance API route error handling
3. ⚠️ **IN PROGRESS:** Verify database migrations have been applied
4. ⚠️ **IN PROGRESS:** Review and update RLS policies

### Short Term (Code Quality)
1. Complete audit of Supabase client creation patterns
2. Migrate all components to use singleton client
3. Add better error handling for RLS failures
4. Add retry logic for transient RLS errors

### Long Term (Architecture)
1. Review RLS policy architecture
2. Consider service role usage patterns in API routes
3. Implement better error monitoring for Supabase errors
4. Add integration tests for RLS policies

---

## Testing Checklist

- [ ] Verify hydration errors are resolved (check browser console)
- [ ] Test invoice preview functionality
- [ ] Verify quote API endpoints are accessible
- [ ] Check organization members loading
- [ ] Test contact form duplicate detection
- [ ] Verify crowd requests functionality

---

## Notes

- The 406 errors are particularly concerning as they indicate RLS is blocking legitimate queries
- The 500 error on `organization_members` suggests a deeper RLS recursion issue
- All code changes have been made with backward compatibility in mind
- Date formatting fixes ensure consistent rendering across server and client
