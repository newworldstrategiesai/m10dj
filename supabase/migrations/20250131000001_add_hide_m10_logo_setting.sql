-- Add hide M10 logo setting (super admin only)
-- Allows super admin to disable the M10 logo on requests pages

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_hide_m10_logo BOOLEAN DEFAULT false;

COMMENT ON COLUMN organizations.requests_hide_m10_logo IS 
'Whether to hide the M10 DJ Company logo at the top of requests pages. Only accessible by super admin (djbenmurray@gmail.com).';

-- Add M10 logo size settings (super admin only)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_m10_logo_height_mobile INTEGER DEFAULT 54,
ADD COLUMN IF NOT EXISTS requests_m10_logo_height_desktop INTEGER DEFAULT 68,
ADD COLUMN IF NOT EXISTS requests_m10_logo_min_width_mobile INTEGER DEFAULT 120,
ADD COLUMN IF NOT EXISTS requests_m10_logo_min_width_desktop INTEGER DEFAULT 150;

COMMENT ON COLUMN organizations.requests_m10_logo_height_mobile IS 
'M10 logo height in pixels on mobile devices. Default: 54px. Super admin only.';
COMMENT ON COLUMN organizations.requests_m10_logo_height_desktop IS 
'M10 logo height in pixels on desktop devices. Default: 68px. Super admin only.';
COMMENT ON COLUMN organizations.requests_m10_logo_min_width_mobile IS 
'M10 logo minimum width in pixels on mobile devices. Default: 120px. Super admin only.';
COMMENT ON COLUMN organizations.requests_m10_logo_min_width_desktop IS 
'M10 logo minimum width in pixels on desktop devices. Default: 150px. Super admin only.';

-- Add M10 logo position settings (super admin only)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_m10_logo_position TEXT DEFAULT 'left' CHECK (requests_m10_logo_position IN ('left', 'center', 'right'));

COMMENT ON COLUMN organizations.requests_m10_logo_position IS 
'M10 logo horizontal position: left, center, or right. Default: left. Super admin only.';

-- Add custom company logo (for super admin and organization owners)
ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS requests_company_logo_url TEXT;

COMMENT ON COLUMN organizations.requests_company_logo_url IS 
'Custom company logo URL that appears in place of the M10 logo on requests pages. Can be set by super admin or organization owner.';
