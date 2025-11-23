-- Create discount codes for M10 DJ Company
-- Run this in your Supabase SQL Editor

-- 0. Testing Code (100% off - for testing purposes only)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'FORFREE100',
  '100% Off - Testing Code (For testing purposes only)',
  'percentage',
  100,
  0, -- No minimum required
  NULL, -- Unlimited uses for testing
  NOW(),
  NULL, -- No expiration for testing
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  discount_value = 100,
  updated_at = NOW();

-- 1. Early Bird Discount (10% off for bookings made 6+ months in advance)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'EARLYBIRD10',
  '10% Off - Early Bird Discount for bookings 6+ months in advance',
  'percentage',
  10,
  1000, -- Minimum $1000 booking
  NULL, -- Unlimited uses
  NOW(),
  NULL, -- No expiration
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 2. Referral Discount ($100 off for referrals)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'REFER100',
  '$100 Off - Referral Discount',
  'fixed_amount',
  100,
  1500, -- Minimum $1500 booking
  NULL, -- Unlimited uses
  NOW(),
  NULL,
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 3. Weekend Warrior (15% off weekday events)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'WEEKDAY15',
  '15% Off - Weekday Event Discount',
  'percentage',
  15,
  800, -- Minimum $800 booking
  NULL,
  NOW(),
  NULL,
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 4. Holiday Special (20% off for holiday season events)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'HOLIDAY20',
  '20% Off - Holiday Season Special',
  'percentage',
  20,
  1000,
  50, -- Limited to 50 uses
  NOW(),
  '2025-12-31 23:59:59'::TIMESTAMPTZ, -- Expires end of 2025
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 5. Last Minute Special ($200 off for bookings within 30 days)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'LASTMINUTE200',
  '$200 Off - Last Minute Booking Special (within 30 days)',
  'fixed_amount',
  200,
  1200,
  NULL,
  NOW(),
  NULL,
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 6. Multi-Event Discount (25% off for booking 2+ events)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'MULTI25',
  '25% Off - Multi-Event Booking Discount',
  'percentage',
  25,
  2000, -- Minimum $2000 total
  20, -- Limited to 20 uses
  NOW(),
  NULL,
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 7. Student/Education Discount (15% off for school events)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'EDU15',
  '15% Off - Education/School Event Discount',
  'percentage',
  15,
  500,
  NULL,
  NOW(),
  NULL,
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- 8. Social Media Special (10% off for sharing on social media)
INSERT INTO discount_codes (
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  valid_from,
  valid_until,
  is_active,
  applies_to,
  service_types
) VALUES (
  'SHARE10',
  '10% Off - Social Media Share Discount',
  'percentage',
  10,
  1000,
  100, -- Limited to 100 uses
  NOW(),
  '2025-06-30 23:59:59'::TIMESTAMPTZ, -- Expires mid-2025
  true,
  'all',
  NULL
)
ON CONFLICT (code) DO UPDATE SET
  is_active = true,
  updated_at = NOW();

-- Verify all codes were created
SELECT 
  code,
  description,
  discount_type,
  discount_value,
  min_order_amount,
  max_uses,
  current_uses,
  is_active,
  valid_from,
  valid_until,
  applies_to,
  created_at
FROM discount_codes
WHERE code IN (
  'FORFREE100',
  'EARLYBIRD10',
  'REFER100',
  'WEEKDAY15',
  'HOLIDAY20',
  'LASTMINUTE200',
  'MULTI25',
  'EDU15',
  'SHARE10'
)
ORDER BY code;

