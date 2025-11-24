-- Add Stripe Connect fields to organizations table
-- This enables platform payments with automatic payouts

-- Add Stripe Connect account fields
ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS stripe_connect_account_id TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_complete BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarding_url TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_charges_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_payouts_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_connect_details_submitted BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS platform_fee_percentage DECIMAL(5,2) DEFAULT 3.50,
ADD COLUMN IF NOT EXISTS platform_fee_fixed DECIMAL(10,2) DEFAULT 0.30;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_connect_account_id ON organizations(stripe_connect_account_id);

-- Add comments
COMMENT ON COLUMN organizations.stripe_connect_account_id IS 'Stripe Connect Express account ID for this organization. Used for platform payments with automatic payouts.';
COMMENT ON COLUMN organizations.stripe_connect_onboarding_complete IS 'Whether the Stripe Connect onboarding process is complete.';
COMMENT ON COLUMN organizations.stripe_connect_charges_enabled IS 'Whether this account can accept charges (from Stripe).';
COMMENT ON COLUMN organizations.stripe_connect_payouts_enabled IS 'Whether this account can receive payouts (from Stripe).';
COMMENT ON COLUMN organizations.platform_fee_percentage IS 'Platform fee percentage (e.g., 3.50 for 3.5%). Default: 3.5%';
COMMENT ON COLUMN organizations.platform_fee_fixed IS 'Fixed platform fee amount in dollars (e.g., 0.30 for $0.30). Default: $0.30';

