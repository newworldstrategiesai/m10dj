-- Delete unclaimed TipJar organizations for testing
-- This will delete organizations created for prospects that haven't been claimed yet
-- 
-- SAFETY: This only deletes unclaimed organizations (is_claimed = false)
-- and only TipJar organizations (product_context = 'tipjar')

-- Option 1: Delete all unclaimed TipJar organizations
-- Uncomment and run if you want to delete ALL unclaimed TipJar organizations
/*
DELETE FROM organizations
WHERE product_context = 'tipjar'
  AND is_claimed = false
  AND owner_id IS NULL;
*/

-- Option 2: Delete unclaimed organizations by specific email (RECOMMENDED)
-- Replace 'memphismillennial@gmail.com' with the email you want to test
DELETE FROM organizations
WHERE product_context = 'tipjar'
  AND is_claimed = false
  AND owner_id IS NULL
  AND prospect_email = 'memphismillennial@gmail.com';

-- Option 3: Delete unclaimed organizations created today (for testing)
-- Use this if you want to delete all unclaimed orgs created today
/*
DELETE FROM organizations
WHERE product_context = 'tipjar'
  AND is_claimed = false
  AND owner_id IS NULL
  AND created_at >= CURRENT_DATE;
*/

-- Option 4: Preview what will be deleted (run this first to see what will be deleted)
-- This shows the organizations that match the criteria without deleting them
/*
SELECT 
  id,
  name,
  slug,
  prospect_email,
  created_at,
  is_claimed,
  owner_id,
  product_context
FROM organizations
WHERE product_context = 'tipjar'
  AND is_claimed = false
  AND owner_id IS NULL
  AND prospect_email = 'memphismillennial@gmail.com';
*/

