-- =====================================================
-- IDENTIFY AND MARK M10 DJ COMPANY AS PLATFORM OWNER
-- Run this AFTER running the migration
-- =====================================================

-- Step 1: Find M10 DJ Company organization
-- This will show you all organizations that might be M10 DJ Company
SELECT 
    id,
    name,
    slug,
    owner_id,
    subscription_tier,
    subscription_status,
    created_at
FROM organizations 
WHERE 
    name ILIKE '%m10%' 
    OR slug ILIKE '%m10%'
    OR name ILIKE '%memphis%'
ORDER BY created_at ASC;

-- Step 2: Mark M10 DJ Company as platform owner
-- M10 DJ Company ID: 2a10fa9f-c129-451d-bc4e-b669d42d521e
UPDATE organizations 
SET is_platform_owner = TRUE 
WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Step 3: Verify it worked
SELECT 
    id,
    name,
    slug,
    is_platform_owner,
    subscription_tier,
    subscription_status
FROM organizations 
WHERE is_platform_owner = TRUE;

-- Step 4: Check owner email (to confirm it's your account)
SELECT 
    o.id,
    o.name,
    o.slug,
    o.is_platform_owner,
    u.email as owner_email
FROM organizations o
JOIN auth.users u ON o.owner_id = u.id
WHERE o.is_platform_owner = TRUE;

-- Expected Result:
-- You should see M10 DJ Company with is_platform_owner = TRUE
-- Owner email should be djbenmurray@gmail.com or your admin email

