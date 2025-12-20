-- Bidding War System for M10 DJ Company Requests
-- This migration creates the infrastructure for 30-minute bidding rounds
-- where users bid on song requests, and the highest bidder wins every 30 minutes

-- 1. Create bidding_rounds table
CREATE TABLE IF NOT EXISTS bidding_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL, -- Sequential round number per organization
  started_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL, -- 30 minutes after started_at
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  winning_request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL,
  winning_bid_amount INTEGER, -- In cents
  processed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
  -- Note: We'll enforce one active round per org via application logic
  -- PostgreSQL partial unique indexes don't work well with NULL values
);

-- 2. Create bid_history table
CREATE TABLE IF NOT EXISTS bid_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bidding_round_id UUID REFERENCES bidding_rounds(id) ON DELETE CASCADE NOT NULL,
  request_id UUID REFERENCES crowd_requests(id) ON DELETE CASCADE NOT NULL,
  bidder_name TEXT NOT NULL,
  bidder_email TEXT,
  bidder_phone TEXT,
  bid_amount INTEGER NOT NULL, -- In cents
  payment_intent_id TEXT, -- Stripe payment intent (held, not charged yet)
  payment_status TEXT DEFAULT 'pending' CHECK (payment_status IN ('pending', 'charged', 'refunded', 'failed')),
  is_winning_bid BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Index for fast lookups
  CONSTRAINT bid_amount_positive CHECK (bid_amount > 0)
);

-- 3. Add bidding fields to crowd_requests table
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'crowd_requests') THEN
    ALTER TABLE crowd_requests
      ADD COLUMN IF NOT EXISTS bidding_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS current_bid_amount INTEGER DEFAULT 0, -- In cents
      ADD COLUMN IF NOT EXISTS highest_bidder_name TEXT,
      ADD COLUMN IF NOT EXISTS highest_bidder_email TEXT,
      ADD COLUMN IF NOT EXISTS bidding_round_id UUID REFERENCES bidding_rounds(id) ON DELETE SET NULL,
      ADD COLUMN IF NOT EXISTS is_auction_winner BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS auction_won_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- 4. Add bidding_enabled to organizations table (admin setting)
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'organizations') THEN
    ALTER TABLE organizations
      ADD COLUMN IF NOT EXISTS requests_bidding_enabled BOOLEAN DEFAULT FALSE,
      ADD COLUMN IF NOT EXISTS requests_bidding_minimum_bid INTEGER DEFAULT 500; -- $5.00 in cents
  END IF;
END $$;

-- 5. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bidding_rounds_organization ON bidding_rounds(organization_id, status, ends_at);
CREATE INDEX IF NOT EXISTS idx_bidding_rounds_active ON bidding_rounds(status, ends_at) WHERE status = 'active';
-- Unique partial index to ensure only one active round per organization
CREATE UNIQUE INDEX IF NOT EXISTS idx_bidding_rounds_one_active_per_org 
  ON bidding_rounds(organization_id) 
  WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_bid_history_round ON bid_history(bidding_round_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bid_history_request ON bid_history(request_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bid_history_payment ON bid_history(payment_intent_id) WHERE payment_intent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_crowd_requests_bidding ON crowd_requests(bidding_round_id, current_bid_amount DESC) WHERE bidding_enabled = TRUE;

-- 6. Create updated_at trigger for bidding_rounds
CREATE OR REPLACE FUNCTION update_bidding_rounds_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_bidding_rounds_updated_at
  BEFORE UPDATE ON bidding_rounds
  FOR EACH ROW
  EXECUTE FUNCTION update_bidding_rounds_updated_at();

-- 7. Enable RLS on new tables
ALTER TABLE bidding_rounds ENABLE ROW LEVEL SECURITY;
ALTER TABLE bid_history ENABLE ROW LEVEL SECURITY;

-- 8. RLS Policies for bidding_rounds
-- Anyone can view active bidding rounds (public)
CREATE POLICY "Anyone can view active bidding rounds"
  ON bidding_rounds
  FOR SELECT
  TO anon, authenticated
  USING (status = 'active');

-- Admins can view all rounds
CREATE POLICY "Admins can view all bidding rounds"
  ON bidding_rounds
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = bidding_rounds.organization_id
      AND (
        organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('admin', 'owner')
        )
      )
    )
  );

-- Only system can create/update rounds (via service role)
CREATE POLICY "Service role can manage bidding rounds"
  ON bidding_rounds
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 9. RLS Policies for bid_history
-- Anyone can view bids for active rounds (public)
CREATE POLICY "Anyone can view bids for active rounds"
  ON bid_history
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bidding_rounds
      WHERE bidding_rounds.id = bid_history.bidding_round_id
      AND bidding_rounds.status = 'active'
    )
  );

-- Admins can view all bid history
CREATE POLICY "Admins can view all bid history"
  ON bid_history
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM bidding_rounds
      JOIN organizations ON organizations.id = bidding_rounds.organization_id
      WHERE bidding_rounds.id = bid_history.bidding_round_id
      AND (
        organizations.owner_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM organization_members
          WHERE organization_members.organization_id = organizations.id
          AND organization_members.user_id = auth.uid()
          AND organization_members.role IN ('admin', 'owner')
        )
      )
    )
  );

-- Anyone can insert bids (public)
CREATE POLICY "Anyone can place bids"
  ON bid_history
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM bidding_rounds
      WHERE bidding_rounds.id = bid_history.bidding_round_id
      AND bidding_rounds.status = 'active'
      AND bidding_rounds.ends_at > NOW()
    )
  );

-- Only system can update bid history (via service role)
CREATE POLICY "Service role can update bid history"
  ON bid_history
  FOR UPDATE
  TO service_role
  USING (true)
  WITH CHECK (true);

-- 10. Function to get current active bidding round for an organization
CREATE OR REPLACE FUNCTION get_active_bidding_round(p_organization_id UUID)
RETURNS TABLE (
  id UUID,
  organization_id UUID,
  round_number INTEGER,
  started_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  status TEXT,
  time_remaining_seconds INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    br.id,
    br.organization_id,
    br.round_number,
    br.started_at,
    br.ends_at,
    br.status,
    GREATEST(0, EXTRACT(EPOCH FROM (br.ends_at - NOW()))::INTEGER) as time_remaining_seconds
  FROM bidding_rounds br
  WHERE br.organization_id = p_organization_id
    AND br.status = 'active'
    AND br.ends_at > NOW()
  ORDER BY br.started_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Function to get highest bid for a request in a round
CREATE OR REPLACE FUNCTION get_highest_bid(p_request_id UUID, p_round_id UUID)
RETURNS TABLE (
  bid_amount INTEGER,
  bidder_name TEXT,
  bidder_email TEXT,
  created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    bh.bid_amount,
    bh.bidder_name,
    bh.bidder_email,
    bh.created_at
  FROM bid_history bh
  WHERE bh.request_id = p_request_id
    AND bh.bidding_round_id = p_round_id
  ORDER BY bh.bid_amount DESC, bh.created_at ASC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add comment documentation
COMMENT ON TABLE bidding_rounds IS 'Tracks 30-minute bidding rounds for song requests';
COMMENT ON TABLE bid_history IS 'Tracks all bids placed during bidding rounds';
COMMENT ON COLUMN crowd_requests.bidding_enabled IS 'Whether this request is part of a bidding round';
COMMENT ON COLUMN crowd_requests.current_bid_amount IS 'Current highest bid amount in cents';
COMMENT ON COLUMN organizations.requests_bidding_enabled IS 'Admin setting to enable bidding war feature for this organization';

