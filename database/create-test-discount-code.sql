-- Create 100% off test discount code for buyer simulations
-- Run this in your Supabase SQL Editor

INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  minimum_amount,
  maximum_discount,
  usage_limit,
  valid_from,
  valid_until,
  active,
  applicable_to
) VALUES (
  'TEST100',
  '100% Off - Test Code for Buyer Simulation',
  'percentage',
  100,
  0,
  NULL, -- No maximum discount cap
  NULL, -- Unlimited uses for testing
  NOW(),
  NULL, -- No expiration
  true,
  ARRAY['all']::TEXT[] -- Applies to all packages
)
ON CONFLICT (code) DO UPDATE SET
  active = true,
  discount_value = 100,
  updated_at = NOW()
RETURNING *;

-- Verify the code was created
SELECT 
  code,
  description,
  discount_type,
  discount_value,
  active,
  usage_count,
  usage_limit
FROM discount_codes
WHERE code = 'TEST100';

