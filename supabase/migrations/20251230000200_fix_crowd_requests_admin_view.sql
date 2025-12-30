-- Fix RLS policies for crowd_requests to allow platform admins to view all requests
-- This migration adds back admin visibility that was removed in 20250123000001

-- First, create a helper function that bypasses RLS (SECURITY DEFINER)
-- This avoids infinite recursion when checking admin_roles table
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE user_id = auth.uid()
    AND is_active = true
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated;

-- Drop policies first if they exist
DROP POLICY IF EXISTS "Platform admins can view all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Platform admins can update all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Platform admins can delete all crowd requests" ON crowd_requests;
DROP POLICY IF EXISTS "Org owners can view orphaned crowd requests" ON crowd_requests;

-- Add policy for platform admins using the SECURITY DEFINER function
CREATE POLICY "Platform admins can view all crowd requests"
  ON crowd_requests
  FOR SELECT
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Platform admins can update all crowd requests"
  ON crowd_requests
  FOR UPDATE
  TO authenticated
  USING (public.is_current_user_admin());

CREATE POLICY "Platform admins can delete all crowd requests"
  ON crowd_requests
  FOR DELETE
  TO authenticated
  USING (public.is_current_user_admin());

-- Backfill any crowd_requests with NULL organization_id to the default organization
DO $$
DECLARE
  default_org_id UUID;
  updated_count INT;
BEGIN
  -- Get the M10 DJ Company organization
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
  END IF;
END $$;

-- Add comments
COMMENT ON FUNCTION public.is_current_user_admin() IS 
  'SECURITY DEFINER function to check if current user is an admin without RLS recursion';

COMMENT ON POLICY "Platform admins can view all crowd requests" ON crowd_requests IS 
  'Allows platform admins to see all crowd requests for admin management';

COMMENT ON POLICY "Platform admins can update all crowd requests" ON crowd_requests IS 
  'Allows platform admins to update any crowd request';

COMMENT ON POLICY "Platform admins can delete all crowd requests" ON crowd_requests IS 
  'Allows platform admins to delete any crowd request';
