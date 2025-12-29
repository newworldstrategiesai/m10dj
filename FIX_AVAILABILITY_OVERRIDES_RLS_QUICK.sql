-- ============================================================================
-- QUICK FIX FOR AVAILABILITY_OVERRIDES RLS - Run this in Supabase SQL Editor
-- ============================================================================
-- This ensures availability_overrides can be read by anonymous users
-- ============================================================================

BEGIN;

-- Drop all existing policies on availability_overrides to start clean
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'availability_overrides' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON availability_overrides', r.policyname);
  END LOOP;
END $$;

-- Primary policy: Allow anonymous and authenticated users to view availability overrides
-- This is needed to check for blocked dates
CREATE POLICY "Public can view availability overrides"
  ON availability_overrides FOR SELECT
  TO anon, authenticated
  USING (TRUE);

COMMIT;

-- Verify the policy was created
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  cmd, 
  roles 
FROM pg_policies 
WHERE tablename = 'availability_overrides' 
AND schemaname = 'public';

