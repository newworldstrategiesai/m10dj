-- Create admin_roles table for centralized admin management
-- This replaces hardcoded admin email arrays throughout the codebase

CREATE TABLE IF NOT EXISTS public.admin_roles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role text NOT NULL CHECK (role IN ('admin', 'manager', 'editor')),
  is_active boolean DEFAULT true NOT NULL,
  full_name text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL,
  last_login timestamp with time zone,
  UNIQUE(user_id),
  UNIQUE(email)
);

-- Create index for fast email lookups
CREATE INDEX IF NOT EXISTS idx_admin_roles_email ON public.admin_roles(email);
CREATE INDEX IF NOT EXISTS idx_admin_roles_user_id ON public.admin_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_roles_active ON public.admin_roles(is_active) WHERE is_active = true;

-- Enable RLS
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Admins can view all admin roles" ON public.admin_roles;
DROP POLICY IF EXISTS "Service role has full access" ON public.admin_roles;
DROP POLICY IF EXISTS "Users can view their own admin role" ON public.admin_roles;

-- RLS Policies
-- Admins can view all admin roles
CREATE POLICY "Admins can view all admin roles" ON public.admin_roles
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_roles
      WHERE user_id = auth.uid()
      AND is_active = true
    )
  );

-- Users can view their own admin role
CREATE POLICY "Users can view their own admin role" ON public.admin_roles
  FOR SELECT
  USING (auth.uid() = user_id);

-- Service role can do everything (for migrations and server-side operations)
CREATE POLICY "Service role has full access" ON public.admin_roles
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Insert initial admin users (migrate from hardcoded list)
-- This will only insert if the users exist in auth.users
INSERT INTO public.admin_roles (user_id, email, role, is_active, full_name)
SELECT 
  id as user_id,
  email,
  'admin' as role,
  true as is_active,
  COALESCE(
    raw_user_meta_data->>'full_name',
    raw_user_meta_data->>'name',
    split_part(email, '@', 1)
  ) as full_name
FROM auth.users
WHERE email IN (
  'admin@m10djcompany.com',
  'manager@m10djcompany.com',
  'djbenmurray@gmail.com'
)
ON CONFLICT (email) DO NOTHING;

-- Create or replace function to check if user is platform admin (by email)
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

-- Create or replace function to get admin role
CREATE OR REPLACE FUNCTION public.get_admin_role(user_email text)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  email text,
  role text,
  is_active boolean,
  full_name text,
  last_login timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ar.id,
    ar.user_id,
    ar.email,
    ar.role,
    ar.is_active,
    ar.full_name,
    ar.last_login
  FROM public.admin_roles ar
  WHERE ar.email = user_email
  AND ar.is_active = true;
END;
$$;

-- Grant permissions
GRANT SELECT ON public.admin_roles TO authenticated;
GRANT SELECT ON public.admin_roles TO anon;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_platform_admin(text) TO anon;
GRANT EXECUTE ON FUNCTION public.get_admin_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_admin_role(text) TO anon;

-- Add helpful comments
COMMENT ON TABLE public.admin_roles IS 'Centralized table for managing platform admin users. Replaces hardcoded email arrays.';
COMMENT ON FUNCTION public.is_platform_admin(text) IS 'Checks if a user email is a platform admin by looking up the admin_roles table. Accepts user_email as parameter.';
COMMENT ON FUNCTION public.get_admin_role(text) IS 'Returns admin role details for a given user email.';

