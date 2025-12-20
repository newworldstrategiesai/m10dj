-- Call Tracking & Attribution System
-- Dynamic Number Insertion (DNI) for DJ Dash
-- Tracks calls and attributes to DJs, cities, and leads

-- ============================================
-- 1. CALL_LEADS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS call_leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Call Details
  virtual_number TEXT NOT NULL, -- Twilio number that received call
  caller_number_hash TEXT, -- Hashed caller number for privacy
  call_duration_seconds INTEGER DEFAULT 0,
  call_started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  call_ended_at TIMESTAMP WITH TIME ZONE,
  
  -- Attribution
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE SET NULL,
  lead_id UUID REFERENCES leads(id) ON DELETE SET NULL,
  city TEXT,
  state TEXT,
  
  -- Call Quality
  call_status TEXT CHECK (call_status IN ('completed', 'no_answer', 'busy', 'failed', 'voicemail')),
  recording_url TEXT, -- Twilio recording URL (if enabled)
  transcription_text TEXT, -- Call transcription (if enabled)
  
  -- Conversion Tracking
  converted_to_booking BOOLEAN DEFAULT FALSE,
  booking_id UUID, -- Link to booking/contact if converted
  conversion_value DECIMAL(10,2), -- Booking value
  
  -- Source Tracking
  source_page TEXT, -- Which page generated the call
  utm_campaign TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_leads_dj_profile_id ON call_leads(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_call_leads_lead_id ON call_leads(lead_id);
CREATE INDEX IF NOT EXISTS idx_call_leads_city ON call_leads(city, state);
CREATE INDEX IF NOT EXISTS idx_call_leads_call_started_at ON call_leads(call_started_at DESC);
CREATE INDEX IF NOT EXISTS idx_call_leads_converted ON call_leads(converted_to_booking, conversion_value);
CREATE INDEX IF NOT EXISTS idx_call_leads_virtual_number ON call_leads(virtual_number);
CREATE INDEX IF NOT EXISTS idx_call_leads_product_context ON call_leads(product_context);

-- Composite index for attribution queries
CREATE INDEX IF NOT EXISTS idx_call_leads_attribution ON call_leads(dj_profile_id, city, call_started_at DESC, converted_to_booking) 
  WHERE product_context = 'djdash';

COMMENT ON TABLE call_leads IS 'Tracks inbound calls via DNI, attributes to DJs and leads';
COMMENT ON COLUMN call_leads.caller_number_hash IS 'Hashed caller number for privacy compliance';
COMMENT ON COLUMN call_leads.virtual_number IS 'Twilio virtual number that received the call';

-- ============================================
-- 2. DJ_VIRTUAL_NUMBERS TABLE
-- ============================================
-- Note: dj_virtual_numbers table already exists, we're just ensuring it has routing fields
-- Add any missing columns if needed
ALTER TABLE dj_virtual_numbers
  ADD COLUMN IF NOT EXISTS call_recording_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS transcription_enabled BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS rotation_weight INTEGER DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_calls INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_call_at TIMESTAMP WITH TIME ZONE;

-- Indexes for existing dj_virtual_numbers (add if missing)
CREATE INDEX IF NOT EXISTS idx_dj_virtual_numbers_dj_profile_id ON dj_virtual_numbers(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_virtual_numbers_virtual_number ON dj_virtual_numbers(virtual_number);
CREATE INDEX IF NOT EXISTS idx_dj_virtual_numbers_active ON dj_virtual_numbers(is_active) WHERE is_active = TRUE;

COMMENT ON TABLE dj_virtual_numbers IS 'Maps DJ profiles to Twilio virtual numbers for DNI';

-- ============================================
-- 3. RLS POLICIES
-- ============================================
ALTER TABLE call_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_virtual_numbers ENABLE ROW LEVEL SECURITY;

-- DJs can view own call leads
CREATE POLICY "DJs can view own call leads"
  ON call_leads FOR SELECT
  TO authenticated
  USING (
    dj_profile_id IN (
      SELECT id FROM dj_profiles
      WHERE organization_id IN (
        SELECT id FROM organizations
        WHERE owner_id = auth.uid()
        AND product_context = 'djdash'
      )
    )
  );

-- DJs can view own virtual numbers (if RLS not already enabled)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public'
    AND tablename = 'dj_virtual_numbers' 
    AND policyname = 'DJs can view own virtual numbers'
  ) THEN
    CREATE POLICY "DJs can view own virtual numbers"
      ON dj_virtual_numbers FOR SELECT
      TO authenticated
      USING (
        dj_profile_id IN (
          SELECT id FROM dj_profiles
          WHERE organization_id IN (
            SELECT id FROM organizations
            WHERE owner_id = auth.uid()
            AND product_context = 'djdash'
          )
        )
      );
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- Policy might already exist - safe to ignore
  NULL;
END $$;

-- Platform admins can view all
CREATE POLICY "Platform admins can view all call data"
  ON call_leads FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM auth.users
      WHERE id = auth.uid()
      AND email IN (
        SELECT unnest(string_to_array(current_setting('app.settings.admin_emails', true), ','))
      )
    )
  );

-- ============================================
-- 4. FUNCTIONS
-- ============================================

-- Get virtual number for DJ (with rotation)
CREATE OR REPLACE FUNCTION get_dj_virtual_number(p_dj_profile_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_number TEXT;
BEGIN
  SELECT virtual_number INTO v_number
  FROM dj_virtual_numbers
  WHERE dj_profile_id = p_dj_profile_id
    AND is_active = TRUE
    AND product_context = 'djdash'
  ORDER BY COALESCE(rotation_weight, 1) DESC, RANDOM()
  LIMIT 1;
  
  RETURN v_number;
END;
$$ LANGUAGE plpgsql STABLE;

-- Update call stats
CREATE OR REPLACE FUNCTION update_call_stats()
RETURNS TRIGGER AS $$
BEGIN
  -- Update virtual number stats
  IF NEW.call_status = 'completed' AND NEW.call_duration_seconds > 0 THEN
    UPDATE dj_virtual_numbers
    SET 
      total_calls = total_calls + 1,
      total_duration_seconds = total_duration_seconds + NEW.call_duration_seconds,
      last_call_at = NEW.call_started_at
    WHERE virtual_number = NEW.virtual_number;
    
    -- Update DJ call stats (if dj_profile_id set)
    IF NEW.dj_profile_id IS NOT NULL THEN
      -- Update dj_virtual_numbers stats
      UPDATE dj_virtual_numbers
      SET 
        total_calls = COALESCE(total_calls, 0) + 1,
        total_duration_seconds = COALESCE(total_duration_seconds, 0) + NEW.call_duration_seconds,
        last_call_at = NEW.call_started_at
      WHERE virtual_number = NEW.virtual_number
        AND dj_profile_id = NEW.dj_profile_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_call_stats_trigger
  AFTER INSERT OR UPDATE ON call_leads
  FOR EACH ROW
  EXECUTE FUNCTION update_call_stats();

COMMENT ON FUNCTION get_dj_virtual_number IS 'Returns active virtual number for DJ with rotation support';

