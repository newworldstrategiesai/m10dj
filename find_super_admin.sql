-- Find the super admin user and their expected organization access

-- Replace 'super-admin-email@example.com' with the actual super admin email

-- 1. Find the user
SELECT id, email, created_at
FROM auth.users
WHERE email = 'super-admin-email@example.com';

-- 2. Check if they own any organizations
SELECT o.id, o.name, o.slug, o.is_platform_owner, o.subscription_status
FROM organizations o
JOIN auth.users u ON u.id = o.owner_id
WHERE u.email = 'super-admin-email@example.com';

-- 3. Check if they're a member of any organizations
SELECT o.id, o.name, o.slug, o.is_platform_owner, om.is_active
FROM organization_members om
JOIN organizations o ON o.id = om.organization_id
JOIN auth.users u ON u.id = om.user_id
WHERE u.email = 'super-admin-email@example.com';

-- 4. If no organization found, check what the platform owner organization should be
SELECT id, name, slug, owner_id, is_platform_owner
FROM organizations
WHERE is_platform_owner = true
LIMIT 1;

-- 5. If platform owner exists, check if super admin should be a member
-- (Assuming the super admin email, find their user ID and check membership)
SELECT om.*
FROM organization_members om
WHERE om.organization_id = (
  SELECT id FROM organizations WHERE is_platform_owner = true LIMIT 1
)
AND om.user_id = (
  SELECT id FROM auth.users WHERE email = 'super-admin-email@example.com'
);