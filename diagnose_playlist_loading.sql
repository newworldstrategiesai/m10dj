-- Comprehensive diagnosis of playlist loading issue

-- 1. Check organization details
SELECT
    o.id,
    o.name,
    o.subscription_status,
    o.subscription_tier,
    o.product_context,
    o.is_platform_owner,
    o.trial_ends_at,
    CASE
        WHEN o.subscription_status = 'active' THEN 'ACTIVE'
        WHEN o.subscription_status = 'trial' AND o.trial_ends_at > NOW() THEN 'TRIAL_VALID'
        WHEN o.subscription_status = 'trial' AND o.trial_ends_at <= NOW() THEN 'TRIAL_EXPIRED'
        ELSE 'INACTIVE'
    END as access_status
FROM organizations o
WHERE o.id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- 2. Check playlists for this organization
SELECT
    up.id,
    up.name,
    up.user_id,
    up.is_public,
    up.created_at,
    u.email as creator_email
FROM user_playlists up
LEFT JOIN auth.users u ON u.id = up.user_id
WHERE up.organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e'
ORDER BY up.created_at DESC;

-- 3. Test the exact query that the frontend uses
-- This simulates what loadPlaylists() does
SELECT
    id,
    name,
    description,
    video_ids,
    is_public,
    created_at,
    updated_at
FROM user_playlists
WHERE organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e'
  AND user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
ORDER BY created_at DESC;

-- 4. Check RLS policies that might be blocking
SELECT
    schemaname,
    tablename,
    policyname,
    cmd,
    qual
FROM pg_policies
WHERE tablename = 'user_playlists';

-- 5. Test RLS policy manually (simulate what happens)
-- This should return playlists if RLS allows access
SELECT COUNT(*) as visible_playlists
FROM user_playlists
WHERE organization_id IN (
    SELECT organization_id
    FROM organization_members
    WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
    AND is_active = true
) OR user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';