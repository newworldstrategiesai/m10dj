-- Test query to check if a Tip Jar organization was created
-- Run this in Supabase SQL Editor after attempting to create a page

-- 1. Check most recent organizations (last 10, ordered by creation time)
SELECT 
  id,
  name,
  slug,
  prospect_email,
  is_claimed,
  owner_id,
  product_context,
  created_at,
  created_by_admin_id,
  claim_token IS NOT NULL as has_claim_token,
  subscription_status
FROM organizations
WHERE product_context = 'tipjar'
ORDER BY created_at DESC
LIMIT 10;

-- 2. Check specifically for unclaimed organizations created today
SELECT 
  id,
  name,
  slug,
  prospect_email,
  is_claimed,
  owner_id,
  product_context,
  created_at,
  created_by_admin_id,
  claim_token IS NOT NULL as has_claim_token,
  subscription_status,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM organizations
WHERE 
  product_context = 'tipjar'
  AND is_claimed = false
  AND created_at >= NOW() - INTERVAL '1 day'
ORDER BY created_at DESC;

-- 3. Check for organizations created in the last hour
SELECT 
  id,
  name,
  slug,
  prospect_email,
  is_claimed,
  owner_id,
  created_at,
  claim_token IS NOT NULL as has_claim_token,
  claim_token_expires_at,
  EXTRACT(EPOCH FROM (NOW() - created_at))/60 as minutes_ago
FROM organizations
WHERE 
  product_context = 'tipjar'
  AND created_at >= NOW() - INTERVAL '1 hour'
ORDER BY created_at DESC;

-- 4. Detailed view with all batch creation fields
SELECT 
  id,
  name,
  slug,
  artist_name,
  prospect_email,
  prospect_phone,
  is_claimed,
  owner_id,
  created_at,
  created_by_admin_id,
  claim_token IS NOT NULL as has_claim_token,
  claim_token_expires_at,
  claimed_at,
  subscription_status,
  subscription_tier,
  product_context
FROM organizations
WHERE 
  product_context = 'tipjar'
  AND (is_claimed = false OR created_at >= NOW() - INTERVAL '1 day')
ORDER BY created_at DESC
LIMIT 20;

