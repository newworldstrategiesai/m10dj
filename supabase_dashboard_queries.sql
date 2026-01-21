-- =====================================================================================
-- SUPABASE DASHBOARD QUERIES
-- Copy and paste these into your Supabase SQL Editor one at a time
-- =====================================================================================

-- QUERY 1: Check all organizations
SELECT id, name, slug, owner_id, is_platform_owner, subscription_status, product_context
FROM organizations
ORDER BY created_at DESC;

-- QUERY 2: Check organization memberships
SELECT om.organization_id, o.name as org_name, o.is_platform_owner,
       om.user_id, u.email as user_email, om.is_active
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
WHERE om.is_active = true
ORDER BY om.created_at DESC;

-- QUERY 3: Check playlists
SELECT up.id, up.name, up.organization_id, up.user_id, up.is_public,
       o.name as org_name, u.email as user_email
FROM user_playlists up
LEFT JOIN organizations o ON o.id = up.organization_id
LEFT JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC;

-- QUERY 4: Check RLS policies
SELECT schemaname, tablename, policyname, cmd, qual
FROM pg_policies
WHERE tablename IN ('organizations', 'organization_members', 'user_playlists')
ORDER BY tablename, policyname;

-- QUERY 5: Find platform owner organization
SELECT id, name, slug, owner_id, is_platform_owner
FROM organizations
WHERE is_platform_owner = true;

-- QUERY 6: Check auth users (be careful with PII)
SELECT id, email, created_at
FROM auth.users
WHERE email LIKE '%@%' -- Only show users with email addresses
ORDER BY created_at DESC
LIMIT 20;