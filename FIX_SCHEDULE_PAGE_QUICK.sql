-- ============================================================================
-- QUICK FIX FOR SCHEDULE PAGE - Run this in Supabase SQL Editor
-- ============================================================================
-- This will fix the 500 error on /schedule page by ensuring proper RLS policies
-- ============================================================================

-- First, verify the table exists and has the is_active column
DO $$
BEGIN
  -- Check if table exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types'
  ) THEN
    RAISE EXCEPTION 'meeting_types table does not exist. Please run the scheduling system migration first.';
  END IF;

  -- Check if is_active column exists, if not add it
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types' 
    AND column_name = 'is_active'
  ) THEN
    ALTER TABLE meeting_types ADD COLUMN is_active BOOLEAN DEFAULT TRUE;
    -- Set all existing rows to active
    UPDATE meeting_types SET is_active = TRUE WHERE is_active IS NULL;
  END IF;
END $$;

-- Drop all existing policies on meeting_types to start clean
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'meeting_types' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON meeting_types', r.policyname);
  END LOOP;
END $$;

-- Primary policy: Allow anonymous and authenticated users to view active meeting types
-- This is the simplest possible policy that should always work
CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- That's it! The public policy above should be sufficient for the schedule page to work.
-- The schedule page only needs to READ active meeting types, which this policy allows.

