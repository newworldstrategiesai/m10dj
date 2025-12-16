-- City + Event Type Pages System
-- Creates SEO-rich pages for each city + event type combination
-- Optimized for LLM search engines (ChatGPT, Perplexity, etc.)

-- ============================================
-- 1. CITY_EVENT_PAGES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS city_event_pages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Route Information
  city_slug TEXT NOT NULL, -- e.g., 'new-york-ny'
  event_type_slug TEXT NOT NULL, -- e.g., 'corporate', 'wedding', 'birthday'
  full_slug TEXT UNIQUE NOT NULL, -- e.g., 'new-york-ny/corporate'
  
  -- City & Event Context
  city_name TEXT NOT NULL,
  state_name TEXT NOT NULL,
  state_abbr TEXT NOT NULL,
  event_type TEXT NOT NULL, -- 'wedding', 'corporate', 'birthday', 'school_dance', 'holiday_party', 'private_party'
  event_type_display TEXT NOT NULL, -- 'Wedding DJs', 'Corporate Event DJs', etc.
  
  -- SEO Metadata
  seo_title TEXT NOT NULL,
  seo_description TEXT NOT NULL,
  seo_keywords TEXT[], -- Array of keywords
  meta_og_title TEXT,
  meta_og_description TEXT,
  
  -- AI-Generated Content (LLM-Optimized)
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT,
  hero_description TEXT,
  
  -- Main Content Sections
  introduction_text TEXT, -- Opening paragraph
  why_choose_section TEXT, -- Why choose DJs for this event type in this city
  pricing_section TEXT, -- City + event type specific pricing info
  venue_section TEXT, -- Popular venues for this event type in city
  timeline_section TEXT, -- Booking timeline for this event type
  
  -- LLM-Optimized Content
  comprehensive_guide TEXT, -- Long-form guide (2000+ words) for LLM understanding
  local_insights TEXT, -- City-specific insights for this event type
  seasonal_trends JSONB, -- {spring: '', summer: '', fall: '', winter: ''}
  popular_songs JSONB, -- Popular songs for this event type in this city
  venue_recommendations JSONB, -- Array of venue recommendations
  
  -- FAQs (Critical for LLM Search)
  faqs JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of {question: '', answer: ''}
  
  -- Structured Data (JSON-LD)
  structured_data JSONB, -- Pre-generated JSON-LD schema
  
  -- Statistics & Social Proof
  dj_count INTEGER DEFAULT 0,
  average_rating DECIMAL(3,2),
  review_count INTEGER DEFAULT 0,
  average_price_range TEXT, -- e.g., '$800-$2,500'
  
  -- Content Generation Metadata
  content_generated_at TIMESTAMP WITH TIME ZONE,
  content_updated_at TIMESTAMP WITH TIME ZONE,
  content_version INTEGER DEFAULT 1,
  ai_model_used TEXT, -- e.g., 'gpt-4-turbo'
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  product_context TEXT DEFAULT 'djdash' CHECK (product_context = 'djdash'),
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Unique constraint
  UNIQUE(city_slug, event_type_slug, product_context)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_city_event_pages_city_slug ON city_event_pages(city_slug);
CREATE INDEX IF NOT EXISTS idx_city_event_pages_event_type ON city_event_pages(event_type);
CREATE INDEX IF NOT EXISTS idx_city_event_pages_full_slug ON city_event_pages(full_slug);
CREATE INDEX IF NOT EXISTS idx_city_event_pages_is_published ON city_event_pages(is_published);
CREATE INDEX IF NOT EXISTS idx_city_event_pages_product_context ON city_event_pages(product_context);

-- ============================================
-- 2. RLS POLICIES
-- ============================================
ALTER TABLE city_event_pages ENABLE ROW LEVEL SECURITY;

-- Public can view published pages
CREATE POLICY "Public can view published city event pages"
  ON city_event_pages FOR SELECT
  TO anon, authenticated
  USING (is_published = TRUE AND product_context = 'djdash');

-- Platform admins can manage all pages
CREATE POLICY "Platform admins can manage city event pages"
  ON city_event_pages FOR ALL
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
-- 3. TRIGGERS
-- ============================================

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_city_event_pages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_city_event_pages_updated_at
  BEFORE UPDATE ON city_event_pages
  FOR EACH ROW
  EXECUTE FUNCTION update_city_event_pages_updated_at();

-- Auto-generate full_slug
CREATE OR REPLACE FUNCTION generate_city_event_full_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.full_slug IS NULL OR NEW.full_slug = '' THEN
    NEW.full_slug := NEW.city_slug || '/' || NEW.event_type_slug;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER generate_city_event_full_slug_trigger
  BEFORE INSERT OR UPDATE ON city_event_pages
  FOR EACH ROW
  EXECUTE FUNCTION generate_city_event_full_slug();

-- ============================================
-- 4. COMMENTS
-- ============================================
COMMENT ON TABLE city_event_pages IS 'SEO-rich pages for city + event type combinations, optimized for LLM search';
COMMENT ON COLUMN city_event_pages.comprehensive_guide IS 'Long-form content (2000+ words) optimized for LLM understanding and ranking';
COMMENT ON COLUMN city_event_pages.faqs IS 'FAQ array critical for LLM search engines - answers common questions directly';
COMMENT ON COLUMN city_event_pages.structured_data IS 'Pre-generated JSON-LD schema for rich snippets and LLM understanding';

