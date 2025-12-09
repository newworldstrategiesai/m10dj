-- Add audio file upload support to crowd_requests table
-- Allows users to upload their own audio files for $100 per file
-- Includes artist rights confirmation

ALTER TABLE public.crowd_requests
ADD COLUMN IF NOT EXISTS audio_file_url TEXT,
ADD COLUMN IF NOT EXISTS is_custom_audio BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS audio_upload_fee INTEGER DEFAULT 10000, -- $100.00 in cents
ADD COLUMN IF NOT EXISTS artist_rights_confirmed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS is_artist BOOLEAN DEFAULT FALSE;

-- Add comments
COMMENT ON COLUMN public.crowd_requests.audio_file_url IS 'URL to uploaded audio file (stored in Supabase Storage)';
COMMENT ON COLUMN public.crowd_requests.is_custom_audio IS 'Whether this request includes a custom audio file upload';
COMMENT ON COLUMN public.crowd_requests.audio_upload_fee IS 'Fee for audio upload in cents (default $100.00)';
COMMENT ON COLUMN public.crowd_requests.artist_rights_confirmed IS 'User confirmed they own the rights to the music';
COMMENT ON COLUMN public.crowd_requests.is_artist IS 'Whether the requester is the artist (affects pricing - promotion vs play)';

-- Create index for audio uploads
CREATE INDEX IF NOT EXISTS idx_crowd_requests_custom_audio ON crowd_requests(is_custom_audio) WHERE is_custom_audio = TRUE;

