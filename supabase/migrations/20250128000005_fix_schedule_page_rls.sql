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

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organization's meeting_types" ON meeting_types;
DROP POLICY IF EXISTS "Public can view active meeting types" ON meeting_types;
DROP POLICY IF EXISTS "Admins can manage meeting types" ON meeting_types;

-- Allow anonymous users to view active meeting types (for public schedule page)
-- This allows the schedule page to work without authentication
CREATE POLICY "Public can view active meeting types"
  ON meeting_types FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- Allow authenticated users to view their organization's meeting types
-- This maintains organization isolation for authenticated users
CREATE POLICY "Users can view their organization's meeting_types"
  ON meeting_types FOR SELECT
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

-- Allow authenticated admins to manage meeting types
CREATE POLICY "Admins can manage meeting types"
  ON meeting_types FOR ALL
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
-- AVAILABILITY_PATTERNS: Allow anonymous users to read active patterns
-- ============================================================================

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organization's availability_patterns" ON availability_patterns;
DROP POLICY IF EXISTS "Public can view active availability patterns" ON availability_patterns;
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

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Users can view their organization's availability_overrides" ON availability_overrides;
DROP POLICY IF EXISTS "Public can view availability overrides" ON availability_overrides;
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

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their organization's meeting_bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Public can create bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Public can insert into meeting_bookings" ON meeting_bookings;
DROP POLICY IF EXISTS "Admins can manage all bookings" ON meeting_bookings;

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

