-- Add theme mode setting for requests page
-- Allows admins to force light or dark mode for their page

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_theme_mode TEXT DEFAULT 'dark';

COMMENT ON COLUMN organizations.requests_theme_mode IS 
'Theme mode for requests page: "light", "dark", or "system" (follows user preference). Defaults to dark.';

