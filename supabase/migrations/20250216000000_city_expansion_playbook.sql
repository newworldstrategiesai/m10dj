-- DJ Dash City Expansion Playbook Migration
-- This migration enhances the city expansion system with:
-- 1. Enhanced dj_profiles with city-specific fields
-- 2. city_pages table for CMS tracking and AI-generated content
-- 3. city_analytics table for city-level performance tracking
-- 4. city_venue_spotlights for venue-specific content
-- All scoped to DJ Dash product_context

-- ============================================
-- 1. ENHANCE DJ_PROFILES TABLE
-- ============================================
-- Add city-specific fields to dj_profiles
ALTER TABLE dj_profiles 
ADD COLUMN IF NOT EXISTS primary_city TEXT,
ADD COLUMN IF NOT EXISTS city_tags TEXT[], -- Array of city tags for SEO and filtering
ADD COLUMN IF NOT EXISTS city_availability JSONB, -- City-level default availability settings
ADD COLUMN IF NOT EXISTS city_pricing JSONB; -- City-specific pricing adjustments

-- Create index for primary_city for faster city-based queries
CREATE INDEX IF NOT EXISTS idx_dj_profiles_primary_city ON dj_profiles(primary_city) WHERE primary_city IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_dj_profiles_city_tags ON dj_profiles USING GIN(city_tags) WHERE city_tags IS NOT NULL;

-- ============================================
-- 2. CITY_PAGES TABLE (CMS Tracking)
-- ============================================
CREATE TABLE IF NOT EXISTS city_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- City Identification
  city_slug TEXT UNIQUE NOT NULL, -- URL slug: djdash.net/cities/[city-slug]
  city_name TEXT NOT NULL,
  state TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  metro_area TEXT, -- e.g., "Memphis Metro", "Nashville Metro"
  
  -- SEO & Meta
  meta_title TEXT,
  meta_description TEXT,
  og_image_url TEXT,
  
  -- Content (AI-generated and manual)
  hero_title TEXT,
  hero_subtitle TEXT,
  hero_image_url TEXT,
  content_html TEXT, -- Full HTML content for the city page
  ai_generated_content JSONB, -- AI-generated guides, tips, FAQs
  
  -- Featured Content
  featured_dj_ids UUID[], -- Array of featured DJ profile IDs
  featured_venues JSONB, -- Array of venue spotlights
  event_type_demand JSONB, -- Demand analysis per event type
  
  -- Local Insights
  local_tips TEXT[],
  seasonal_trends JSONB, -- Seasonal demand patterns
  popular_venues TEXT[], -- Popular venue names in the city
  
  -- Settings
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  priority INTEGER DEFAULT 0, -- For sorting/ordering
  
  -- Analytics Summary (cached)
  total_djs INTEGER DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  avg_rating DECIMAL(3,2),
  total_bookings INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_ai_update TIMESTAMP WITH TIME ZONE, -- Last time AI content was refreshed
  
  -- Product Context
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash')
);

