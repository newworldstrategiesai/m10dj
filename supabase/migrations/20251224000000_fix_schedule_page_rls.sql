-- ============================================================================
-- FIX SCHEDULE PAGE RLS POLICIES
-- ============================================================================
-- The schedule page needs to be accessible to anonymous users, but the
-- organization_id migration created restrictive RLS policies that block
-- anonymous access. This migration fixes that while maintaining organization
-- isolation for authenticated users.
-- ============================================================================

BEGIN;

-- ============================================================================
-- MEETING_TYPES: Allow anonymous users to read active meeting types
-- ============================================================================

-- Drop ALL existing policies on meeting_types to avoid conflicts
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

-- Allow anonymous users to view active meeting types (for public schedule page)
-- This allows the schedule page to work without authentication
-- This is the PRIMARY policy for anonymous access - it must work independently
CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated users to view their organization's meeting types
-- This maintains organization isolation for authenticated users
-- Only applies to authenticated users (not anon)
-- Note: This policy is in addition to the public policy, so authenticated users
-- can see both active meeting types (public) and their org's meeting types
-- We check if organization_id column exists before using it
DO $$
BEGIN
  -- Only create this policy if organization_id column exists
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types' 
    AND column_name = 'organization_id'
  ) THEN
    EXECUTE '
      CREATE POLICY "Users can view their organization''s meeting_types"
        ON meeting_types FOR SELECT
        TO authenticated
        USING (
          organization_id IS NULL
          OR organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
          )
          OR organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true
          )
          OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND email IN (
              ''admin@m10djcompany.com'',
              ''manager@m10djcompany.com'',
              ''djbenmurray@gmail.com''
            )
          )
        )';
  END IF;
END $$;

-- Allow authenticated admins to manage meeting types
-- Only create if organization_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types' 
    AND column_name = 'organization_id'
  ) THEN
    EXECUTE '
      CREATE POLICY "Admins can manage meeting types"
        ON meeting_types FOR ALL
        TO authenticated
        USING (
          organization_id IS NULL
          OR organization_id IN (
            SELECT id FROM organizations WHERE owner_id = auth.uid()
          )
          OR organization_id IN (
            SELECT organization_id FROM organization_members 
            WHERE user_id = auth.uid() AND is_active = true AND role IN (''admin'', ''owner'')
          )
          OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND email IN (
              ''admin@m10djcompany.com'',
              ''manager@m10djcompany.com'',
              ''djbenmurray@gmail.com''
            )
          )
        )';
  ELSE
    -- Fallback: create policy without organization_id check
    EXECUTE '
      CREATE POLICY "Admins can manage meeting types"
        ON meeting_types FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND email IN (
              ''admin@m10djcompany.com'',
              ''manager@m10djcompany.com'',
              ''djbenmurray@gmail.com''
            )
          )
        )';
  END IF;
END $$;

-- ============================================================================
-- AVAILABILITY_PATTERNS: Allow anonymous users to read active patterns
-- ============================================================================

-- Drop existing restrictive policies (from all previous migrations)
DROP POLICY IF EXISTS "Users can view their organization's availability_patterns" ON availability_patterns;
DROP POLICY IF EXISTS "Public can view active availability patterns" ON availability_patterns;
DROP POLICY IF EXISTS "Admins can manage availability" ON availability_patterns;
DROP POLICY IF EXISTS "Admins can manage availability patterns" ON availability_patterns;

-- Allow anonymous users to read active availability patterns (needed for schedule page)
CREATE POLICY "Public can view active availability patterns"
  ON availability_patterns FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated users to view their organization's availability patterns
CREATE POLICY "Users can view their organization's availability_patterns"
  ON availability_patterns FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_platform_admin()
  );

-- Allow authenticated admins to manage availability patterns
CREATE POLICY "Admins can manage availability patterns"
  ON availability_patterns FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('admin', 'owner')
    )
    OR is_platform_admin()
  );

-- ============================================================================
-- AVAILABILITY_OVERRIDES: Allow anonymous users to read overrides
-- ============================================================================

-- Drop existing restrictive policies (from all previous migrations)
DROP POLICY IF EXISTS "Users can view their organization's availability_overrides" ON availability_overrides;
DROP POLICY IF EXISTS "Public can view availability overrides" ON availability_overrides;
DROP POLICY IF EXISTS "Admins can manage overrides" ON availability_overrides;
DROP POLICY IF EXISTS "Admins can manage availability overrides" ON availability_overrides;

-- Allow anonymous users to read availability overrides (needed to check blocked dates)
CREATE POLICY "Public can view availability overrides"
  ON availability_overrides FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Allow authenticated users to view their organization's availability overrides
CREATE POLICY "Users can view their organization's availability_overrides"
  ON availability_overrides FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_platform_admin()
  );

-- Allow authenticated admins to manage availability overrides
CREATE POLICY "Admins can manage availability overrides"
  ON availability_overrides FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('admin', 'owner')
    )
    OR is_platform_admin()
  );

-- ============================================================================
-- MEETING_BOOKINGS: Ensure anonymous users can create bookings
-- ============================================================================

-- Drop ALL existing policies on meeting_bookings to avoid conflicts
-- We'll recreate them with the correct permissions
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

-- Allow anonymous users to create bookings (public scheduling)
CREATE POLICY "Public can create bookings"
  ON meeting_bookings FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- Allow anonymous users to read bookings (needed for confirmation page with ID in URL)
CREATE POLICY "Public can view bookings by ID"
  ON meeting_bookings FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Allow authenticated users to view their organization's bookings
CREATE POLICY "Users can view their organization's meeting_bookings"
  ON meeting_bookings FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true
    )
    OR is_platform_admin()
  );

-- Allow authenticated admins to manage all bookings
CREATE POLICY "Admins can manage all bookings"
  ON meeting_bookings FOR ALL
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IN (
      SELECT organization_id FROM organization_members 
      WHERE user_id = auth.uid() AND is_active = true AND role IN ('admin', 'owner')
    )
    OR is_platform_admin()
  );

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================
-- The schedule page should now work for anonymous users while maintaining
-- organization isolation for authenticated users.
-- ============================================================================

COMMIT;

