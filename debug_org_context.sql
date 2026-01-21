-- =====================================================================================
-- DEBUG: Organization and User Context for Super Admin Access Issues
-- Run this to understand the current state of organizations and users
-- =====================================================================================

-- 1. Check all organizations
SELECT
  id,
  name,
  slug,
  owner_id,
  is_platform_owner,
  subscription_tier,
  subscription_status,
  product_context,
  created_at
FROM organizations
ORDER BY created_at DESC;

-- 2. Check users and their organization relationships
SELECT
  u.id as user_id,
  u.email,
  u.created_at as user_created_at,
  -- Owner relationships
  owner_org.id as owned_org_id,
  owner_org.name as owned_org_name,
  owner_org.is_platform_owner as owned_org_is_platform_owner,
  -- Member relationships
  member_org.id as member_org_id,
  member_org.name as member_org_name,
  member_org.is_platform_owner as member_org_is_platform_owner,
  om.is_active as membership_active,
  om.created_at as membership_created_at
FROM auth.users u
LEFT JOIN organizations owner_org ON owner_org.owner_id = u.id
LEFT JOIN organization_members om ON om.user_id = u.id AND om.is_active = true
LEFT JOIN organizations member_org ON member_org.id = om.organization_id
ORDER BY u.created_at DESC;

-- 3. Check organization members table details
SELECT
  om.id,
  om.organization_id,
  om.user_id,
  om.is_active,
  om.created_at,
  o.name as org_name,
  o.is_platform_owner,
  u.email as user_email
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
ORDER BY om.created_at DESC;

-- 4. Check for platform owner organization specifically
SELECT
  id,
  name,
  slug,
  owner_id,
  is_platform_owner,
  subscription_tier,
  subscription_status,
  product_context,
  created_at
FROM organizations
WHERE is_platform_owner = true;

-- 5. Check if there are any RLS policies that might be blocking access
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'user_playlists')
ORDER BY tablename, policyname;

-- 6. Check user_playlists table to see if any playlists exist
SELECT
  up.id,
  up.name,
  up.organization_id,
  up.user_id,
  up.is_public,
  up.created_at,
  o.name as org_name,
  u.email as user_email
FROM user_playlists up
JOIN organizations o ON o.id = up.organization_id
JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC;

-- 7. Check recent Supabase auth sessions/logs (if available)
-- Note: This might not be accessible via SQL, but good to check what we can
SELECT
  id,
  user_id,
  created_at,
  updated_at
FROM auth.sessions
WHERE created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC
LIMIT 10;