-- Script to delete all crowd_requests for a test account
-- Usage: Run this in Supabase SQL Editor
-- Replace 'ben-spins' with your organization slug

-- STEP 1: First, verify which organization you're deleting for
-- This will show you the organization and how many requests exist
SELECT 
  o.id,
  o.name,
  o.slug,
  COUNT(cr.id) as request_count
FROM organizations o
LEFT JOIN crowd_requests cr ON cr.organization_id = o.id
WHERE o.slug = 'ben-spins'  -- Replace with your slug (e.g., 'ben-spins')
GROUP BY o.id, o.name, o.slug;

-- STEP 2: Verify the requests that will be deleted (optional - for safety)
-- This shows all requests that will be deleted
SELECT 
  id,
  request_type,
  song_title,
  song_artist,
  requester_name,
  requester_email,
  amount_paid,
  payment_status,
  created_at
FROM crowd_requests 
WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'ben-spins'  -- Replace with your slug
)
ORDER BY created_at DESC;

-- STEP 3: Delete all requests for your organization
-- WARNING: This will permanently delete all requests for the organization
-- Make sure you've verified with STEP 1 and STEP 2 above!
DELETE FROM crowd_requests 
WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'ben-spins'  -- Replace with your slug
);

-- STEP 4: Verify deletion was successful
-- Should return 0 after deletion
SELECT COUNT(*) as remaining_requests
FROM crowd_requests 
WHERE organization_id = (
  SELECT id FROM organizations WHERE slug = 'ben-spins'  -- Replace with your slug
);

