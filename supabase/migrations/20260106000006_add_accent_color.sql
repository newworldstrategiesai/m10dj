-- Add accent/brand color customization for requests page
-- All users can customize this

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_accent_color TEXT DEFAULT '#fcba00';

COMMENT ON COLUMN organizations.requests_accent_color IS 
'Accent/brand color for the requests page (hex format). Defaults to TipJar gold #fcba00.';

