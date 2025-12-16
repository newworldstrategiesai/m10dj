-- DJ Dash Hosted Pages System
-- This migration creates tables for DJ hosted pages (djdash.net/dj/[slug])
-- All tables are scoped to DJ Dash product_context to maintain data isolation

-- ============================================
-- 1. DJ PROFILES TABLE (extends organizations)
-- ============================================
-- This table stores DJ-specific profile information for hosted pages
CREATE TABLE IF NOT EXISTS dj_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL UNIQUE,
  
  -- Profile Basics
  dj_name TEXT NOT NULL,
  dj_slug TEXT UNIQUE NOT NULL, -- URL slug: djdash.net/dj/[slug]
  tagline TEXT,
  bio TEXT,
  profile_image_url TEXT,
  cover_image_url TEXT,
  
  -- Location & Service Area
  city TEXT,
  state TEXT,
  zip_code TEXT,
  service_radius_miles INTEGER DEFAULT 50,
  service_areas TEXT[], -- Array of cities/areas served
  
  -- Event Types & Pricing
  event_types TEXT[] DEFAULT ARRAY['wedding', 'corporate', 'private_party'], -- Types of events served
  starting_price_range TEXT, -- e.g., "$800-$2,500"
  price_range_min DECIMAL(10,2),
  price_range_max DECIMAL(10,2),
  
  -- Availability Indicator
  availability_status TEXT DEFAULT 'available' CHECK (availability_status IN ('available', 'limited', 'booked', 'unavailable')),
  availability_message TEXT, -- Custom message about availability
  
  -- Media & Links
  photo_gallery_urls TEXT[], -- Array of image URLs
  video_highlights JSONB, -- {youtube: [], vimeo: [], instagram_reels: []}
  soundcloud_url TEXT,
  mixcloud_url TEXT,
  social_links JSONB, -- {instagram: '', facebook: '', twitter: '', etc}
  
  -- SEO & Content
  seo_title TEXT,
  seo_description TEXT,
  ai_generated_content JSONB, -- AI-generated city blurbs, FAQs, etc (opt-in)
  
  -- Customization (paid tiers)
  theme_colors JSONB, -- {primary: '', secondary: '', accent: ''}
  custom_domain TEXT, -- For Pro/Elite tiers
  hide_djdash_branding BOOLEAN DEFAULT FALSE, -- Elite tier only
  section_order JSONB, -- Custom section ordering
  
  -- Settings
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE, -- Featured in directory
  custom_cta_text TEXT, -- Custom CTA button text
  
  -- Analytics
  page_views INTEGER DEFAULT 0,
  lead_count INTEGER DEFAULT 0,
  booking_count INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_dj_profiles_organization_id ON dj_profiles(organization_id);
CREATE INDEX IF NOT EXISTS idx_dj_profiles_slug ON dj_profiles(dj_slug);
CREATE INDEX IF NOT EXISTS idx_dj_profiles_city_state ON dj_profiles(city, state);
CREATE INDEX IF NOT EXISTS idx_dj_profiles_is_published ON dj_profiles(is_published);
CREATE INDEX IF NOT EXISTS idx_dj_profiles_is_featured ON dj_profiles(is_featured);

