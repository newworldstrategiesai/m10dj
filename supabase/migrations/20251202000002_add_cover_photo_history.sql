-- Add cover photo history fields to organizations table
-- This stores arrays of previously used photo URLs for easy reuse

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_cover_photo_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS requests_artist_photo_history JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS requests_venue_photo_history JSONB DEFAULT '[]'::jsonb;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.requests_cover_photo_history IS 'Array of previously used primary cover photo URLs, stored as JSONB for easy querying and updates. Most recent URLs appear first.';
COMMENT ON COLUMN public.organizations.requests_artist_photo_history IS 'Array of previously used artist photo URLs, stored as JSONB for easy querying and updates. Most recent URLs appear first.';
COMMENT ON COLUMN public.organizations.requests_venue_photo_history IS 'Array of previously used venue photo URLs, stored as JSONB for easy querying and updates. Most recent URLs appear first.';

