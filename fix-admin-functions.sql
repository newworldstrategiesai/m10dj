-- Run this SQL in your Supabase SQL editor to create the missing admin functions

-- Function to check if a user is an admin, bypassing RLS
CREATE OR REPLACE FUNCTION public.check_user_admin_status(user_id_param UUID)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_admin BOOLEAN := false;
BEGIN
  -- Check if user has admin role in any organization
  SELECT EXISTS (
    SELECT 1
    FROM organization_members
    WHERE user_id = user_id_param
    AND role = 'admin'
    AND is_active = true
  ) INTO is_admin;

  RETURN is_admin;
END;
$$;

-- Function to get all admin user IDs
CREATE OR REPLACE FUNCTION public.get_all_admin_user_ids()
RETURNS UUID[]
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_user_ids UUID[];
BEGIN
  -- Get all user IDs with admin role
  SELECT array_agg(user_id)
  INTO admin_user_ids
  FROM organization_members
  WHERE role = 'admin'
  AND is_active = true;

  RETURN COALESCE(admin_user_ids, ARRAY[]::UUID[]);
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.check_user_admin_status(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_user_admin_status(UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_all_admin_user_ids() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_all_admin_user_ids() TO anon;