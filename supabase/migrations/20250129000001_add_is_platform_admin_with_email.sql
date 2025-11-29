-- Add is_platform_admin function that accepts user_email parameter
-- This function checks if a user email is a platform admin by looking up the admin_roles table

CREATE OR REPLACE FUNCTION public.is_platform_admin(user_email text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user exists in admin_roles table and is active
  RETURN EXISTS (
    SELECT 1
    FROM public.admin_roles
    WHERE email = user_email
    AND is_active = true
  );
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.is_platform_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(text) TO anon;

COMMENT ON FUNCTION public.is_platform_admin(text) IS 'Checks if a user email is a platform admin by looking up the admin_roles table. Accepts user_email as parameter.';

