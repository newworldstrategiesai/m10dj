-- Complete fix for super admin playlist access issue

-- Step 1: Move all playlists to super admin's organization
-- This gives super admin access to all existing playlists
UPDATE user_playlists
SET organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e'
WHERE organization_id != '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Step 2: Verify the fix
SELECT
    'BEFORE fix - super admin could see:' as status,
    COUNT(*) as visible_playlists
FROM user_playlists
WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
   OR organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Step 3: Show all playlists with access status
SELECT
    up.id,
    up.name,
    up.organization_id,
    up.user_id,
    up.is_public,
    CASE
        WHEN up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'OWNED_BY_SUPER_ADMIN'
        WHEN up.organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e' THEN 'IN_SUPER_ADMIN_ORG'
        ELSE 'NO_ACCESS'
    END as access_status,
    u.email as creator_email
FROM user_playlists up
LEFT JOIN auth.users u ON u.id = up.user_id
ORDER BY up.created_at DESC;

-- Step 4: Confirm total playlists
SELECT
    COUNT(*) as total_playlists,
    COUNT(CASE WHEN user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 1 END) as owned_by_super_admin,
    COUNT(CASE WHEN organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e' THEN 1 END) as in_super_admin_org
FROM user_playlists;