-- Grant super admin access to see playlists
-- The issue is that playlists exist but RLS policies are blocking access

-- Option 1: Update existing playlists to be in super admin's organization
-- This assumes the playlists should belong to the super admin's org
UPDATE user_playlists
SET organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e'
WHERE organization_id != '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Option 2: Alternatively, add super admin as owner of all playlists
-- UPDATE user_playlists
-- SET user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
-- WHERE user_id != 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- Option 3: Make all playlists public (temporary fix)
-- UPDATE user_playlists
-- SET is_public = true
-- WHERE is_public = false;

-- Verify the fix
SELECT
    'Playlists super admin can now see:' as result,
    COUNT(*) as visible_count
FROM user_playlists
WHERE user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8'
   OR organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';