-- Indexes for city_pages
CREATE INDEX IF NOT EXISTS idx_city_pages_slug ON city_pages(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_pages_city_state ON city_pages(city_name, state);
CREATE INDEX IF NOT EXISTS idx_city_pages_is_published ON city_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_city_pages_is_featured ON city_pages(is_featured);
CREATE INDEX IF NOT EXISTS idx_city_pages_product_context ON city_pages(product_context);

-- ============================================
-- 3. CITY_ANALYTICS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS city_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_page_id UUID REFERENCES city_pages(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  
  -- Page Metrics
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page DECIMAL(10,2), -- seconds
  
  -- Lead Generation
  leads_generated INTEGER DEFAULT 0,
  inquiry_form_views INTEGER DEFAULT 0,
  inquiry_submissions INTEGER DEFAULT 0,
  quote_requests INTEGER DEFAULT 0,
  booking_requests INTEGER DEFAULT 0,
  
  -- Conversion Metrics
  lead_to_booking_rate DECIMAL(5,2), -- Percentage
  inquiry_conversion_rate DECIMAL(5,2),
  
  -- Revenue Tracking
  tipjar_clicks INTEGER DEFAULT 0,
  tipjar_revenue DECIMAL(10,2) DEFAULT 0,
  estimated_booking_value DECIMAL(10,2) DEFAULT 0,
  
  -- Traffic Sources
  traffic_sources JSONB, -- {organic: 0, direct: 0, social: 0, referral: 0, paid: 0}
  
  -- Event Type Breakdown
  event_type_leads JSONB, -- {wedding: 10, corporate: 5, birthday: 3}
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(city_page_id, date)
);

CREATE INDEX IF NOT EXISTS idx_city_analytics_city_date ON city_analytics(city_page_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_city_analytics_date ON city_analytics(date DESC);

-- ============================================
-- 4. CITY_VENUE_SPOTLIGHTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS city_venue_spotlights (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  city_page_id UUID REFERENCES city_pages(id) ON DELETE CASCADE,
  
  -- Venue Information
  venue_name TEXT NOT NULL,
  venue_address TEXT,
  venue_type TEXT, -- 'wedding_venue', 'corporate', 'event_space', etc.
  venue_image_url TEXT,
  
  -- Content
  description TEXT,
  dj_count INTEGER DEFAULT 0, -- Number of DJs who have played here
  featured_dj_ids UUID[], -- DJs who have played at this venue
  
  -- SEO
  venue_slug TEXT,
  
  -- Settings
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_city_venue_spotlights_city ON city_venue_spotlights(city_page_id);
CREATE INDEX IF NOT EXISTS idx_city_venue_spotlights_featured ON city_venue_spotlights(is_featured);

-- ============================================
-- 5. CITY_DJ_PERFORMANCE TABLE
-- ============================================
-- Tracks DJ performance metrics per city
CREATE TABLE IF NOT EXISTS city_dj_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  dj_profile_id UUID REFERENCES dj_profiles(id) ON DELETE CASCADE,
  city_page_id UUID REFERENCES city_pages(id) ON DELETE CASCADE,
  
  -- Performance Metrics
  page_views INTEGER DEFAULT 0,
  leads_generated INTEGER DEFAULT 0,
  bookings_received INTEGER DEFAULT 0,
  revenue_generated DECIMAL(10,2) DEFAULT 0,
  avg_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  
  -- Event Type Performance
  event_type_performance JSONB, -- {wedding: {leads: 5, bookings: 2}, corporate: {leads: 3, bookings: 1}}
  
  -- Ranking
  city_rank INTEGER, -- Rank within the city
  event_type_rank JSONB, -- Rank per event type
  
  -- Timestamps
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(dj_profile_id, city_page_id)
);

CREATE INDEX IF NOT EXISTS idx_city_dj_performance_dj ON city_dj_performance(dj_profile_id);
CREATE INDEX IF NOT EXISTS idx_city_dj_performance_city ON city_dj_performance(city_page_id);
CREATE INDEX IF NOT EXISTS idx_city_dj_performance_rank ON city_dj_performance(city_page_id, city_rank);

-- ============================================
-- RLS POLICIES
-- ============================================
ALTER TABLE city_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_analytics ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_venue_spotlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE city_dj_performance ENABLE ROW LEVEL SECURITY;

-- Public can view published city pages
CREATE POLICY "Public can view published city pages"
  ON city_pages FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE);

-- Admins can manage city pages
CREATE POLICY "Admins can manage city pages"
  ON city_pages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Public can view city analytics (aggregated only)
CREATE POLICY "Public can view city analytics"
  ON city_analytics FOR SELECT
  TO anon, authenticated
  USING (TRUE); -- Public analytics are safe

-- Admins can manage city analytics
CREATE POLICY "Admins can manage city analytics"
  ON city_analytics FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- Public can view venue spotlights
CREATE POLICY "Public can view venue spotlights"
  ON city_venue_spotlights FOR SELECT
  TO anon, authenticated
  USING (TRUE);

-- Admins can manage venue spotlights
CREATE POLICY "Admins can manage venue spotlights"
  ON city_venue_spotlights FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- DJs can view their own city performance
CREATE POLICY "DJs can view own city performance"
  ON city_dj_performance FOR SELECT
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

-- Admins can view all city performance
CREATE POLICY "Admins can view all city performance"
  ON city_dj_performance FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid()
      AND role = 'admin'
    )
  );

-- ============================================
-- TRIGGERS
-- ============================================
-- Auto-update updated_at timestamps
CREATE OR REPLACE FUNCTION update_city_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_city_pages_updated_at
  BEFORE UPDATE ON city_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_city_pages_updated_at();

CREATE TRIGGER update_city_analytics_updated_at
  BEFORE UPDATE ON city_analytics
  FOR EACH ROW
  EXECUTE FUNCTION update_city_pages_updated_at();

CREATE TRIGGER update_city_venue_spotlights_updated_at
  BEFORE UPDATE ON city_venue_spotlights
  FOR EACH ROW
  EXECUTE FUNCTION update_city_pages_updated_at();

-- Auto-generate city slug if not provided
CREATE OR REPLACE FUNCTION generate_city_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.city_slug IS NULL OR NEW.city_slug = '' THEN
    NEW.city_slug := LOWER(REGEXP_REPLACE(
      NEW.city_name || '-' || NEW.state_abbr, 
      '[^a-z0-9]+', '-', 'g'
    ));
    NEW.city_slug := TRIM(BOTH '-' FROM NEW.city_slug);
    
    -- Ensure uniqueness
    WHILE EXISTS (SELECT 1 FROM city_pages WHERE city_slug = NEW.city_slug AND id != NEW.id) LOOP
      NEW.city_slug := NEW.city_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
    END LOOP;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_city_slug_trigger
  BEFORE INSERT OR UPDATE ON city_pages
  FOR EACH ROW
  EXECUTE FUNCTION generate_city_slug();

-- ============================================
-- COMMENTS
-- ============================================
COMMENT ON TABLE city_pages IS 'City landing pages with AI-generated content and CMS tracking - scoped to DJ Dash';
COMMENT ON TABLE city_analytics IS 'City-level analytics for page views, leads, conversions, and revenue';
COMMENT ON TABLE city_venue_spotlights IS 'Featured venues per city with DJ associations';
COMMENT ON TABLE city_dj_performance IS 'DJ performance metrics tracked per city for ranking and featuring';

