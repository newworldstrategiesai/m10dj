-- Add artist page fields to organizations table
-- This allows artists to control their public page at tipjar.live/{slug}

ALTER TABLE organizations
ADD COLUMN IF NOT EXISTS artist_page_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS artist_page_bio TEXT,
ADD COLUMN IF NOT EXISTS artist_page_headline TEXT,
ADD COLUMN IF NOT EXISTS artist_page_profile_image_url TEXT,
ADD COLUMN IF NOT EXISTS artist_page_cover_image_url TEXT,
ADD COLUMN IF NOT EXISTS artist_page_gallery_images TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artist_page_video_urls TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS artist_page_links JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS artist_page_contact_email TEXT,
ADD COLUMN IF NOT EXISTS artist_page_contact_phone TEXT,
ADD COLUMN IF NOT EXISTS artist_page_booking_url TEXT,
ADD COLUMN IF NOT EXISTS artist_page_custom_css TEXT;

COMMENT ON COLUMN organizations.artist_page_enabled IS 'Whether the artist page is enabled and visible at tipjar.live/{slug}';
COMMENT ON COLUMN organizations.artist_page_bio IS 'Artist bio/description for the public page';
COMMENT ON COLUMN organizations.artist_page_headline IS 'Headline/tagline for the artist page';
COMMENT ON COLUMN organizations.artist_page_profile_image_url IS 'Profile image URL for the artist page';
COMMENT ON COLUMN organizations.artist_page_cover_image_url IS 'Cover/hero image URL for the artist page';
COMMENT ON COLUMN organizations.artist_page_gallery_images IS 'Array of gallery image URLs';
COMMENT ON COLUMN organizations.artist_page_video_urls IS 'Array of video URLs (YouTube, Vimeo, etc.)';
COMMENT ON COLUMN organizations.artist_page_links IS 'Array of link objects: [{label: string, url: string, icon: string}]';
COMMENT ON COLUMN organizations.artist_page_contact_email IS 'Contact email displayed on artist page';
COMMENT ON COLUMN organizations.artist_page_contact_phone IS 'Contact phone displayed on artist page';
COMMENT ON COLUMN organizations.artist_page_booking_url IS 'Booking/calendar link URL';
COMMENT ON COLUMN organizations.artist_page_custom_css IS 'Custom CSS for styling the artist page';

-- Example artist_page_links structure:
-- [
--   {"label": "Spotify", "url": "https://spotify.com/artist/...", "icon": "music"},
--   {"label": "Apple Music", "url": "https://music.apple.com/...", "icon": "music"},
--   {"label": "Bandcamp", "url": "https://bandcamp.com/...", "icon": "music"},
--   {"label": "Merch Store", "url": "https://store.example.com", "icon": "shopping-bag"}
-- ]

