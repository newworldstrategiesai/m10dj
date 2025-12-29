-- ============================================================================
-- FIX MEETING_TYPES PUBLIC ACCESS
-- ============================================================================
-- Ensure anonymous users can view active meeting types for the schedule page
-- This migration ensures the RLS policies work correctly for public access
-- ============================================================================

BEGIN;

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

-- Allow authenticated users to manage meeting types for their organization
-- Only create if organization_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'meeting_types' 
    AND column_name = 'organization_id'
  ) THEN
    -- Allow users to view their organization's meeting types (including inactive ones)
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
        )';
    
    -- Allow admins to manage meeting types for their organization
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
        )';
  ELSE
    -- Fallback: Create admin policy without organization_id check
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

COMMIT;

