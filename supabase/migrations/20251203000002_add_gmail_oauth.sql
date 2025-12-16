-- Add Gmail OAuth fields to organizations table
-- This allows each organization to connect their Gmail account for sending emails

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS gmail_access_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_refresh_token TEXT,
ADD COLUMN IF NOT EXISTS gmail_token_expiry TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS gmail_email_address TEXT,
ADD COLUMN IF NOT EXISTS gmail_connected_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS email_provider VARCHAR(20) DEFAULT 'resend' CHECK (email_provider IN ('resend', 'gmail'));

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_organizations_email_provider ON organizations(email_provider);

-- Add comment
COMMENT ON COLUMN organizations.gmail_access_token IS 'Encrypted Gmail OAuth access token';
COMMENT ON COLUMN organizations.gmail_refresh_token IS 'Encrypted Gmail OAuth refresh token';
COMMENT ON COLUMN organizations.gmail_token_expiry IS 'When the access token expires';
COMMENT ON COLUMN organizations.gmail_email_address IS 'The Gmail address connected';
COMMENT ON COLUMN organizations.gmail_connected_at IS 'When Gmail was connected';
COMMENT ON COLUMN organizations.email_provider IS 'Which email provider to use: resend or gmail';

