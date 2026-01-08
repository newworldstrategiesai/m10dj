-- Add secondary brand colors for requests page
-- These allow users to customize additional accented parts of the page
-- Secondary color 1 and 2 can be used for borders, shadows, highlights, etc.

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_secondary_color_1 TEXT;

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_secondary_color_2 TEXT;

COMMENT ON COLUMN organizations.requests_secondary_color_1 IS 
'Secondary brand color #1 for the requests page (hex format). Used for borders, shadows, highlights, and other accented elements. Optional - if not set, accent color will be used.';

COMMENT ON COLUMN organizations.requests_secondary_color_2 IS 
'Secondary brand color #2 for the requests page (hex format). Used for additional accented elements like hover states, gradients, etc. Optional - if not set, accent color will be used.';

