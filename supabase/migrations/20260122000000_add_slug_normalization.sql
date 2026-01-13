-- Add slug normalization function for flexible slug matching
-- This allows slugs like "ben-spins" and "benspins" to match the same organization
-- The function removes hyphens from slugs for comparison purposes

CREATE OR REPLACE FUNCTION public.normalize_slug(slug_text TEXT)
RETURNS TEXT AS $$
BEGIN
  -- Remove hyphens and convert to lowercase for comparison
  RETURN LOWER(REGEXP_REPLACE(COALESCE(slug_text, ''), '-', '', 'g'));
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Add comment for documentation
COMMENT ON FUNCTION public.normalize_slug(TEXT) IS 'Normalizes a slug by removing hyphens and converting to lowercase. Used for flexible slug matching (e.g., "ben-spins" matches "benspins")';

-- Create an index on normalized slugs for better query performance
-- This allows fast lookups when matching normalized slugs
CREATE INDEX IF NOT EXISTS idx_organizations_normalized_slug 
ON public.organizations (normalize_slug(slug));

-- Add comment for the index
COMMENT ON INDEX idx_organizations_normalized_slug IS 'Index on normalized slug (without hyphens) for flexible slug matching';

-- Create RPC function to get organization by normalized slug
-- This allows lookups that match both "ben-spins" and "benspins"
CREATE OR REPLACE FUNCTION public.get_organization_by_normalized_slug(input_slug TEXT)
RETURNS TABLE (
  id UUID,
  name TEXT,
  slug TEXT,
  owner_id UUID,
  organization_type TEXT,
  parent_organization_id UUID,
  performer_slug TEXT,
  is_active BOOLEAN,
  subscription_status TEXT,
  product_context TEXT,
  artist_page_enabled BOOLEAN,
  requests_header_artist_name TEXT,
  requests_header_location TEXT,
  requests_header_date TEXT,
  requests_page_title TEXT,
  requests_page_description TEXT,
  requests_assistant_enabled BOOLEAN,
  requests_assistant_show_quick_actions BOOLEAN,
  requests_assistant_quick_action_has_played BOOLEAN,
  requests_assistant_quick_action_when_will_play BOOLEAN,
  requests_accent_color TEXT,
  requests_theme_mode TEXT,
  requests_bidding_minimum_bid INTEGER,
  white_label_enabled BOOLEAN,
  custom_logo_url TEXT,
  primary_color TEXT,
  secondary_color TEXT,
  background_color TEXT,
  text_color TEXT,
  font_family TEXT,
  custom_domain TEXT,
  social_links JSONB,
  created_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    o.id,
    o.name,
    o.slug,
    o.owner_id,
    o.organization_type,
    o.parent_organization_id,
    o.performer_slug,
    o.is_active,
    o.subscription_status,
    o.product_context,
    o.artist_page_enabled,
    o.requests_header_artist_name,
    o.requests_header_location,
    o.requests_header_date,
    o.requests_page_title,
    o.requests_page_description,
    o.requests_assistant_enabled,
    o.requests_assistant_show_quick_actions,
    o.requests_assistant_quick_action_has_played,
    o.requests_assistant_quick_action_when_will_play,
    o.requests_accent_color,
    o.requests_theme_mode,
    o.requests_bidding_minimum_bid,
    o.white_label_enabled,
    o.custom_logo_url,
    o.primary_color,
    o.secondary_color,
    o.background_color,
    o.text_color,
    o.font_family,
    o.custom_domain,
    o.social_links,
    o.created_at,
    o.updated_at
  FROM public.organizations o
  WHERE normalize_slug(o.slug) = normalize_slug(input_slug)
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add comment for the RPC function
COMMENT ON FUNCTION public.get_organization_by_normalized_slug(TEXT) IS 'Gets an organization by slug using normalized matching (removes hyphens). Allows "ben-spins" and "benspins" to match the same organization.';

-- Grant execute permission to authenticated and anon users (for public lookups)
GRANT EXECUTE ON FUNCTION public.get_organization_by_normalized_slug(TEXT) TO authenticated, anon;
