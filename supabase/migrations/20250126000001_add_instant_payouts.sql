-- Add instant payout fields to organizations table
-- This enables users to opt-in to instant payouts (with fee)

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS instant_payout_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS instant_payout_fee_percentage DECIMAL(5,2) DEFAULT 1.00;

-- Add comments
COMMENT ON COLUMN organizations.instant_payout_enabled IS 'Whether this organization has instant payouts enabled (1% fee, minimum $0.50). Default: false (standard 2-7 day payouts).';
COMMENT ON COLUMN organizations.instant_payout_fee_percentage IS 'Instant payout fee percentage (default: 1.00 for 1%). This fee is charged on top of platform fees.';

