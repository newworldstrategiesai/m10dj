-- Blocked emails (e.g. from spam submissions). Contact form rejects these.
-- Used when admin marks a submission as spam so that email cannot submit again.

CREATE TABLE IF NOT EXISTS blocked_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email_lower TEXT NOT NULL,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  reason TEXT,
  source TEXT DEFAULT 'spam_submission',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(email_lower, organization_id)
);

CREATE INDEX IF NOT EXISTS idx_blocked_emails_email_lower ON blocked_emails(email_lower);
CREATE INDEX IF NOT EXISTS idx_blocked_emails_organization_id ON blocked_emails(organization_id);
-- One platform-wide block per email (organization_id IS NULL)
CREATE UNIQUE INDEX IF NOT EXISTS idx_blocked_emails_email_platform ON blocked_emails(email_lower) WHERE organization_id IS NULL;

COMMENT ON TABLE blocked_emails IS 'Emails blocked from contact form (e.g. marked as spam). organization_id NULL = platform-wide block.';

ALTER TABLE blocked_emails ENABLE ROW LEVEL SECURITY;

-- Only admins / service role can manage; contact form needs to check via service role or RLS read for anon
DROP POLICY IF EXISTS "Service role full access blocked_emails" ON blocked_emails;
CREATE POLICY "Service role full access blocked_emails"
  ON blocked_emails FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- Authenticated admins can manage (for admin UI)
DROP POLICY IF EXISTS "Admins can manage blocked_emails" ON blocked_emails;
CREATE POLICY "Admins can manage blocked_emails"
  ON blocked_emails FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM admin_roles
      WHERE user_id = auth.uid() AND is_active = true
    )
  );

-- Contact form checks blocked_emails via API (service role), so no anon policy needed.
