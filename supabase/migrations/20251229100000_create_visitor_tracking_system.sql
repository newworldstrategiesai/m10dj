-- Customer Journey Tracking System for M10 DJ Company
-- Tracks visitors across pages, QR scans, and form submissions

-- ================================================
-- 1. VISITOR SESSIONS TABLE
-- Stores persistent visitor identifiers
-- ================================================
CREATE TABLE IF NOT EXISTS visitor_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Fingerprint is a hash of device characteristics for anonymous tracking
  fingerprint TEXT NOT NULL,
  
  -- Organization context (for multi-brand support)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Device & Browser Info
  user_agent TEXT,
  screen_resolution TEXT,
  timezone TEXT,
  language TEXT,
  platform TEXT,
  
  -- Location Info
  ip_address TEXT,
  city TEXT,
  region TEXT,
  country TEXT,
  
  -- Contact Linking (linked when they provide contact info)
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  contact_submission_id UUID REFERENCES contact_submissions(id) ON DELETE SET NULL,
  email TEXT,
  phone TEXT,
  name TEXT,
  
  -- Session Metrics
  first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  total_page_views INTEGER DEFAULT 0,
  total_sessions INTEGER DEFAULT 1,
  
  -- Conversion Tracking
  has_submitted_form BOOLEAN DEFAULT FALSE,
  has_made_song_request BOOLEAN DEFAULT FALSE,
  has_made_payment BOOLEAN DEFAULT FALSE,
  
  -- UTM Parameters (first touch attribution)
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  referrer TEXT,
  landing_page TEXT,
  
  -- System
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for visitor_sessions
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_fingerprint ON visitor_sessions(fingerprint);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_organization_id ON visitor_sessions(organization_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_contact_id ON visitor_sessions(contact_id);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_email ON visitor_sessions(email);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_phone ON visitor_sessions(phone);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_last_seen ON visitor_sessions(last_seen_at);
CREATE INDEX IF NOT EXISTS idx_visitor_sessions_first_seen ON visitor_sessions(first_seen_at);

-- ================================================
-- 2. PAGE VIEWS TABLE
-- Logs individual page visits
-- ================================================
CREATE TABLE IF NOT EXISTS page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Link to visitor
  visitor_id UUID REFERENCES visitor_sessions(id) ON DELETE CASCADE,
  
  -- Organization context
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  
  -- Page Information
  page_url TEXT NOT NULL,
  page_path TEXT NOT NULL,
  page_title TEXT,
  page_category TEXT, -- 'home', 'services', 'pricing', 'contact', 'requests', 'checkout', etc.
  
  -- Referrer & Navigation
  referrer TEXT,
  referrer_domain TEXT,
  previous_page TEXT,
  
  -- Device & Browser
  user_agent TEXT,
  device_type TEXT, -- 'mobile', 'tablet', 'desktop'
  browser TEXT,
  os TEXT,
  
  -- Engagement
  time_on_page_seconds INTEGER,
  scroll_depth_percent INTEGER,
  
  -- Session Context
  session_number INTEGER DEFAULT 1, -- Which session number for this visitor
  page_number INTEGER DEFAULT 1, -- Which page in the session
  
  -- Timestamps
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  left_at TIMESTAMPTZ
);

-- Indexes for page_views
CREATE INDEX IF NOT EXISTS idx_page_views_visitor_id ON page_views(visitor_id);
CREATE INDEX IF NOT EXISTS idx_page_views_organization_id ON page_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_page_views_page_path ON page_views(page_path);
CREATE INDEX IF NOT EXISTS idx_page_views_viewed_at ON page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_page_views_page_category ON page_views(page_category);

-- ================================================
-- 3. ADD VISITOR_ID TO EXISTING TABLES
-- ================================================

-- Add visitor_id to qr_scans
ALTER TABLE qr_scans ADD COLUMN IF NOT EXISTS visitor_id UUID REFERENCES visitor_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_qr_scans_visitor_id ON qr_scans(visitor_id);

