-- Check current database state for organization and playlist access

-- 1. All organizations with their owners
SELECT
  o.id,
  o.name,
  o.slug,
  o.owner_id,
  o.is_platform_owner,
  o.subscription_status,
  o.product_context,
  u.email as owner_email
FROM organizations o
LEFT JOIN auth.users u ON u.id = o.owner_id
ORDER BY o.created_at DESC;

-- 2. All active organization memberships
SELECT
  om.organization_id,
  o.name as org_name,
  o.is_platform_owner,
  om.user_id,
  u.email as user_email,
  om.is_active,
  om.created_at as membership_created
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
WHERE om.is_active = true
ORDER BY om.created_at DESC;

-- 3. Check user_playlists table
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
LEFT JOIN organizations o ON o.id = up.organization_id
LEFT JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC;

-- 4. Check RLS policies that might affect access
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'user_playlists')
ORDER BY tablename, policyname;