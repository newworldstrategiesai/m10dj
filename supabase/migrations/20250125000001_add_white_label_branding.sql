-- Add white-label branding fields to organizations table
-- Allows organizations to customize their branding (logo, colors, etc.)

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS white_label_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS custom_logo_url TEXT,
ADD COLUMN IF NOT EXISTS custom_favicon_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color TEXT DEFAULT '#8B5CF6', -- Purple default
ADD COLUMN IF NOT EXISTS secondary_color TEXT DEFAULT '#EC4899', -- Pink default
ADD COLUMN IF NOT EXISTS background_color TEXT DEFAULT '#FFFFFF',
ADD COLUMN IF NOT EXISTS text_color TEXT DEFAULT '#1F2937',
ADD COLUMN IF NOT EXISTS font_family TEXT DEFAULT 'system-ui, sans-serif',
ADD COLUMN IF NOT EXISTS custom_domain TEXT, -- For future custom domain support
ADD COLUMN IF NOT EXISTS branding_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for white-label lookups
CREATE INDEX IF NOT EXISTS idx_organizations_white_label_enabled ON organizations(white_label_enabled);
CREATE INDEX IF NOT EXISTS idx_organizations_custom_domain ON organizations(custom_domain) WHERE custom_domain IS NOT NULL;

-- Update subscription_tier check constraint to include 'white_label'
ALTER TABLE public.organizations
DROP CONSTRAINT IF EXISTS organizations_subscription_tier_check;

ALTER TABLE public.organizations
ADD CONSTRAINT organizations_subscription_tier_check 
CHECK (subscription_tier IN ('starter', 'professional', 'enterprise', 'white_label'));

-- Create trigger to update branding_updated_at
CREATE OR REPLACE FUNCTION update_organizations_branding_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Only update branding_updated_at if branding fields changed
  IF (
    OLD.custom_logo_url IS DISTINCT FROM NEW.custom_logo_url OR
    OLD.custom_favicon_url IS DISTINCT FROM NEW.custom_favicon_url OR
    OLD.primary_color IS DISTINCT FROM NEW.primary_color OR
    OLD.secondary_color IS DISTINCT FROM NEW.secondary_color OR
    OLD.background_color IS DISTINCT FROM NEW.background_color OR
    OLD.text_color IS DISTINCT FROM NEW.text_color OR
    OLD.font_family IS DISTINCT FROM NEW.font_family OR
    OLD.custom_domain IS DISTINCT FROM NEW.custom_domain
  ) THEN
    NEW.branding_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_branding_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_branding_updated_at();

-- Add comments
COMMENT ON COLUMN public.organizations.white_label_enabled IS 'Whether white-label branding is enabled for this organization';
COMMENT ON COLUMN public.organizations.custom_logo_url IS 'URL to the organization''s custom logo (stored in Supabase Storage)';
COMMENT ON COLUMN public.organizations.custom_favicon_url IS 'URL to the organization''s custom favicon';
COMMENT ON COLUMN public.organizations.primary_color IS 'Primary brand color (hex code)';
COMMENT ON COLUMN public.organizations.secondary_color IS 'Secondary brand color (hex code)';
COMMENT ON COLUMN public.organizations.background_color IS 'Background color (hex code)';
COMMENT ON COLUMN public.organizations.text_color IS 'Text color (hex code)';
COMMENT ON COLUMN public.organizations.font_family IS 'Font family for custom branding';
COMMENT ON COLUMN public.organizations.custom_domain IS 'Custom domain for white-label (future feature)';
COMMENT ON COLUMN public.organizations.branding_updated_at IS 'Timestamp when branding was last updated';

