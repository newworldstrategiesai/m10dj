-- Create success_page_views table to track when users access the success page
CREATE TABLE IF NOT EXISTS success_page_views (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  request_id UUID NOT NULL REFERENCES crowd_requests(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  session_id TEXT, -- Browser session identifier
  is_first_view BOOLEAN DEFAULT TRUE, -- True if this is the first time viewing the success page
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_success_page_views_request_id ON success_page_views(request_id);
CREATE INDEX IF NOT EXISTS idx_success_page_views_organization_id ON success_page_views(organization_id);
CREATE INDEX IF NOT EXISTS idx_success_page_views_viewed_at ON success_page_views(viewed_at);
CREATE INDEX IF NOT EXISTS idx_success_page_views_session_id ON success_page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_success_page_views_is_first_view ON success_page_views(is_first_view);

-- Enable RLS
ALTER TABLE success_page_views ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view success page views for their organization's requests
CREATE POLICY "Users can view success page views for their organization"
  ON success_page_views
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IS NULL
  );

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all success page views"
  ON success_page_views
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_success_page_views_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_success_page_views_updated_at
  BEFORE UPDATE ON success_page_views
  FOR EACH ROW
  EXECUTE FUNCTION update_success_page_views_updated_at();

-- Add comment
COMMENT ON TABLE success_page_views IS 'Tracks when users access the success/thank you page for crowd requests';

