-- Add payment amount settings to organizations table
-- This allows each organization to customize their tip/payment amounts

-- Minimum tip amount (in cents)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_minimum_amount INTEGER DEFAULT 1000;

-- Preset amounts as JSON array of cents values, e.g. [1000, 1500, 2000, 2500]
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_preset_amounts JSONB DEFAULT '[1000, 1500, 2000, 2500]';

-- Sort order for preset amounts: 'desc' (highest first) or 'asc' (lowest first)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_amounts_sort_order TEXT DEFAULT 'desc';

COMMENT ON COLUMN organizations.requests_minimum_amount IS 'Minimum tip/payment amount in cents. Default $10.00 (1000 cents)';
COMMENT ON COLUMN organizations.requests_preset_amounts IS 'JSON array of preset payment amounts in cents, e.g. [1000, 1500, 2000, 2500]';
COMMENT ON COLUMN organizations.requests_amounts_sort_order IS 'Sort order for preset amounts: desc (highest first) or asc (lowest first)';

