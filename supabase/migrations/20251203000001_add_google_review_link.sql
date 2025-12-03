-- Add google_review_link field to organizations table
-- This allows admins to configure the Google Review link used in review request emails

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS google_review_link TEXT;

COMMENT ON COLUMN organizations.google_review_link IS 'Google Review link to use in review request emails and SMS messages';

