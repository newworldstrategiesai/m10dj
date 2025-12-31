-- Add album_art_url column to crowd_requests table
-- Stores the album art URL extracted from music service links (Spotify, Tidal, etc.)

ALTER TABLE public.crowd_requests
ADD COLUMN IF NOT EXISTS album_art_url TEXT;

COMMENT ON COLUMN public.crowd_requests.album_art_url IS 'URL to album art image extracted from music service links (Spotify, Tidal, YouTube, etc.)';

CREATE INDEX IF NOT EXISTS idx_crowd_requests_album_art_url ON crowd_requests(album_art_url) WHERE album_art_url IS NOT NULL;

