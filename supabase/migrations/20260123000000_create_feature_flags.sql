-- Create feature_flags table for zero-downtime refactoring
-- Allows instant rollback without code deployment

CREATE TABLE IF NOT EXISTS feature_flags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  flag_name TEXT UNIQUE NOT NULL,
  enabled BOOLEAN DEFAULT false,
  rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage >= 0 AND rollout_percentage <= 100),
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for fast lookups
CREATE INDEX IF NOT EXISTS idx_feature_flags_flag_name ON feature_flags(flag_name);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_feature_flags_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_feature_flags_updated_at
  BEFORE UPDATE ON feature_flags
  FOR EACH ROW
  EXECUTE FUNCTION update_feature_flags_updated_at();

-- Insert initial feature flags for refactoring
INSERT INTO feature_flags (flag_name, enabled, rollout_percentage, description) VALUES
  ('USE_NEW_REQUESTS_PAGE', false, 0, 'Use refactored requests page component'),
  ('USE_NEW_CROWD_REQUESTS', false, 0, 'Use refactored crowd requests admin page'),
  ('USE_NEW_ADMIN_REQUESTS', false, 0, 'Use refactored admin requests settings page')
ON CONFLICT (flag_name) DO NOTHING;

-- RLS Policies (allow public read, admin write)
ALTER TABLE feature_flags ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for client-side checks)
CREATE POLICY "Feature flags are publicly readable"
  ON feature_flags FOR SELECT
  USING (true);

-- Allow admins to update (you'll need to adjust this based on your auth setup)
CREATE POLICY "Admins can update feature flags"
  ON feature_flags FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM organizations
      WHERE organizations.id = auth.uid()::text
      AND organizations.is_platform_admin = true
    )
  );

-- Grant necessary permissions
GRANT SELECT ON feature_flags TO anon, authenticated;
GRANT UPDATE ON feature_flags TO authenticated;
