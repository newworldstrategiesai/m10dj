-- Add button style setting for requests page
-- Allows admins to choose between gradient or flat buttons

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_button_style TEXT DEFAULT 'gradient';

COMMENT ON COLUMN organizations.requests_button_style IS 
'Button style for requests page: "gradient" for gradient buttons, "flat" for solid color buttons. Defaults to gradient.';