-- ============================================
-- 2. DJ AVAILABILITY CALENDAR
-- ============================================
CREATE TABLE IF NOT EXISTS dj_availability (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('available', 'tentative', 'booked', 'unavailable')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dj_profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_dj_availability_profile_date ON dj_availability(dj_profile_id, date);
CREATE INDEX IF NOT EXISTS idx_dj_availability_date ON dj_availability(date);
CREATE INDEX IF NOT EXISTS idx_dj_availability_status ON dj_availability(status);

-- ============================================
-- 3. DJ REVIEWS (Verified Only)
-- ============================================
CREATE TABLE IF NOT EXISTS dj_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL, -- Link to completed event
  
  -- Review Content
  reviewer_name TEXT NOT NULL,
  reviewer_email TEXT,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT NOT NULL,
  headline TEXT, -- Optional review headline
  
  -- Event Context
  event_type TEXT,
  event_date DATE,
  venue_name TEXT,
  
  -- Verification
  is_verified BOOLEAN DEFAULT FALSE, -- Only true after completed event + payment
  verification_method TEXT, -- 'completed_event', 'payment_confirmed', 'manual'
  verified_at TIMESTAMP WITH TIME ZONE,
  
  -- Review Aspects (for structured data)
  positive_notes TEXT[],
  review_aspects TEXT[], -- ['music_selection', 'professionalism', 'equipment', etc]
  
  -- Moderation
  is_approved BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  moderation_notes TEXT,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_reviews_profile_id ON dj_reviews(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_reviews_is_verified ON dj_reviews(is_verified);
CREATE INDEX IF NOT EXISTS idx_dj_reviews_is_approved ON dj_reviews(is_approved);
CREATE INDEX IF NOT EXISTS idx_dj_reviews_rating ON dj_reviews(rating);

-- ============================================
-- 4. DJ BADGES
-- ============================================
CREATE TABLE IF NOT EXISTS dj_badges (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  badge_type TEXT NOT NULL CHECK (badge_type IN (
    'top_rated',
    'fast_responder',
    'events_booked_100',
    'events_booked_500',
    'verified_pro',
    'featured_dj',
    'award_winner'
  )),
  badge_label TEXT NOT NULL, -- Display text
  badge_icon TEXT, -- Icon identifier
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE, -- Optional expiration
  is_active BOOLEAN DEFAULT TRUE
);

CREATE INDEX IF NOT EXISTS idx_dj_badges_profile_id ON dj_badges(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_badges_is_active ON dj_badges(is_active);

-- ============================================
-- 5. DJ INQUIRY FORMS (Smart Lead Capture)
-- ============================================
CREATE TABLE IF NOT EXISTS dj_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  
  -- Lead Information
  planner_name TEXT NOT NULL,
  planner_email TEXT NOT NULL,
  planner_phone TEXT,
  
  -- Event Details
  event_type TEXT NOT NULL,
  event_date DATE,
  event_time TIME,
  venue_name TEXT,
  venue_address TEXT,
  guest_count INTEGER,
  budget_range TEXT,
  budget_amount DECIMAL(10,2),
  
  -- Custom Form Fields (DJ can customize)
  custom_fields JSONB, -- Flexible custom fields
  
  -- Lead Scoring & Qualification
  lead_score INTEGER DEFAULT 0,
  lead_quality TEXT CHECK (lead_quality IN ('high', 'medium', 'low')),
  lead_temperature TEXT CHECK (lead_temperature IN ('hot', 'warm', 'cold')),
  minimum_budget_met BOOLEAN DEFAULT FALSE,
  auto_rejected BOOLEAN DEFAULT FALSE,
  rejection_reason TEXT,
  
  -- Special Notes
  special_requests TEXT,
  notes TEXT,
  
  -- Status
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'qualified', 'proposal_sent', 'booked', 'lost')),
  
  -- Conversion Tracking
  converted_to_contact_id UUID REFERENCES contacts(id) ON DELETE SET NULL,
  converted_at TIMESTAMP WITH TIME ZONE,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_inquiries_profile_id ON dj_inquiries(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_inquiries_status ON dj_inquiries(status);
CREATE INDEX IF NOT EXISTS idx_dj_inquiries_lead_score ON dj_inquiries(lead_score);
CREATE INDEX IF NOT EXISTS idx_dj_inquiries_event_date ON dj_inquiries(event_date);

-- ============================================
-- 6. DJ PAGE ANALYTICS
-- ============================================
CREATE TABLE IF NOT EXISTS dj_page_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  inquiry_form_views INTEGER DEFAULT 0,
  inquiry_submissions INTEGER DEFAULT 0,
  quote_requests INTEGER DEFAULT 0,
  booking_requests INTEGER DEFAULT 0,
  tipjar_clicks INTEGER DEFAULT 0,
  
  -- Conversion Metrics
  inquiry_conversion_rate DECIMAL(5,2), -- Percentage
  booking_conversion_rate DECIMAL(5,2),
  
  -- Traffic Sources
  traffic_sources JSONB, -- {organic: 0, direct: 0, social: 0, referral: 0}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(dj_profile_id, date)
);

CREATE INDEX IF NOT EXISTS idx_dj_analytics_profile_date ON dj_page_analytics(dj_profile_id, date);

-- ============================================
-- 7. DJ CUSTOM DOMAINS (Pro/Elite Tiers)
-- ============================================
CREATE TABLE IF NOT EXISTS dj_custom_domains (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE NOT NULL,
  domain TEXT NOT NULL UNIQUE,
  is_verified BOOLEAN DEFAULT FALSE,
  verification_token TEXT,
  dns_records JSONB, -- Instructions for DNS setup
  ssl_certificate_status TEXT,
  is_active BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_dj_custom_domains_profile_id ON dj_custom_domains(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_dj_custom_domains_domain ON dj_custom_domains(domain);

-- ============================================
-- RLS POLICIES
-- ============================================
-- Enable RLS on all tables
ALTER TABLE dj_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_page_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE dj_custom_domains ENABLE ROW LEVEL SECURITY;

-- DJs can view/edit their own profiles
CREATE POLICY "DJs can view own profile"
  ON dj_profiles FOR SELECT
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND product_context = 'djdash'
    )
  );

CREATE POLICY "DJs can update own profile"
  ON dj_profiles FOR UPDATE
  TO authenticated
  USING (
    organization_id IN (
      SELECT id FROM organizations 
      WHERE owner_id = auth.uid() 
      AND product_context = 'djdash'
    )
  );

-- Public can view published profiles
CREATE POLICY "Public can view published profiles"
  ON dj_profiles FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- DJs manage their own availability
CREATE POLICY "DJs can manage own availability"
  ON dj_availability FOR ALL
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

-- Public can view availability for published profiles
CREATE POLICY "Public can view availability"
  ON dj_availability FOR SELECT
  TO anon, authenticated
  USING (
    dj_profile_id IN (
      SELECT id FROM dj_profiles WHERE is_published = TRUE
    )
  );

-- Public can view approved reviews
CREATE POLICY "Public can view approved reviews"
  ON dj_reviews FOR SELECT
  TO anon, authenticated
  USING (is_approved = TRUE AND is_verified = TRUE);

-- DJs can view all their reviews (including unapproved)
CREATE POLICY "DJs can view own reviews"
  ON dj_reviews FOR SELECT
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

-- Public can view active badges
CREATE POLICY "Public can view active badges"
  ON dj_badges FOR SELECT
  TO anon, authenticated
  USING (is_active = TRUE);

-- DJs can view all their badges
CREATE POLICY "DJs can view own badges"
  ON dj_badges FOR SELECT
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

-- Anyone can create inquiries (public form)
CREATE POLICY "Anyone can create inquiries"
  ON dj_inquiries FOR INSERT
  TO anon, authenticated
  WITH CHECK (TRUE);

-- DJs can view their inquiries
CREATE POLICY "DJs can view own inquiries"
  ON dj_inquiries FOR SELECT
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

-- DJs can update their inquiries
CREATE POLICY "DJs can update own inquiries"
  ON dj_inquiries FOR UPDATE
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

-- DJs can view their analytics
CREATE POLICY "DJs can view own analytics"
  ON dj_page_analytics FOR SELECT
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

-- DJs can manage their custom domains
CREATE POLICY "DJs can manage own domains"
  ON dj_custom_domains FOR ALL
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

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_dj_profiles_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_dj_profiles_updated_at
  BEFORE UPDATE ON dj_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_dj_profiles_updated_at();

-- Auto-generate slug from DJ name if not provided
CREATE OR REPLACE FUNCTION generate_dj_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.dj_slug IS NULL OR NEW.dj_slug = '' THEN
    NEW.dj_slug := LOWER(REGEXP_REPLACE(NEW.dj_name, '[^a-z0-9]+', '-', 'g'));
    NEW.dj_slug := TRIM(BOTH '-' FROM NEW.dj_slug);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM dj_profiles WHERE dj_slug = NEW.dj_slug AND id != NEW.id) LOOP
      NEW.dj_slug := NEW.dj_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_dj_slug_trigger
  BEFORE INSERT OR UPDATE ON dj_profiles
  FOR EACH ROW
  EXECUTE FUNCTION generate_dj_slug();

-- Auto-calculate aggregate rating when reviews change
CREATE OR REPLACE FUNCTION update_dj_rating()
RETURNS TRIGGER AS $$
BEGIN
  -- This will be used to update aggregate ratings in dj_profiles
  -- Can be called manually or via scheduled job
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE dj_profiles IS 'DJ hosted page profiles - scoped to DJ Dash product_context';
COMMENT ON TABLE dj_availability IS 'DJ availability calendar with date locking';
COMMENT ON TABLE dj_reviews IS 'Verified reviews for DJ profiles (only after completed events)';
COMMENT ON TABLE dj_badges IS 'Trust badges and achievements for DJs';
COMMENT ON TABLE dj_inquiries IS 'Smart inquiry forms with lead scoring';
COMMENT ON TABLE dj_page_analytics IS 'Analytics tracking for DJ hosted pages';
COMMENT ON TABLE dj_custom_domains IS 'Custom domain support for Pro/Elite tiers';

