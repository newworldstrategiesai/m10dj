-- Multi-DJ Inquiry System
-- Allows planners to submit a single inquiry that creates individual inquiries for multiple DJs
-- All tables are scoped to DJ Dash product_context to maintain data isolation

-- ============================================
-- 1. MULTI_INQUIRIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS multi_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Planner Information
  planner_name TEXT NOT NULL,
  planner_email TEXT NOT NULL,
  planner_phone TEXT,
  
  -- Event Details
  event_date DATE,
  event_type TEXT NOT NULL,
  budget DECIMAL(10,2),
  city TEXT,
  state TEXT,
  venue_name TEXT,
  venue_address TEXT,
  guest_count INTEGER,
  event_time TIME,
  special_requests TEXT,
  
  -- Multi-Inquiry Tracking
  total_djs_contacted INTEGER DEFAULT 0,
  total_djs_available INTEGER DEFAULT 0,
  total_djs_unavailable INTEGER DEFAULT 0,
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_multi_inquiries_planner_email ON multi_inquiries(planner_email);
CREATE INDEX IF NOT EXISTS idx_multi_inquiries_event_date ON multi_inquiries(event_date);
CREATE INDEX IF NOT EXISTS idx_multi_inquiries_city ON multi_inquiries(city);
CREATE INDEX IF NOT EXISTS idx_multi_inquiries_product_context ON multi_inquiries(product_context);
CREATE INDEX IF NOT EXISTS idx_multi_inquiries_created_at ON multi_inquiries(created_at);

-- ============================================
-- 2. UPDATE DJ_INQUIRIES TABLE
-- ============================================
-- Add multi_inquiry_id to link individual inquiries to multi-inquiry
ALTER TABLE dj_inquiries 
  ADD COLUMN IF NOT EXISTS multi_inquiry_id UUID REFERENCES multi_inquiries(id) ON DELETE SET NULL;

-- Add index for multi_inquiry_id lookups
CREATE INDEX IF NOT EXISTS idx_dj_inquiries_multi_inquiry_id ON dj_inquiries(multi_inquiry_id);

-- Add inquiry_status field if it doesn't exist (for tracking: pending, responded, converted, skipped)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dj_inquiries' 
    AND column_name = 'inquiry_status'
  ) THEN
    ALTER TABLE dj_inquiries 
      ADD COLUMN inquiry_status TEXT DEFAULT 'pending' 
      CHECK (inquiry_status IN ('pending', 'responded', 'converted', 'skipped', 'declined'));
  END IF;
END $$;

-- Add index for inquiry_status
CREATE INDEX IF NOT EXISTS idx_dj_inquiries_inquiry_status ON dj_inquiries(inquiry_status);

-- ============================================
-- 3. RLS POLICIES
-- ============================================

-- Enable RLS on multi_inquiries
ALTER TABLE multi_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can create multi-inquiries (public form)
CREATE POLICY "Anyone can create multi-inquiries"
  ON multi_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (product_context = 'djdash');

-- DJs can view multi-inquiries that include their profile
CREATE POLICY "DJs can view related multi-inquiries"
  ON multi_inquiries FOR SELECT
  TO authenticated
  USING (
    id IN (
      SELECT DISTINCT multi_inquiry_id 
      FROM dj_inquiries 
      WHERE dj_profile_id IN (
        SELECT id FROM dj_profiles 
        WHERE organization_id IN (
          SELECT id FROM organizations 
          WHERE owner_id = auth.uid() 
          AND product_context = 'djdash'
        )
      )
      AND multi_inquiry_id IS NOT NULL
    )
  );

-- Platform admins can view all multi-inquiries
CREATE POLICY "Platform admins can view all multi-inquiries"
  ON multi_inquiries FOR SELECT
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
-- 4. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_multi_inquiries_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_multi_inquiries_updated_at
  BEFORE UPDATE ON multi_inquiries
  FOR EACH ROW
  EXECUTE FUNCTION update_multi_inquiries_updated_at();

-- ============================================
-- 5. COMMENTS
-- ============================================
COMMENT ON TABLE multi_inquiries IS 'Multi-DJ inquiry submissions - allows planners to contact multiple DJs at once';
COMMENT ON COLUMN dj_inquiries.multi_inquiry_id IS 'Links individual DJ inquiry to parent multi-inquiry';
COMMENT ON COLUMN dj_inquiries.inquiry_status IS 'Status of individual inquiry: pending, responded, converted, skipped, declined';

