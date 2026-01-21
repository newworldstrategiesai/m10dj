-- Check playlists data and related information

-- 1. Check if user_playlists table exists and has data
SELECT COUNT(*) as total_playlists FROM user_playlists;

-- 2. Check playlists for the super admin user
SELECT
    up.id,
    up.name,
    up.description,
    up.organization_id,
    up.user_id,
    up.is_public,
    up.video_ids,
    up.created_at,
    o.name as org_name,
    o.is_platform_owner
FROM user_playlists up
LEFT JOIN organizations o ON o.id = up.organization_id
WHERE up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
ORDER BY up.created_at DESC;

-- 3. Check all playlists in the system
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
ORDER BY up.created_at DESC
LIMIT 20;

-- 4. Check RLS policies for user_playlists
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_playlists'
ORDER BY policyname;