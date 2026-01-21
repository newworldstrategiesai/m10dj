-- Check the organization the super admin belongs to
SELECT o.id, o.name, o.slug, o.owner_id, o.is_platform_owner,
       o.subscription_tier, o.subscription_status, o.product_context,
       o.created_at
FROM organizations o
WHERE o.id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Check if there are any playlists for this organization
SELECT COUNT(*) as playlist_count
FROM user_playlists
WHERE organization_id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Check playlists for this user specifically
SELECT up.id, up.name, up.description, up.is_public, up.created_at
FROM user_playlists up
WHERE up.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- Check all playlists in the system
SELECT COUNT(*) as total_playlists FROM user_playlists;