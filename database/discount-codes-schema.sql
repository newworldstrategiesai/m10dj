-- Create discount_codes table
CREATE TABLE IF NOT EXISTS discount_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT NOT NULL UNIQUE,
  description TEXT,
  discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value NUMERIC(10, 2) NOT NULL CHECK (discount_value > 0),
  minimum_amount NUMERIC(10, 2) DEFAULT 0,
  maximum_discount NUMERIC(10, 2), -- For percentage discounts, cap the max discount amount
  usage_limit INTEGER, -- Total number of times this code can be used (NULL = unlimited)
  usage_count INTEGER DEFAULT 0, -- Current usage count
  valid_from TIMESTAMPTZ DEFAULT NOW(),
  valid_until TIMESTAMPTZ, -- NULL = no expiration
  active BOOLEAN DEFAULT true,
  applicable_to TEXT[] DEFAULT ARRAY[]::TEXT[], -- Package IDs or 'all' for all packages
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add active column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'discount_codes' AND column_name = 'active'
  ) THEN
    ALTER TABLE discount_codes ADD COLUMN active BOOLEAN DEFAULT true;
  END IF;
END $$;

-- Create index on code for fast lookups
CREATE INDEX IF NOT EXISTS idx_discount_codes_code ON discount_codes(code);
CREATE INDEX IF NOT EXISTS idx_discount_codes_active ON discount_codes(active, valid_from, valid_until);

-- Create discount_code_usage table to track which leads/customers used which codes
CREATE TABLE IF NOT EXISTS discount_code_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discount_code_id UUID NOT NULL REFERENCES discount_codes(id) ON DELETE CASCADE,
  lead_id UUID NOT NULL, -- References contacts.id
  quote_id UUID, -- References quote_selections.id (optional)
  discount_amount NUMERIC(10, 2) NOT NULL,
  original_amount NUMERIC(10, 2) NOT NULL,
  final_amount NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_lead FOREIGN KEY (lead_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Create index on lead_id for tracking usage per customer
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_lead_id ON discount_code_usage(lead_id);
CREATE INDEX IF NOT EXISTS idx_discount_code_usage_code_id ON discount_code_usage(discount_code_id);

-- Enable Row Level Security
ALTER TABLE discount_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE discount_code_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Service role can manage all discount codes
DROP POLICY IF EXISTS "Service role can manage discount_codes" ON discount_codes;
CREATE POLICY "Service role can manage discount_codes" ON discount_codes
  FOR ALL
  USING (auth.role() = 'service_role');

-- Policy: Service role can manage discount code usage
DROP POLICY IF EXISTS "Service role can manage discount_code_usage" ON discount_code_usage;
CREATE POLICY "Service role can manage discount_code_usage" ON discount_code_usage
  FOR ALL
  USING (auth.role() = 'service_role');

-- Add discount_code and discount_amount columns to quote_selections table
ALTER TABLE quote_selections 
ADD COLUMN IF NOT EXISTS discount_code TEXT,
ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10, 2) DEFAULT 0;

-- Add comment
COMMENT ON TABLE discount_codes IS 'Stores discount/promotion codes for quotes and payments';
COMMENT ON TABLE discount_code_usage IS 'Tracks usage of discount codes by customers';

