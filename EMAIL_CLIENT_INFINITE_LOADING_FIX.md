# Email Client Infinite Loading Issue - Fix Guide

## Problem
The admin email-client page stays blank and loads infinitely in production. This typically indicates an issue with:
1. RLS (Row Level Security) policies preventing data access
2. API endpoint failures (timeout or permission errors)
3. Authentication/authorization issues

## Root Cause Analysis

### What's Happening
1. User successfully loads the page (auth check passes)
2. `EmailClient` component mounts and calls:
   - `GET /api/emails/accounts` - to get list of email accounts
   - `GET /api/emails?folder=unified` - to load emails
3. These API calls query the `received_emails` table in Supabase
4. **RLS policies fail silently**, returning no data
5. Component stays in `isLoading: true` state indefinitely

### Why RLS Policies Are Failing
The original policies used `auth.users` subqueries which don't work correctly in all contexts:

```sql
-- ❌ Old approach (fails in production)
USING (
  EXISTS (
    SELECT 1 FROM auth.users
    WHERE auth.users.id = auth.uid()
    AND (auth.users.email IN (...))
  )
)
```

## Solution Applied

### 1. Updated RLS Policies (Migration)
**File:** `supabase/migrations/20250112000000_fix_received_emails_rls.sql`

The new policies use `auth.jwt()` which directly accesses the JWT token claims:

```sql
-- ✅ New approach (works reliably)
USING (
  auth.jwt() ->> 'email' IN ('admin@m10djcompany.com', ...)
  OR
  COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
)
```

**Changes:**
- SELECT policy: Admin users can view all emails
- UPDATE policy: Admin users can update emails
- DELETE policy: Admin users can delete emails (new)
- INSERT policy: Service role only (for webhooks)

### 2. Added Error Handling & Timeouts
**File:** `components/email-client.tsx`

**Changes:**
- Added 10-second timeout to `/api/emails/accounts` request
- Added 15-second timeout to `/api/emails` request
- Displays helpful error messages instead of infinite loading
- Stops polling if an error occurs
- Better error logging for debugging

## Steps to Fix Production

### Step 1: Apply the Migration
```bash
# Push migration to production
supabase db push --linked --dry-run  # Preview first
supabase db push --linked             # Apply to production
```

### Step 2: Clear Browser Cache & Test
1. Open admin/email-client in production
2. Open browser DevTools (F12)
3. Check Console tab for error messages
4. Check Network tab to see which requests are failing

### Step 3: Verify in Browser Console
If you see a timeout or permission error, it will now display instead of loading infinitely.

## Debugging Steps if Still Having Issues

### 1. Check API Response
Open DevTools → Network tab → Filter for `emails`

Expected responses:
- `/api/emails/accounts`: `200 OK` with JSON array of accounts
- `/api/emails?folder=unified`: `200 OK` with JSON array of emails

If you see:
- `401 Unauthorized`: Authentication failed
- `500 Server Error`: Check server logs for details
- Timeout: API is not responding

### 2. Check Supabase RLS Policies
In Supabase dashboard:
1. Go to SQL Editor
2. Run this query to check current policies:

```sql
SELECT * FROM pg_policies 
WHERE tablename = 'received_emails';
```

Should show 4 policies:
- Admin can view all emails
- Admin can update emails
- Admin can delete emails
- Service role can insert emails

### 3. Check User Authentication
Add this to browser console to debug:
```javascript
// Check if user is authenticated
const response = await fetch('/api/emails/accounts');
console.log('Status:', response.status);
console.log('Response:', await response.json());
```

### 4. Check Admin Status
Verify the logged-in user's email is in one of these lists:
- `djbenmurray@gmail.com` (Ben)
- `m10djcompany@gmail.com` (Company email)
- `admin@m10djcompany.com` (Admin role)

Or has `role: 'admin'` in their user metadata.

## Testing Checklist

- [ ] Migration deployed to Supabase
- [ ] Page no longer shows infinite loading
- [ ] If error: displays helpful error message instead
- [ ] Email list loads within 15 seconds
- [ ] Can select an email and view details
- [ ] Can mark emails as read/archive/delete

## Additional Improvements Made

1. **Request Timeouts**: Prevents hanging requests
2. **Error State Display**: Shows error messages to user
3. **Polling Guard**: Stops polling if error occurs
4. **Better Logging**: Console shows what's happening
5. **HTTP Status in Error Messages**: Shows exact failure reason

## Related Files

- `supabase/migrations/20250112000000_fix_received_emails_rls.sql` - RLS policy fixes
- `components/email-client.tsx` - Added error handling and timeouts
- `pages/api/emails/index.ts` - Email listing API endpoint
- `pages/api/emails/accounts.ts` - Account listing API endpoint
- `supabase/migrations/20250211000000_create_emails_table.sql` - Original table schema

## Monitoring in Production

After deploying, monitor:
1. Browser console for errors
2. Network tab for request failures
3. Supabase logs for permission errors
4. Page load time should be < 5 seconds

If issues persist, the error message will tell you exactly what failed!

