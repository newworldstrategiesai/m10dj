-- Update song field labels and placeholders to new defaults
-- This updates organizations that have the old default values to the new ones

-- Update song title label from 'Song Title' to 'Enter a Song'
UPDATE public.organizations
SET requests_song_title_label = 'Enter a Song'
WHERE requests_song_title_label = 'Song Title'
   OR requests_song_title_label IS NULL;

-- Update song title placeholder from 'Enter song title' to 'Song Name - Artist Name'
UPDATE public.organizations
SET requests_song_title_placeholder = 'Song Name - Artist Name'
WHERE requests_song_title_placeholder = 'Enter song title'
   OR requests_song_title_placeholder IS NULL;

-- Also update the column defaults for future organizations
-- Note: This doesn't affect existing rows, only new ones created without explicit values
ALTER TABLE public.organizations
ALTER COLUMN requests_song_title_label SET DEFAULT 'Enter a Song';

ALTER TABLE public.organizations
ALTER COLUMN requests_song_title_placeholder SET DEFAULT 'Song Name - Artist Name';

-- Add comments
COMMENT ON COLUMN public.organizations.requests_song_title_label IS 'Label for the song input field (default: "Enter a Song")';
COMMENT ON COLUMN public.organizations.requests_song_title_placeholder IS 'Placeholder text for the combined song/artist input field (default: "Song Name - Artist Name")';
