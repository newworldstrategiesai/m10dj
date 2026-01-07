-- Create dj_calls table for tracking all incoming calls from DJ Dash hosted pages
CREATE TABLE IF NOT EXISTS dj_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_profile_id UUID NOT NULL REFERENCES dj_profiles(id) ON DELETE CASCADE,
  virtual_number TEXT NOT NULL,
  caller_number TEXT NOT NULL,
  caller_name TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  page_url TEXT,
  event_type TEXT,
  lead_score TEXT DEFAULT 'hot' CHECK (lead_score IN ('hot', 'warm', 'cold')),
  is_booked BOOLEAN DEFAULT false,
  booking_id UUID,
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  call_duration_seconds INTEGER,
  call_status TEXT CHECK (call_status IN ('completed', 'no-answer', 'busy', 'failed', 'voicemail')),
  call_sid TEXT, -- Twilio Call SID
  tipjar_link_sent BOOLEAN DEFAULT false,
  tipjar_link TEXT,
  tipjar_payment_received BOOLEAN DEFAULT false,
  tipjar_payment_amount DECIMAL(10, 2),
  tipjar_payment_id TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_dj_calls_dj_profile_id ON dj_calls(dj_profile_id);
CREATE INDEX idx_dj_calls_timestamp ON dj_calls(timestamp DESC);
CREATE INDEX idx_dj_calls_product_context ON dj_calls(product_context);
CREATE INDEX idx_dj_calls_virtual_number ON dj_calls(virtual_number);
CREATE INDEX idx_dj_calls_caller_number ON dj_calls(caller_number);
CREATE INDEX idx_dj_calls_is_booked ON dj_calls(is_booked);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_dj_calls_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dj_calls_updated_at
  BEFORE UPDATE ON dj_calls
  FOR EACH ROW
  EXECUTE FUNCTION update_dj_calls_updated_at();

-- Enable RLS
ALTER TABLE dj_calls ENABLE ROW LEVEL SECURITY;

-- RLS Policy: DJs can view their own calls
CREATE POLICY "DJs can view their own calls"
  ON dj_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dj_profiles
      WHERE dj_profiles.id = dj_calls.dj_profile_id
      AND dj_profiles.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: System can insert calls (via service role)
CREATE POLICY "System can insert calls"
  ON dj_calls
  FOR INSERT
  WITH CHECK (true);

-- RLS Policy: System can update calls (via service role)
CREATE POLICY "System can update calls"
  ON dj_calls
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- RLS Policy: Admins can view all calls
CREATE POLICY "Admins can view all calls"
  ON dj_calls
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Create table for virtual phone numbers assigned to DJ profiles
CREATE TABLE IF NOT EXISTS dj_virtual_numbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dj_profile_id UUID NOT NULL REFERENCES dj_profiles(id) ON DELETE CASCADE,
  virtual_number TEXT NOT NULL UNIQUE,
  twilio_phone_number_sid TEXT NOT NULL,
  real_phone_number TEXT NOT NULL, -- DJ's actual phone number
  is_active BOOLEAN DEFAULT true,
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(dj_profile_id, product_context) -- One virtual number per DJ per product context
);

-- Create index
CREATE INDEX idx_dj_virtual_numbers_dj_profile_id ON dj_virtual_numbers(dj_profile_id);
CREATE INDEX idx_dj_virtual_numbers_virtual_number ON dj_virtual_numbers(virtual_number);
CREATE INDEX idx_dj_virtual_numbers_is_active ON dj_virtual_numbers(is_active);

-- Create updated_at trigger for virtual numbers
CREATE TRIGGER update_dj_virtual_numbers_updated_at
  BEFORE UPDATE ON dj_virtual_numbers
  FOR EACH ROW
  EXECUTE FUNCTION update_dj_calls_updated_at();

-- Enable RLS for virtual numbers
ALTER TABLE dj_virtual_numbers ENABLE ROW LEVEL SECURITY;

-- RLS Policy: DJs can view their own virtual numbers
CREATE POLICY "DJs can view their own virtual numbers"
  ON dj_virtual_numbers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM dj_profiles
      WHERE dj_profiles.id = dj_virtual_numbers.dj_profile_id
      AND dj_profiles.organization_id IN (
        SELECT organization_id FROM organization_members
        WHERE user_id = auth.uid()
      )
    )
  );

-- RLS Policy: System can manage virtual numbers
CREATE POLICY "System can manage virtual numbers"
  ON dj_virtual_numbers
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Add comment
COMMENT ON TABLE dj_calls IS 'Tracks all incoming phone calls from DJ Dash hosted pages for revenue capture and analytics';
COMMENT ON TABLE dj_virtual_numbers IS 'Maps virtual phone numbers to DJ profiles for call tracking';












