-- Add cover photo fields to organizations table for requests page hero images
-- Allows organizations to customize their requests page with artist or venue photos

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requests_artist_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requests_venue_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requests_cover_photo_updated_at TIMESTAMP WITH TIME ZONE;

-- Create index for cover photo lookups
CREATE INDEX IF NOT EXISTS idx_organizations_requests_cover_photo ON organizations(requests_cover_photo_url) WHERE requests_cover_photo_url IS NOT NULL;

-- Add comments
COMMENT ON COLUMN public.organizations.requests_cover_photo_url IS 'Primary cover photo URL for requests page hero section (stored in Supabase Storage)';
COMMENT ON COLUMN public.organizations.requests_artist_photo_url IS 'Artist/DJ photo URL for requests page (alternative to venue photo)';
COMMENT ON COLUMN public.organizations.requests_venue_photo_url IS 'Venue photo URL for requests page (alternative to artist photo)';
COMMENT ON COLUMN public.organizations.requests_cover_photo_updated_at IS 'Timestamp when cover photos were last updated';

-- Create trigger to update requests_cover_photo_updated_at
CREATE OR REPLACE FUNCTION update_organizations_requests_cover_photo_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  -- Update timestamp if any cover photo fields changed
  IF (
    OLD.requests_cover_photo_url IS DISTINCT FROM NEW.requests_cover_photo_url OR
    OLD.requests_artist_photo_url IS DISTINCT FROM NEW.requests_artist_photo_url OR
    OLD.requests_venue_photo_url IS DISTINCT FROM NEW.requests_venue_photo_url
  ) THEN
    NEW.requests_cover_photo_updated_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_organizations_requests_cover_photo_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION update_organizations_requests_cover_photo_updated_at();

