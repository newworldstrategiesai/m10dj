-- Create live_events table for public events with ticketing
-- This table stores live/public events like DJ performances at venues

CREATE TABLE IF NOT EXISTS live_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Event identification
  event_id TEXT UNIQUE NOT NULL, -- e.g., 'dj-ben-murray-silky-osullivans-2026-12-27'
  slug TEXT UNIQUE NOT NULL, -- URL slug for the event page
  title TEXT NOT NULL, -- e.g., "DJ Ben Murray Live at Silky O'Sullivan's"
  
  -- Event details
  description TEXT,
  event_date DATE NOT NULL,
  event_time TIME,
  end_time TIME,
  
  -- Venue information
  venue_name TEXT NOT NULL,
  venue_address TEXT NOT NULL,
  venue_url TEXT,
  
  -- Event status and visibility
  is_published BOOLEAN DEFAULT FALSE,
  is_featured BOOLEAN DEFAULT FALSE,
  
  -- Media
  cover_photo_url TEXT,
  featured_image_url TEXT,
  
  -- Ticketing information
  ticketing_enabled BOOLEAN DEFAULT TRUE,
  ticket_price DECIMAL(10,2),
  capacity INTEGER, -- Maximum number of tickets/attendees
  
  -- SEO and metadata
  seo_title TEXT,
  seo_description TEXT,
  seo_keywords TEXT[],
  
  -- Display order
  display_order INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  published_at TIMESTAMP WITH TIME ZONE
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_live_events_event_id ON live_events(event_id);
CREATE INDEX IF NOT EXISTS idx_live_events_slug ON live_events(slug);
CREATE INDEX IF NOT EXISTS idx_live_events_event_date ON live_events(event_date);
CREATE INDEX IF NOT EXISTS idx_live_events_is_published ON live_events(is_published);
CREATE INDEX IF NOT EXISTS idx_live_events_is_featured ON live_events(is_featured);
CREATE INDEX IF NOT EXISTS idx_live_events_display_order ON live_events(display_order);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_live_events_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_live_events_updated_at_trigger
  BEFORE UPDATE ON live_events
  FOR EACH ROW
  EXECUTE FUNCTION update_live_events_updated_at();

-- Enable Row Level Security
ALTER TABLE live_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Policy 1: Service role can do everything (for API operations)
CREATE POLICY "Service role can manage all live events"
  ON live_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Policy 2: Authenticated users (admins) can manage live events
CREATE POLICY "Authenticated users can manage live events"
  ON live_events FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- Policy 3: Public can view published live events
CREATE POLICY "Public can view published live events"
  ON live_events FOR SELECT
  USING (is_published = TRUE);

-- Grant necessary permissions
GRANT SELECT ON live_events TO anon;
GRANT ALL ON live_events TO authenticated;
GRANT ALL ON live_events TO service_role;

-- Add helpful comments
COMMENT ON TABLE live_events IS 'Stores public/live events with ticketing capabilities (e.g., DJ performances at venues)';
COMMENT ON COLUMN live_events.event_id IS 'Unique event identifier used in URLs and ticket references';
COMMENT ON COLUMN live_events.slug IS 'URL slug for the event page (e.g., dj-ben-murray-silky-osullivans-2026-12-27)';
COMMENT ON COLUMN live_events.ticketing_enabled IS 'Whether ticketing is enabled for this event';
COMMENT ON COLUMN live_events.ticket_price IS 'Price per ticket in USD';

