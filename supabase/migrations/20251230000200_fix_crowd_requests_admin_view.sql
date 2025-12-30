-- Fix RLS policies for crowd_requests to allow platform admins to view all requests
-- This migration adds back the "Admins can view all" policy that was removed in 20250123000001

-- Drop policies first if they exist (PostgreSQL doesn't support IF NOT EXISTS for CREATE POLICY)
DROP POLICY IF EXISTS "Platform admins can view all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Org owners can view orphaned crowd requests" ON crowd_requests;

-- Add policy for platform admins to view ALL crowd requests (regardless of organization)
-- This ensures that platform admins can see orphaned requests with NULL organization_id
CREATE POLICY "Platform admins can view all crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE auth.users.id = auth.uid()
      AND (auth.users.raw_user_meta_data->>'role' = 'admin' OR auth.users.raw_user_meta_data->>'role' = 'super_admin')
    )
    OR
    EXISTS (
      SELECT 1 FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Also add a policy that allows organization owners to see requests with NULL organization_id
-- These are likely orphaned requests that should be visible for manual assignment
-- This is a safety net for any requests created before organization_id was properly enforced
CREATE POLICY "Org owners can view orphaned crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (
    organization_id IS NULL
    AND EXISTS (
      SELECT 1 FROM organizations WHERE owner_id = auth.uid()
    )
  );

-- Backfill any crowd_requests with NULL organization_id to the default organization
-- This ensures future requests are properly associated
DO $$
DECLARE
  default_org_id UUID;
  updated_count INT;
BEGIN
  -- Get the M10 DJ Company organization (or the first organization if not found)
  SELECT id INTO default_org_id 
  FROM organizations 
  WHERE slug = 'm10dj' 
  LIMIT 1;
  
  -- Fallback to first organization if m10dj not found
  IF default_org_id IS NULL THEN
    SELECT id INTO default_org_id 
    FROM organizations 
    ORDER BY created_at ASC 
    LIMIT 1;
  END IF;
  
  -- Update any crowd_requests with NULL organization_id
  IF default_org_id IS NOT NULL THEN
    UPDATE crowd_requests 
    SET organization_id = default_org_id
    WHERE organization_id IS NULL;
    
    GET DIAGNOSTICS updated_count = ROW_COUNT;
    
    IF updated_count > 0 THEN
      RAISE NOTICE 'Updated % crowd_requests with default organization_id %', updated_count, default_org_id;
    END IF;
  ELSE
    RAISE WARNING 'No default organization found - orphaned crowd_requests will remain with NULL organization_id';
  END IF;
END $$;

-- Add comments
COMMENT ON POLICY "Platform admins can view all crowd requests" ON crowd_requests IS 
  'Allows platform admins and org owners to see all crowd requests for admin management';

COMMENT ON POLICY "Org owners can view orphaned crowd requests" ON crowd_requests IS 
  'Allows org owners to see requests with NULL organization_id for manual assignment';
