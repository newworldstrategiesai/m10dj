-- Add custom header logo settings for organization pages
-- This allows TipJar users to customize the logo shown in the header

-- Custom logo URL
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_header_logo_url TEXT;

COMMENT ON COLUMN organizations.requests_header_logo_url IS 
'Custom logo URL for the header. If set, this appears instead of the default TipJar/M10 logo.';

-- Permission to customize logo (can be plan-gated)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS can_customize_header_logo BOOLEAN DEFAULT false;

COMMENT ON COLUMN organizations.can_customize_header_logo IS 
'Whether this organization can set a custom header logo. Defaults to false (shows default logo). Enable for premium plans.';

