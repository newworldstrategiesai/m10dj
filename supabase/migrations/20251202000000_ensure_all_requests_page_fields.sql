-- Ensure all requests page settings fields exist in organizations table
-- This migration is idempotent and safe to run multiple times

-- Header fields (if not already added by 20250202000001)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_header_artist_name TEXT,
ADD COLUMN IF NOT EXISTS requests_header_location TEXT,
ADD COLUMN IF NOT EXISTS requests_header_date TEXT;

-- Cover photo fields (if not already added)
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_cover_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requests_artist_photo_url TEXT,
ADD COLUMN IF NOT EXISTS requests_venue_photo_url TEXT;

-- Basic page settings
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_page_title TEXT DEFAULT 'Request a Song or Shoutout | M10 DJ Company',
ADD COLUMN IF NOT EXISTS requests_page_description TEXT,
ADD COLUMN IF NOT EXISTS requests_main_heading TEXT DEFAULT 'What would you like to request?',
ADD COLUMN IF NOT EXISTS requests_song_request_label TEXT DEFAULT 'Song Request',
ADD COLUMN IF NOT EXISTS requests_shoutout_label TEXT DEFAULT 'Shoutout',
ADD COLUMN IF NOT EXISTS requests_default_request_type TEXT DEFAULT 'song_request' CHECK (requests_default_request_type IN ('song_request', 'shoutout')),
ADD COLUMN IF NOT EXISTS requests_show_audio_upload BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_show_fast_track BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_show_next_song BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_show_bundle_discount BOOLEAN DEFAULT TRUE;

-- Music link section
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_music_link_label TEXT DEFAULT 'Paste Music Link (Optional)',
ADD COLUMN IF NOT EXISTS requests_music_link_placeholder TEXT DEFAULT 'Paste YouTube, Spotify, SoundCloud, Tidal, or Apple Music link',
ADD COLUMN IF NOT EXISTS requests_music_link_help_text TEXT DEFAULT 'We''ll automatically fill in the song title and artist name',
ADD COLUMN IF NOT EXISTS requests_manual_entry_divider TEXT DEFAULT 'Or enter manually',
ADD COLUMN IF NOT EXISTS requests_start_over_text TEXT DEFAULT 'Start over';

-- Song request fields
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_song_title_label TEXT DEFAULT 'Song Title',
ADD COLUMN IF NOT EXISTS requests_song_title_placeholder TEXT DEFAULT 'Enter song title',
ADD COLUMN IF NOT EXISTS requests_artist_name_label TEXT DEFAULT 'Artist Name',
ADD COLUMN IF NOT EXISTS requests_artist_name_placeholder TEXT DEFAULT 'Enter artist name';

-- Audio upload section
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_audio_upload_label TEXT DEFAULT 'Upload Your Own Audio File',
ADD COLUMN IF NOT EXISTS requests_audio_upload_description TEXT DEFAULT 'Upload your own audio file to be played. This is perfect for upcoming artists or custom tracks. ($100 per file)',
ADD COLUMN IF NOT EXISTS requests_artist_rights_text TEXT DEFAULT 'I confirm that I own the rights to this music or have permission to use it',
ADD COLUMN IF NOT EXISTS requests_is_artist_text TEXT DEFAULT 'I am the artist (this is for promotion, not just a play)',
ADD COLUMN IF NOT EXISTS requests_audio_fee_text TEXT DEFAULT '+$100.00 for audio upload';

-- Shoutout fields
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_recipient_name_label TEXT DEFAULT 'Recipient Name',
ADD COLUMN IF NOT EXISTS requests_recipient_name_placeholder TEXT DEFAULT 'Who is this shoutout for?',
ADD COLUMN IF NOT EXISTS requests_message_label TEXT DEFAULT 'Message',
ADD COLUMN IF NOT EXISTS requests_message_placeholder TEXT DEFAULT 'What would you like to say?';

-- Buttons & steps
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_submit_button_text TEXT DEFAULT 'Submit Request',
ADD COLUMN IF NOT EXISTS requests_step_1_text TEXT DEFAULT 'Step 1 of 2: Choose your request',
ADD COLUMN IF NOT EXISTS requests_step_2_text TEXT DEFAULT 'Step 2 of 2: Payment';

-- Add helpful comments
COMMENT ON COLUMN public.organizations.requests_header_artist_name IS 'Artist/DJ name displayed in the requests page header';
COMMENT ON COLUMN public.organizations.requests_header_location IS 'Location/venue name displayed in the requests page header';
COMMENT ON COLUMN public.organizations.requests_header_date IS 'Date displayed in the requests page header';
COMMENT ON COLUMN public.organizations.requests_cover_photo_url IS 'Primary cover photo URL for requests page';
COMMENT ON COLUMN public.organizations.requests_artist_photo_url IS 'Fallback artist photo URL for requests page';
COMMENT ON COLUMN public.organizations.requests_venue_photo_url IS 'Fallback venue photo URL for requests page';
COMMENT ON COLUMN public.organizations.requests_page_title IS 'Page title for SEO and browser tab';
COMMENT ON COLUMN public.organizations.requests_page_description IS 'Meta description for SEO';
COMMENT ON COLUMN public.organizations.requests_main_heading IS 'Main heading on requests page';
COMMENT ON COLUMN public.organizations.requests_default_request_type IS 'Default request type selected when page loads (song_request or shoutout)';

