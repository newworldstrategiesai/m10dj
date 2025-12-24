-- Add starting_bid field to organizations table
-- This is the default initial bid amount that should never be $0
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS requests_bidding_starting_bid INTEGER DEFAULT 500; -- $5.00 in cents
    
    COMMENT ON COLUMN organizations.requests_bidding_starting_bid IS 'Default starting bid amount for new bidding rounds (in cents). This ensures bids never start at $0.';
  END IF;
END $$;

