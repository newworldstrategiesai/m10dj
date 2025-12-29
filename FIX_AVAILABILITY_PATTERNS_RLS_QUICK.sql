-- ============================================================================
-- QUICK FIX FOR AVAILABILITY_PATTERNS RLS - Run this in Supabase SQL Editor
-- ============================================================================
-- This will fix the 500 error on the schedule page by ensuring availability_patterns
-- can be read by anonymous users
-- ============================================================================

BEGIN;

-- Drop all existing policies on availability_patterns to start clean
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'availability_patterns' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON availability_patterns', r.policyname);
  END LOOP;
END $$;

-- Primary policy: Allow anonymous and authenticated users to view active availability patterns
-- This is the simplest possible policy that should always work
CREATE POLICY "Public can view active availability patterns"
  ON availability_patterns FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Note: Admin management policies can be added separately if needed
-- For now, this ensures the schedule page works for public users

COMMIT;

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  roles 
FROM pg_policies 
WHERE tablename = 'availability_patterns' 
AND schemaname = 'public';

