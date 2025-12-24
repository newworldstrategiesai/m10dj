-- Create case_studies table for showcasing past events
-- This is separate from the events table (which tracks bookings)
-- Case studies are published content showcasing successful events

CREATE TABLE IF NOT EXISTS case_studies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Event details
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  excerpt TEXT,
  content TEXT NOT NULL,
  
  -- Event information (can reference events table or be standalone)
  event_date DATE,
  event_type TEXT, -- 'Wedding', 'Corporate Event', 'Birthday Party', etc.
  venue_name TEXT,
  venue_address TEXT,
  number_of_guests INTEGER,
  
  -- Content details
  featured_image_url TEXT,
  gallery_images TEXT[],
  highlights TEXT[], -- Array of key highlights/features
  
  -- Testimonial (can reference testimonials table)
  testimonial_id UUID, -- Optional reference to testimonials table
  testimonial JSONB, -- Or embed testimonial data directly
  
  -- Publishing
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  display_order INTEGER DEFAULT 0,
  
  -- SEO
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_case_studies_slug ON case_studies(slug);
CREATE INDEX IF NOT EXISTS idx_case_studies_is_published ON case_studies(is_published);
CREATE INDEX IF NOT EXISTS idx_case_studies_is_featured ON case_studies(is_featured);
CREATE INDEX IF NOT EXISTS idx_case_studies_venue_name ON case_studies(venue_name);
CREATE INDEX IF NOT EXISTS idx_case_studies_event_type ON case_studies(event_type);
CREATE INDEX IF NOT EXISTS idx_case_studies_event_date ON case_studies(event_date);
CREATE INDEX IF NOT EXISTS idx_case_studies_display_order ON case_studies(display_order);

-- Add comment
COMMENT ON TABLE case_studies IS 'Published case studies showcasing successful past events. Used for SEO and demonstrating expertise.';

