-- Add accent/brand color customization for requests page
-- All users can customize this
-- Defaults: TipJar = #10b981 (green), DJ Dash = #3b82f6 (blue), M10DJ = #fcba00 (gold)

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_accent_color TEXT DEFAULT '#fcba00';

COMMENT ON COLUMN organizations.requests_accent_color IS 
'Accent/brand color for the requests page (hex format). Defaults vary by product: TipJar = #10b981 (green), DJ Dash = #3b82f6 (blue), M10DJ = #fcba00 (gold).';

