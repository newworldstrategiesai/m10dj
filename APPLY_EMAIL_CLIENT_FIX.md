# Quick: Apply Email Client Infinite Loading Fix

## TL;DR
The admin email-client page loads infinitely because **RLS policies are blocking data access**.

## Files Changed
1. ✅ `components/email-client.tsx` - Added error handling and timeouts
2. ✅ `supabase/migrations/20250112000000_fix_received_emails_rls.sql` - Fixed RLS policies

## Deploy Now

### Option 1: Using Supabase CLI
```bash
# From project root
supabase db push --linked
```

### Option 2: Using Supabase Dashboard
1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor**
4. Copy-paste content from `supabase/migrations/20250112000000_fix_received_emails_rls.sql`
5. Run the SQL

### Option 3: Manual SQL (if above fails)
Run in Supabase SQL Editor:

```sql
-- Drop old policies
DROP POLICY IF EXISTS "Admin can view all emails" ON public.received_emails;
DROP POLICY IF EXISTS "Admin can update emails" ON public.received_emails;
DROP POLICY IF EXISTS "Service role can insert emails" ON public.received_emails;

-- Create new policies
CREATE POLICY "Service role can insert emails"
  ON public.received_emails FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "Admin can view all emails"
  ON public.received_emails FOR SELECT TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

CREATE POLICY "Admin can update emails"
  ON public.received_emails FOR UPDATE TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

CREATE POLICY "Admin can delete emails"
  ON public.received_emails FOR DELETE TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );
```

## Test in Production

1. Go to https://yoursite.com/admin/email-client
2. Should load within 15 seconds
3. If error: You'll see a helpful error message (not infinite loading!)
4. If success: You'll see email list and accounts

## What Changed

### Why It Was Broken
```sql
-- ❌ Old way: Queries auth.users table (doesn't work in all contexts)
USING (
  EXISTS (SELECT 1 FROM auth.users WHERE auth.users.email IN (...))
)
```

### Why It's Fixed Now
```sql
-- ✅ New way: Directly reads JWT claims (works everywhere)
USING (
  auth.jwt() ->> 'email' IN ('admin@m10djcompany.com', ...)
  OR COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
)
```

## Verify It Worked

**In browser console:**
```javascript
// Should return data, not error
await fetch('/api/emails/accounts').then(r => r.json()).then(console.log)
```

**Should see:**
```json
{
  "accounts": [
    { "id": "hello", "name": "General Inquiries", "email": "hello@m10djcompany.com", "avatar": "👋", "unreadCount": 0 },
    // ... more accounts
  ]
}
```

If you see errors, check the console and refer to `EMAIL_CLIENT_INFINITE_LOADING_FIX.md` for debugging.

## Need Help?

Check `EMAIL_CLIENT_INFINITE_LOADING_FIX.md` for:
- Detailed debugging steps
- Understanding the root cause
- Testing checklist
- How to verify RLS policies are correct

