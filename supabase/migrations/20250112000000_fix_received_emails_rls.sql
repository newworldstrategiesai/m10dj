-- Fix RLS policies for received_emails table to properly support admin access
-- This migration updates the policies to work correctly in production

-- Drop existing policies
DROP POLICY IF EXISTS "Admin can view all emails" ON public.received_emails;
DROP POLICY IF EXISTS "Admin can update emails" ON public.received_emails;
DROP POLICY IF EXISTS "Service role can insert emails" ON public.received_emails;

-- Recreate policies with better logic
-- Policy 1: Service role can insert (for webhooks)
CREATE POLICY "Service role can insert emails"
  ON public.received_emails
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Policy 2: Authenticated admins can view all emails
CREATE POLICY "Admin can view all emails"
  ON public.received_emails
  FOR SELECT
  TO authenticated
  USING (
    -- Check if user email is in admin list
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR
    -- Check if user has admin role in user metadata
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

-- Policy 3: Authenticated admins can update emails
CREATE POLICY "Admin can update emails"
  ON public.received_emails
  FOR UPDATE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

-- Policy 4: Authenticated admins can delete emails
CREATE POLICY "Admin can delete emails"
  ON public.received_emails
  FOR DELETE
  TO authenticated
  USING (
    auth.jwt() ->> 'email' IN ('djbenmurray@gmail.com', 'm10djcompany@gmail.com', 'admin@m10djcompany.com')
    OR
    COALESCE((auth.jwt() -> 'user_metadata' ->> 'role')::text, '') = 'admin'
  );

