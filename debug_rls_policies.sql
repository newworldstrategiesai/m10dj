-- Debug RLS policies for user_playlists
-- Why can the super admin see 0 playlists when there are 9 total?

-- 1. Check the RLS policies
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_playlists'
ORDER BY policyname;

-- 2. Test the RLS policy conditions manually
-- Check what organizations the super admin has access to
SELECT
    'Organizations user has access to:' as info,
    o.id,
    o.name,
    o.is_platform_owner,
    CASE
        WHEN o.owner_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'OWNER'
        WHEN om.user_id IS NOT NULL THEN 'MEMBER'
        ELSE 'NO_ACCESS'
    END as access_type
FROM organizations o
LEFT JOIN organization_members om ON om.organization_id = o.id
    AND om.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
    AND om.is_active = true;

-- 3. Test the exact RLS policy query
-- This simulates: organization_id IN (SELECT organization_id FROM organization_members WHERE user_id = ? AND is_active = true) OR user_id = ?
SELECT
    up.id,
    up.name,
    up.organization_id,
    up.user_id,
    up.is_public,
    CASE
        WHEN up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'OWNED_BY_USER'
        WHEN up.organization_id IN (
            SELECT organization_id FROM organization_members
            WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' AND is_active = true
        ) THEN 'ORG_ACCESS'
        ELSE 'NO_ACCESS'
    END as access_reason
FROM user_playlists up
ORDER BY up.created_at DESC;

-- 4. Check organization membership details
SELECT
    om.organization_id,
    o.name as org_name,
    om.user_id,
    om.is_active,
    om.created_at
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';