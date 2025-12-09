-- =====================================================
-- MARK M10 DJ COMPANY AS PLATFORM OWNER
-- Run this AFTER running the migration: 20250130000000_add_platform_owner_flag.sql
-- =====================================================

-- Step 1: Verify the organization exists
SELECT 
    id,
    name,
    slug,
    owner_id,
    subscription_tier,
    subscription_status,
    is_platform_owner,
    created_at
FROM organizations 
WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Step 2: Mark M10 DJ Company as platform owner
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
    subscription_status,
    '✅ M10 DJ Company is now protected as platform owner' as status
FROM organizations 
WHERE id = '2a10fa9f-c129-451d-bc4e-b669d42d521e';

-- Expected Result:
-- is_platform_owner should be TRUE
-- This ensures M10 DJ Company bypasses all subscription restrictions

