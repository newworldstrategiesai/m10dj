-- ============================================
-- Cleanup Test/Fake Requests from Bidding System
-- ============================================
-- Run these queries in Supabase SQL Editor to remove test requests

-- OPTION 1: View all requests in bidding rounds (to identify test ones)
-- ============================================
SELECT 
  cr.id,
  cr.song_title,
  cr.song_artist,
  cr.requester_name,
  cr.requester_email,
  cr.requester_phone,
  cr.current_bid_amount,
  cr.created_at,
  cr.bidding_round_id,
  br.round_number,
  br.status as round_status
FROM crowd_requests cr
LEFT JOIN bidding_rounds br ON cr.bidding_round_id = br.id
WHERE cr.bidding_round_id IS NOT NULL
ORDER BY cr.created_at DESC;

-- OPTION 2: Delete requests from a specific time period (e.g., last hour)
-- ============================================
-- WARNING: This will delete ALL requests created in the last hour
-- Adjust the time period as needed
DELETE FROM bid_history 
WHERE request_id IN (
  SELECT id FROM crowd_requests 
  WHERE created_at > NOW() - INTERVAL '1 hour'
  AND bidding_round_id IS NOT NULL
);

DELETE FROM crowd_requests 
WHERE created_at > NOW() - INTERVAL '1 hour'
AND bidding_round_id IS NOT NULL;

-- OPTION 3: Delete requests by requester name/email (if you know the test data)
-- ============================================
-- Replace 'Test User' or 'test@example.com' with your actual test data
DELETE FROM bid_history 
WHERE request_id IN (
  SELECT id FROM crowd_requests 
  WHERE (
    requester_name ILIKE '%test%' 
    OR requester_email ILIKE '%test%'
    OR requester_name ILIKE '%fake%'
    OR requester_email ILIKE '%fake%'
  )
  AND bidding_round_id IS NOT NULL
);

DELETE FROM crowd_requests 
WHERE (
  requester_name ILIKE '%test%' 
  OR requester_email ILIKE '%test%'
  OR requester_name ILIKE '%fake%'
  OR requester_email ILIKE '%fake%'
)
AND bidding_round_id IS NOT NULL;

-- OPTION 4: Delete ALL requests in active bidding rounds (nuclear option)
-- ============================================
-- WARNING: This deletes ALL requests currently in bidding rounds
-- Use with extreme caution!
DELETE FROM bid_history 
WHERE request_id IN (
  SELECT id FROM crowd_requests 
  WHERE bidding_round_id IS NOT NULL
);

DELETE FROM crowd_requests 
WHERE bidding_round_id IS NOT NULL;

-- OPTION 5: Delete specific request by ID (safest option)
-- ============================================
-- First, find the request ID using OPTION 1 above
-- Then replace 'YOUR_REQUEST_ID_HERE' with the actual ID
DELETE FROM bid_history 
WHERE request_id = 'YOUR_REQUEST_ID_HERE';

DELETE FROM crowd_requests 
WHERE id = 'YOUR_REQUEST_ID_HERE';

-- OPTION 6: Delete requests from a specific organization (if you know the org ID)
-- ============================================
-- Replace 'YOUR_ORG_ID_HERE' with your organization ID
DELETE FROM bid_history 
WHERE request_id IN (
  SELECT cr.id FROM crowd_requests cr
  JOIN bidding_rounds br ON cr.bidding_round_id = br.id
  WHERE br.organization_id = 'YOUR_ORG_ID_HERE'
  AND cr.created_at > NOW() - INTERVAL '24 hours'  -- Adjust time as needed
);

DELETE FROM crowd_requests 
WHERE id IN (
  SELECT cr.id FROM crowd_requests cr
  JOIN bidding_rounds br ON cr.bidding_round_id = br.id
  WHERE br.organization_id = 'YOUR_ORG_ID_HERE'
  AND cr.created_at > NOW() - INTERVAL '24 hours'  -- Adjust time as needed
);

-- ============================================
-- VERIFICATION QUERIES (Run after deletion)
-- ============================================

-- Check remaining requests in bidding rounds
SELECT COUNT(*) as remaining_requests
FROM crowd_requests 
WHERE bidding_round_id IS NOT NULL;

-- Check active bidding rounds
SELECT 
  id,
  round_number,
  status,
  started_at,
  ends_at,
  organization_id
FROM bidding_rounds
WHERE status = 'active'
ORDER BY started_at DESC;

-- Check if any bid history remains
SELECT COUNT(*) as remaining_bids
FROM bid_history;

