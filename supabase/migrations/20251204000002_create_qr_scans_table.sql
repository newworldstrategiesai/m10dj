-- Create qr_scans table to track QR code scans and conversions
CREATE TABLE IF NOT EXISTS qr_scans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_qr_code TEXT NOT NULL, -- The QR code identifier (event code or 'public' for public requests page)
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_agent TEXT,
  ip_address TEXT,
  referrer TEXT,
  scanned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  converted BOOLEAN DEFAULT FALSE, -- Whether this scan led to a request submission
  converted_at TIMESTAMPTZ, -- When the conversion happened
  request_id UUID REFERENCES crowd_requests(id) ON DELETE SET NULL, -- Link to the request if converted
  session_id TEXT, -- Browser session identifier
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_qr_scans_event_code ON qr_scans(event_qr_code);
CREATE INDEX IF NOT EXISTS idx_qr_scans_organization_id ON qr_scans(organization_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_converted ON qr_scans(converted);
CREATE INDEX IF NOT EXISTS idx_qr_scans_scanned_at ON qr_scans(scanned_at);
CREATE INDEX IF NOT EXISTS idx_qr_scans_request_id ON qr_scans(request_id);
CREATE INDEX IF NOT EXISTS idx_qr_scans_session_id ON qr_scans(session_id);

-- Enable RLS
ALTER TABLE qr_scans ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view scans for their organization
CREATE POLICY "Users can view scans for their organization"
  ON qr_scans
  FOR SELECT
  USING (
    organization_id IN (
      SELECT id FROM organizations WHERE owner_id = auth.uid()
    )
    OR organization_id IS NULL -- Allow viewing public scans
  );

-- Policy: Service role can do everything
CREATE POLICY "Service role can manage all scans"
  ON qr_scans
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_qr_scans_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER update_qr_scans_updated_at
  BEFORE UPDATE ON qr_scans
  FOR EACH ROW
  EXECUTE FUNCTION update_qr_scans_updated_at();

-- Add comment
COMMENT ON TABLE qr_scans IS 'Tracks QR code scans and whether they converted into requests';

