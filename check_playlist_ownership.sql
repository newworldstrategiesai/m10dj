-- Check who owns the playlists and why super admin can't see them

-- Super admin details
-- User ID: aa23eed5-de23-4b28-bc5d-26e72077e7a8
-- Organization ID: 2a10fa9f-c129-451d-bc4e-b669d42d521e

-- 1. Check all playlists with ownership details
SELECT
    up.id,
    up.name,
    up.organization_id,
    up.user_id,
    up.is_public,
    up.created_at,
    -- Check if super admin owns this playlist
    CASE WHEN up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'OWNED' ELSE 'NOT_OWNED' END as ownership,
    -- Check if playlist belongs to super admin's organization
    CASE WHEN up.organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e' THEN 'SAME_ORG' ELSE 'DIFFERENT_ORG' END as org_match,
    -- Creator details
    u.email as creator_email,
    o.name as playlist_org_name
FROM user_playlists up
LEFT JOIN auth.users u ON u.id = up.user_id
LEFT JOIN organizations o ON o.id = up.organization_id
ORDER BY up.created_at DESC;

-- 2. Check what organizations exist and who owns them
SELECT
    o.id,
    o.name,
    o.owner_id,
    CASE WHEN o.owner_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'SUPER_ADMIN_OWNED' ELSE 'OTHER_OWNED' END as ownership,
    u.email as owner_email
FROM organizations o
LEFT JOIN auth.users u ON u.id = o.owner_id
ORDER BY o.created_at DESC;

-- 3. Test RLS policy manually - what should super admin see?
-- According to policy: user_id = auth.uid() OR organization_id IN (user's orgs)
SELECT
    'What super admin SHOULD see:' as test,
    up.id,
    up.name,
    CASE
        WHEN up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8' THEN 'OWNED_BY_USER'
        WHEN up.organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e' THEN 'USER_ORG_ACCESS'
        ELSE 'NO_ACCESS'
    END as access_reason
FROM user_playlists up
WHERE up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
   OR up.organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';