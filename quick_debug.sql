-- Quick check for super admin organization access
-- Replace 'your-email@example.com' with the actual super admin email

SELECT
  '=== ORGANIZATIONS ===' as section,
  id,
  name,
  slug,
  owner_id,
  is_platform_owner,
  subscription_status
FROM organizations
WHERE is_platform_owner = true OR owner_id IN (
  SELECT id FROM auth.users WHERE email = 'your-email@example.com'
)

UNION ALL

SELECT
  '=== USER DETAILS ===' as section,
  u.id,
  u.email,
  CASE WHEN o.id IS NOT NULL THEN 'OWNER' ELSE 'MEMBER' END as relationship,
  COALESCE(o.name, mo.name) as org_name,
  COALESCE(o.is_platform_owner, mo.is_platform_owner) as is_platform_owner
FROM auth.users u
LEFT JOIN organizations o ON o.owner_id = u.id
LEFT JOIN organization_members om ON om.user_id = u.id AND om.is_active = true
LEFT JOIN organizations mo ON mo.id = om.organization_id
WHERE u.email = 'your-email@example.com'

UNION ALL

SELECT
  '=== MEMBERSHIPS ===' as section,
  om.id,
  u.email,
  o.name as org_name,
  om.is_active,
  o.is_platform_owner
FROM organization_members om
JOIN auth.users u ON u.id = om.user_id
JOIN organizations o ON o.id = om.organization_id
WHERE u.email = 'your-email@example.com';