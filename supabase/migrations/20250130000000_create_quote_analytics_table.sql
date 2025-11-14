-- Create quote_analytics table to track quote page views and engagement
CREATE TABLE IF NOT EXISTS quote_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quote_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('page_view', 'time_on_page', 'page_exit', 'package_expanded', 'package_selected', 'addon_selected')),
  time_spent INTEGER, -- Time in seconds
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes for efficient querying
  CONSTRAINT quote_analytics_quote_id_fkey FOREIGN KEY (quote_id) 
    REFERENCES contacts(id) ON DELETE CASCADE
);

-- Create indexes for common queries
CREATE INDEX IF NOT EXISTS idx_quote_analytics_quote_id ON quote_analytics(quote_id);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_event_type ON quote_analytics(event_type);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_created_at ON quote_analytics(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quote_analytics_time_spent ON quote_analytics(time_spent) WHERE time_spent IS NOT NULL;

-- Add comment
COMMENT ON TABLE quote_analytics IS 'Tracks quote page views, time on page, and engagement metrics for service selection pages';

