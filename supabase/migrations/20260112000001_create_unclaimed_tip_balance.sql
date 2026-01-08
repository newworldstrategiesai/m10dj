-- Create table to track tips received before account claiming
-- This ensures we can transfer funds when account is claimed

-- ============================================
-- 1. Create unclaimed_tip_balance table
-- ============================================

CREATE TABLE IF NOT EXISTS unclaimed_tip_balance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Payment information (all amounts in cents)
  total_amount_cents INTEGER NOT NULL DEFAULT 0, -- Total tips received
  total_fees_cents INTEGER NOT NULL DEFAULT 0, -- Platform fees deducted
  net_amount_cents INTEGER NOT NULL DEFAULT 0, -- Amount available to claim (total - fees)
  
  -- Payment processing tracking
  stripe_payment_intent_ids TEXT[], -- Array of payment intent IDs
  stripe_charge_ids TEXT[], -- Array of charge IDs
  
  -- Status tracking
  is_transferred BOOLEAN DEFAULT FALSE,
  transferred_at TIMESTAMP WITH TIME ZONE,
  transferred_to_stripe_account_id TEXT, -- Connected account ID after claiming
  
  -- Metadata
  tip_count INTEGER DEFAULT 0, -- Number of individual tips
  first_tip_at TIMESTAMP WITH TIME ZONE,
  last_tip_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 2. Create indexes
-- ============================================

CREATE INDEX IF NOT EXISTS idx_unclaimed_tip_balance_org ON unclaimed_tip_balance(organization_id);
CREATE INDEX IF NOT EXISTS idx_unclaimed_tip_balance_transferred ON unclaimed_tip_balance(is_transferred);
CREATE INDEX IF NOT EXISTS idx_unclaimed_tip_balance_pending ON unclaimed_tip_balance(is_transferred, net_amount_cents) WHERE is_transferred = FALSE;

-- ============================================
-- 3. Create updated_at trigger
-- ============================================

CREATE OR REPLACE FUNCTION update_unclaimed_tip_balance_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_unclaimed_tip_balance_updated_at
  BEFORE UPDATE ON unclaimed_tip_balance
  FOR EACH ROW
  EXECUTE FUNCTION update_unclaimed_tip_balance_updated_at();

-- ============================================
-- 4. Enable RLS
-- ============================================

ALTER TABLE unclaimed_tip_balance ENABLE ROW LEVEL SECURITY;

-- Policy: Organization owners and platform admins can view tip balances
CREATE POLICY "Owners and admins can view tip balances"
  ON unclaimed_tip_balance
  FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() OR is_platform_admin()
    )
  );

-- Policy: Only platform admins and system can insert/update
-- Regular users cannot directly modify tip balances
-- Updates happen through payment webhooks and transfer APIs
CREATE POLICY "Admins and system can modify tip balances"
  ON unclaimed_tip_balance
  FOR ALL
  TO authenticated
  USING (is_platform_admin())
  WITH CHECK (is_platform_admin());

-- Allow service role to modify (for webhooks and automated processes)
CREATE POLICY "Service role can modify tip balances"
  ON unclaimed_tip_balance
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 5. Helper function to get or create tip balance
-- ============================================

CREATE OR REPLACE FUNCTION get_or_create_unclaimed_tip_balance(org_id UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance_id UUID;
BEGIN
  -- Try to get existing balance
  SELECT id INTO balance_id
  FROM unclaimed_tip_balance
  WHERE organization_id = org_id;
  
  -- If not found, create it
  IF balance_id IS NULL THEN
    INSERT INTO unclaimed_tip_balance (organization_id)
    VALUES (org_id)
    RETURNING id INTO balance_id;
  END IF;
  
  RETURN balance_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION get_or_create_unclaimed_tip_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION get_or_create_unclaimed_tip_balance(UUID) TO service_role;

-- ============================================
-- 6. Helper function to add tip to balance
-- ============================================

CREATE OR REPLACE FUNCTION add_tip_to_unclaimed_balance(
  org_id UUID,
  amount_cents INTEGER,
  fee_cents INTEGER,
  payment_intent_id TEXT,
  charge_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  balance_id UUID;
BEGIN
  -- Get or create balance record
  balance_id := get_or_create_unclaimed_tip_balance(org_id);
  
  -- Update balance
  UPDATE unclaimed_tip_balance
  SET 
    total_amount_cents = total_amount_cents + amount_cents,
    total_fees_cents = total_fees_cents + fee_cents,
    net_amount_cents = net_amount_cents + (amount_cents - fee_cents),
    tip_count = tip_count + 1,
    stripe_payment_intent_ids = COALESCE(stripe_payment_intent_ids, ARRAY[]::TEXT[]) || payment_intent_id,
    stripe_charge_ids = COALESCE(stripe_charge_ids, ARRAY[]::TEXT[]) || charge_id,
    first_tip_at = COALESCE(first_tip_at, NOW()),
    last_tip_at = NOW(),
    updated_at = NOW()
  WHERE id = balance_id;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION add_tip_to_unclaimed_balance(UUID, INTEGER, INTEGER, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION add_tip_to_unclaimed_tip_balance(UUID, INTEGER, INTEGER, TEXT, TEXT) TO service_role;

-- ============================================
-- 7. Comments
-- ============================================

COMMENT ON TABLE unclaimed_tip_balance IS 'Tracks tips received by unclaimed organizations. Funds are held until organization is claimed.';
COMMENT ON COLUMN unclaimed_tip_balance.organization_id IS 'Reference to unclaimed organization. Unique constraint ensures one balance per org.';
COMMENT ON COLUMN unclaimed_tip_balance.total_amount_cents IS 'Total amount of tips received in cents.';
COMMENT ON COLUMN unclaimed_tip_balance.total_fees_cents IS 'Total platform fees deducted in cents.';
COMMENT ON COLUMN unclaimed_tip_balance.net_amount_cents IS 'Net amount available to claim (total - fees) in cents.';
COMMENT ON COLUMN unclaimed_tip_balance.is_transferred IS 'Whether funds have been transferred to user''s Stripe Connect account.';
COMMENT ON COLUMN unclaimed_tip_balance.transferred_to_stripe_account_id IS 'Stripe Connect account ID funds were transferred to.';

