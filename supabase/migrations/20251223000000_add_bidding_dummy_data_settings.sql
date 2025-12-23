-- Add bidding dummy data control settings to organizations table
-- Allows admins to control whether and how aggressively dummy data is shown

ALTER TABLE organizations
  ADD COLUMN IF NOT EXISTS bidding_dummy_data_enabled BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS bidding_dummy_data_aggressiveness VARCHAR(20) DEFAULT 'medium' 
    CHECK (bidding_dummy_data_aggressiveness IN ('none', 'low', 'medium', 'high')),
  ADD COLUMN IF NOT EXISTS bidding_dummy_data_max_bid_multiplier DECIMAL(3,2) DEFAULT 1.5 
    CHECK (bidding_dummy_data_max_bid_multiplier >= 1.0 AND bidding_dummy_data_max_bid_multiplier <= 5.0),
  ADD COLUMN IF NOT EXISTS bidding_dummy_data_frequency_multiplier DECIMAL(3,2) DEFAULT 1.0 
    CHECK (bidding_dummy_data_frequency_multiplier >= 0.1 AND bidding_dummy_data_frequency_multiplier <= 3.0),
  ADD COLUMN IF NOT EXISTS bidding_dummy_data_scale_with_real_activity BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN organizations.bidding_dummy_data_enabled IS 
  'Whether to show dummy/fake data to create urgency. When disabled, only real bids/activity are shown.';
COMMENT ON COLUMN organizations.bidding_dummy_data_aggressiveness IS 
  'How aggressively dummy data is shown: none (disabled), low (subtle), medium (balanced), high (very visible)';
COMMENT ON COLUMN organizations.bidding_dummy_data_max_bid_multiplier IS 
  'Maximum multiplier for dummy bid amounts relative to current winning bid (1.0 = same, 1.5 = 50% higher, 2.0 = double)';
COMMENT ON COLUMN organizations.bidding_dummy_data_frequency_multiplier IS 
  'Multiplier for how often dummy data appears (0.5 = half as often, 1.0 = normal, 2.0 = twice as often)';
COMMENT ON COLUMN organizations.bidding_dummy_data_scale_with_real_activity IS 
  'If true, automatically reduce dummy data when real bids/activity exist. Prevents artificially inflating bids.';

-- Set defaults for existing organizations
UPDATE organizations
SET 
  bidding_dummy_data_enabled = TRUE,
  bidding_dummy_data_aggressiveness = 'medium',
  bidding_dummy_data_max_bid_multiplier = 1.5,
  bidding_dummy_data_frequency_multiplier = 1.0,
  bidding_dummy_data_scale_with_real_activity = TRUE
WHERE bidding_dummy_data_enabled IS NULL;

