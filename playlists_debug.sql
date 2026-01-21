-- Check playlists and related data

-- 1. Check if user_playlists table has any data
SELECT
  COUNT(*) as total_playlists,
  COUNT(DISTINCT organization_id) as unique_orgs,
  COUNT(DISTINCT user_id) as unique_users
FROM user_playlists;

-- 2. Check recent playlists
SELECT
  up.id,
  up.name,
  up.organization_id,
  up.user_id,
  up.is_public,
  up.created_at,
  o.name as org_name,
  o.is_platform_owner,
  u.email as user_email
FROM user_playlists up
JOIN organizations o ON o.id = up.organization_id
JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC
LIMIT 10;

-- 3. Check RLS policies for user_playlists
SELECT
  schemaname,
  tablename,
  policyname,
  cmd,
  qual
FROM pg_policies
WHERE tablename = 'user_playlists'
ORDER BY policyname;

-- 4. Test what a user can see (replace with actual user ID)
-- This simulates what the RLS policies would return for a user
-- SELECT * FROM user_playlists WHERE organization_id IN (
--   SELECT organization_id FROM organization_members WHERE user_id = 'replace-with-user-id'
-- ) OR user_id = 'replace-with-user-id';