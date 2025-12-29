-- ============================================================================
-- COMPLETE FIX FOR SCHEDULE PAGE RLS - Run this in Supabase SQL Editor
-- ============================================================================
-- This fixes all RLS policies needed for the schedule page to work
-- Run this to ensure all schedule-related tables are accessible to anonymous users
-- ============================================================================

BEGIN;

-- ============================================================================
-- 1. MEETING_TYPES: Allow anonymous users to read active meeting types
-- ============================================================================
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

CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- ============================================================================
-- 2. AVAILABILITY_PATTERNS: Allow anonymous users to read active patterns
-- ============================================================================
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

CREATE POLICY "Public can view active availability patterns"
  ON availability_patterns FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- ============================================================================
-- 3. AVAILABILITY_OVERRIDES: Allow anonymous users to read overrides
-- ============================================================================
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

CREATE POLICY "Public can view availability overrides"
  ON availability_overrides FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- ============================================================================
-- 4. MEETING_BOOKINGS: Allow anonymous users to create and read bookings
-- ============================================================================
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN 
    SELECT policyname 
    FROM pg_policies 
    WHERE tablename = 'meeting_bookings' 
    AND schemaname = 'public'
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON meeting_bookings', r.policyname);
  END LOOP;
END $$;

-- Allow anonymous users to create bookings
CREATE POLICY "Public can create bookings"
  ON meeting_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Allow anonymous users to read bookings (needed for confirmation page)
CREATE POLICY "Public can view bookings"
  ON meeting_bookings FOR SELECT
  TO anon, authenticated
  USING (TRUE);

COMMIT;

-- Verify all policies were created
SELECT 
  tablename, 
  policyname, 
  cmd, 
  roles 
FROM pg_policies 
WHERE tablename IN ('meeting_types', 'availability_patterns', 'availability_overrides', 'meeting_bookings')
AND schemaname = 'public'
ORDER BY tablename, policyname;