-- Add visitor_id to contact_submissions
ALTER TABLE contact_submissions ADD COLUMN IF NOT EXISTS visitor_id UUID REFERENCES visitor_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_contact_submissions_visitor_id ON contact_submissions(visitor_id);

-- Add visitor_id to crowd_requests
ALTER TABLE crowd_requests ADD COLUMN IF NOT EXISTS visitor_id UUID REFERENCES visitor_sessions(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_crowd_requests_visitor_id ON crowd_requests(visitor_id);

-- ================================================
-- 4. CUSTOMER TIMELINE VIEW
-- Unified view of all customer interactions
-- ================================================
CREATE OR REPLACE VIEW customer_timeline AS
SELECT 
  event_type,
  event_id,
  visitor_id,
  organization_id,
  event_time,
  title,
  description,
  metadata
FROM (
  -- Page Views
  SELECT 
    'page_view' AS event_type,
    pv.id AS event_id,
    pv.visitor_id,
    pv.organization_id,
    pv.viewed_at AS event_time,
    COALESCE(pv.page_title, pv.page_path) AS title,
    'Viewed ' || pv.page_path AS description,
    jsonb_build_object(
      'page_url', pv.page_url,
      'page_path', pv.page_path,
      'referrer', pv.referrer,
      'device_type', pv.device_type,
      'time_on_page', pv.time_on_page_seconds
    ) AS metadata
  FROM page_views pv
  WHERE pv.visitor_id IS NOT NULL

  UNION ALL

  -- QR Scans
  SELECT 
    CASE WHEN qs.converted THEN 'qr_scan_converted' ELSE 'qr_scan' END AS event_type,
    qs.id AS event_id,
    qs.visitor_id,
    qs.organization_id,
    qs.scanned_at AS event_time,
    'QR Code Scan' AS title,
    CASE 
      WHEN qs.converted THEN 'Scanned QR and made a request'
      ELSE 'Scanned QR code'
    END AS description,
    jsonb_build_object(
      'event_qr_code', qs.event_qr_code,
      'converted', qs.converted,
      'request_id', qs.request_id,
      'referrer', qs.referrer
    ) AS metadata
  FROM qr_scans qs
  WHERE qs.visitor_id IS NOT NULL

  UNION ALL

  -- Song Requests (from crowd_requests)
  SELECT 
    'song_request' AS event_type,
    cr.id AS event_id,
    cr.visitor_id,
    cr.organization_id,
    cr.created_at AS event_time,
    COALESCE(cr.song_title, 'Song Request') || ' by ' || COALESCE(cr.song_artist, 'Unknown Artist') AS title,
    'Requested: ' || COALESCE(cr.song_title, 'Unknown Song') AS description,
    jsonb_build_object(
      'song_title', cr.song_title,
      'artist_name', cr.song_artist,
      'requester_name', cr.requester_name,
      'requester_email', cr.requester_email,
      'requester_phone', cr.requester_phone,
      'amount', cr.amount_requested,
      'status', cr.status,
      'payment_status', cr.payment_status
    ) AS metadata
  FROM crowd_requests cr
  WHERE cr.visitor_id IS NOT NULL

  UNION ALL

  -- Contact Form Submissions
  SELECT 
    'form_submission' AS event_type,
    cs.id AS event_id,
    cs.visitor_id,
    (SELECT id FROM organizations WHERE slug = 'm10dj' LIMIT 1) AS organization_id,
    cs.created_at AS event_time,
    'Event Inquiry: ' || COALESCE(cs.event_type, 'Unknown Event') AS title,
    cs.name || ' submitted an inquiry' AS description,
    jsonb_build_object(
      'name', cs.name,
      'email', cs.email,
      'phone', cs.phone,
      'event_type', cs.event_type,
      'event_date', cs.event_date,
      'location', cs.location,
      'message', cs.message,
      'status', cs.status
    ) AS metadata
  FROM contact_submissions cs
  WHERE cs.visitor_id IS NOT NULL
) events
ORDER BY event_time DESC;

-- ================================================
-- 5. HELPER FUNCTIONS
-- ================================================

-- Function to get or create a visitor session
CREATE OR REPLACE FUNCTION get_or_create_visitor(
  p_fingerprint TEXT,
  p_organization_id UUID DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_ip_address TEXT DEFAULT NULL,
  p_screen_resolution TEXT DEFAULT NULL,
  p_timezone TEXT DEFAULT NULL,
  p_language TEXT DEFAULT NULL,
  p_platform TEXT DEFAULT NULL,
  p_utm_source TEXT DEFAULT NULL,
  p_utm_medium TEXT DEFAULT NULL,
  p_utm_campaign TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_landing_page TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_visitor_id UUID;
BEGIN
  -- Try to find existing visitor by fingerprint
  SELECT id INTO v_visitor_id
  FROM visitor_sessions
  WHERE fingerprint = p_fingerprint
    AND (organization_id = p_organization_id OR (organization_id IS NULL AND p_organization_id IS NULL))
  LIMIT 1;

  IF v_visitor_id IS NULL THEN
    -- Create new visitor
    INSERT INTO visitor_sessions (
      fingerprint,
      organization_id,
      user_agent,
      ip_address,
      screen_resolution,
      timezone,
      language,
      platform,
      utm_source,
      utm_medium,
      utm_campaign,
      referrer,
      landing_page
    ) VALUES (
      p_fingerprint,
      p_organization_id,
      p_user_agent,
      p_ip_address,
      p_screen_resolution,
      p_timezone,
      p_language,
      p_platform,
      p_utm_source,
      p_utm_medium,
      p_utm_campaign,
      p_referrer,
      p_landing_page
    )
    RETURNING id INTO v_visitor_id;
  ELSE
    -- Update existing visitor's last seen
    UPDATE visitor_sessions
    SET 
      last_seen_at = NOW(),
      total_sessions = total_sessions + 1,
      updated_at = NOW()
    WHERE id = v_visitor_id;
  END IF;

  RETURN v_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to link visitor to contact info
CREATE OR REPLACE FUNCTION link_visitor_to_contact(
  p_visitor_id UUID,
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_name TEXT DEFAULT NULL,
  p_contact_id UUID DEFAULT NULL,
  p_contact_submission_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  UPDATE visitor_sessions
  SET 
    email = COALESCE(p_email, email),
    phone = COALESCE(p_phone, phone),
    name = COALESCE(p_name, name),
    contact_id = COALESCE(p_contact_id, contact_id),
    contact_submission_id = COALESCE(p_contact_submission_id, contact_submission_id),
    updated_at = NOW()
  WHERE id = p_visitor_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to record a page view
CREATE OR REPLACE FUNCTION record_page_view(
  p_visitor_id UUID,
  p_page_url TEXT,
  p_page_path TEXT,
  p_page_title TEXT DEFAULT NULL,
  p_page_category TEXT DEFAULT NULL,
  p_referrer TEXT DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_device_type TEXT DEFAULT NULL,
  p_organization_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_page_view_id UUID;
  v_session_number INTEGER;
  v_page_number INTEGER;
BEGIN
  -- Get current session and page numbers
  SELECT 
    COALESCE(total_sessions, 1),
    COALESCE(total_page_views, 0) + 1
  INTO v_session_number, v_page_number
  FROM visitor_sessions
  WHERE id = p_visitor_id;

  -- Insert page view
  INSERT INTO page_views (
    visitor_id,
    organization_id,
    page_url,
    page_path,
    page_title,
    page_category,
    referrer,
    user_agent,
    device_type,
    session_number,
    page_number
  ) VALUES (
    p_visitor_id,
    p_organization_id,
    p_page_url,
    p_page_path,
    p_page_title,
    p_page_category,
    p_referrer,
    p_user_agent,
    p_device_type,
    v_session_number,
    v_page_number
  )
  RETURNING id INTO v_page_view_id;

  -- Update visitor's page view count and last seen
  UPDATE visitor_sessions
  SET 
    total_page_views = COALESCE(total_page_views, 0) + 1,
    last_seen_at = NOW(),
    updated_at = NOW()
  WHERE id = p_visitor_id;

  RETURN v_page_view_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer timeline by visitor_id
CREATE OR REPLACE FUNCTION get_customer_timeline(
  p_visitor_id UUID,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  event_type TEXT,
  event_id UUID,
  visitor_id UUID,
  organization_id UUID,
  event_time TIMESTAMPTZ,
  title TEXT,
  description TEXT,
  metadata JSONB
) AS $$
BEGIN
  RETURN QUERY
  SELECT * FROM customer_timeline ct
  WHERE ct.visitor_id = p_visitor_id
  ORDER BY ct.event_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get customer timeline by email or phone
CREATE OR REPLACE FUNCTION get_customer_timeline_by_contact(
  p_email TEXT DEFAULT NULL,
  p_phone TEXT DEFAULT NULL,
  p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
  event_type TEXT,
  event_id UUID,
  visitor_id UUID,
  organization_id UUID,
  event_time TIMESTAMPTZ,
  title TEXT,
  description TEXT,
  metadata JSONB
) AS $$
DECLARE
  v_visitor_ids UUID[];
BEGIN
  -- Find all visitor_ids associated with this email or phone
  SELECT ARRAY_AGG(DISTINCT id) INTO v_visitor_ids
  FROM visitor_sessions
  WHERE 
    (p_email IS NOT NULL AND email = p_email)
    OR (p_phone IS NOT NULL AND phone = p_phone);

  RETURN QUERY
  SELECT * FROM customer_timeline ct
  WHERE ct.visitor_id = ANY(v_visitor_ids)
  ORDER BY ct.event_time DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ================================================
-- 6. RLS POLICIES
-- ================================================

-- Enable RLS
ALTER TABLE visitor_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE page_views ENABLE ROW LEVEL SECURITY;

-- Visitor Sessions Policies
CREATE POLICY "Anon can insert visitor_sessions"
  ON visitor_sessions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all visitor_sessions"
  ON visitor_sessions FOR SELECT
  TO authenticated
  USING (
    is_platform_admin()
    OR organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role can manage all visitor_sessions"
  ON visitor_sessions FOR ALL
  TO service_role
  USING (true);

-- Page Views Policies
CREATE POLICY "Anon can insert page_views"
  ON page_views FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins can view all page_views"
  ON page_views FOR SELECT
  TO authenticated
  USING (
    is_platform_admin()
    OR organization_id IN (SELECT id FROM organizations WHERE owner_id = auth.uid())
  );

CREATE POLICY "Service role can manage all page_views"
  ON page_views FOR ALL
  TO service_role
  USING (true);

-- ================================================
-- 7. TRIGGERS
-- ================================================

-- Update updated_at on visitor_sessions
CREATE OR REPLACE FUNCTION update_visitor_sessions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_visitor_sessions_updated_at
  BEFORE UPDATE ON visitor_sessions
  FOR EACH ROW
  EXECUTE FUNCTION update_visitor_sessions_updated_at();

-- ================================================
-- 8. COMMENTS
-- ================================================
COMMENT ON TABLE visitor_sessions IS 'Tracks anonymous and identified visitors across the M10 DJ Company website';
COMMENT ON TABLE page_views IS 'Logs individual page visits for customer journey tracking';
COMMENT ON VIEW customer_timeline IS 'Unified view of all customer interactions (page views, QR scans, song requests, form submissions)';
COMMENT ON FUNCTION get_or_create_visitor IS 'Gets existing or creates new visitor session based on fingerprint';
COMMENT ON FUNCTION link_visitor_to_contact IS 'Links a visitor session to contact information when provided';
COMMENT ON FUNCTION record_page_view IS 'Records a page view for visitor tracking';
COMMENT ON FUNCTION get_customer_timeline IS 'Gets complete timeline of customer interactions by visitor_id';
COMMENT ON FUNCTION get_customer_timeline_by_contact IS 'Gets complete timeline of customer interactions by email or phone';

