-- Database schema for follow-up system
-- Run this in your Supabase SQL editor to create the necessary tables

-- Table to track quote page views (for follow-up system)
CREATE TABLE IF NOT EXISTS quote_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  quote_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_quote_page_views_contact ON quote_page_views(contact_id);
CREATE INDEX IF NOT EXISTS idx_quote_page_views_created ON quote_page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_quote_page_views_event ON quote_page_views(event_type);

-- Table to track sent follow-ups (prevent duplicates)
CREATE TABLE IF NOT EXISTS followup_sent (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  contact_id UUID NOT NULL,
  followup_type TEXT NOT NULL,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB DEFAULT '{}',
  CONSTRAINT fk_contact FOREIGN KEY (contact_id) REFERENCES contacts(id) ON DELETE CASCADE,
  UNIQUE(contact_id, followup_type)
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_followup_sent_contact ON followup_sent(contact_id);
CREATE INDEX IF NOT EXISTS idx_followup_sent_type ON followup_sent(followup_type);
CREATE INDEX IF NOT EXISTS idx_followup_sent_date ON followup_sent(sent_at);

-- Table for quote analytics (if not exists)
CREATE TABLE IF NOT EXISTS quote_analytics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  quote_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  time_spent INTEGER,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for efficient queries
CREATE INDEX IF NOT EXISTS idx_quote_analytics_quote ON quote_analytics(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_event ON quote_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_date ON quote_analytics(created_at);

-- Enable Row Level Security (optional, adjust based on your needs)
ALTER TABLE quote_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE followup_sent ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_analytics ENABLE ROW LEVEL SECURITY;

-- Policy: Allow service role to do everything (for API calls)
-- Note: DROP existing policies first if they exist, then create new ones
DROP POLICY IF EXISTS "Service role can manage quote_page_views" ON quote_page_views;
CREATE POLICY "Service role can manage quote_page_views"
  ON quote_page_views FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage followup_sent" ON followup_sent;
CREATE POLICY "Service role can manage followup_sent"
  ON followup_sent FOR ALL
  USING (true)
  WITH CHECK (true);

DROP POLICY IF EXISTS "Service role can manage quote_analytics" ON quote_analytics;
CREATE POLICY "Service role can manage quote_analytics"
  ON quote_analytics FOR ALL
  USING (true)
  WITH CHECK (true);

