-- Check super admin organization setup using the user ID from sessions
-- User ID: aa23eed5-de23-4b28-bc5d-26e72077e7a8 (from recent sessions)

-- 1. Check if this user exists and get their email
SELECT id, email, created_at
FROM auth.users
WHERE id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- 2. Check if this user owns any organizations
SELECT o.id, o.name, o.slug, o.is_platform_owner, o.subscription_status
FROM organizations o
WHERE o.owner_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- 3. Check if this user is a member of any organizations
SELECT o.id, o.name, o.slug, o.is_platform_owner, om.is_active
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
WHERE om.user_id = 'aa23eed5-de23-4b28-bc5d-26e72077e7a8';

-- 4. Check what platform owner organization exists
SELECT id, name, slug, owner_id, is_platform_owner
FROM organizations
WHERE is_platform_owner = true;

-- 5. Check all organizations to see what's available
SELECT id, name, slug, owner_id, is_platform_owner, subscription_status
FROM organizations
ORDER BY created_at DESC;