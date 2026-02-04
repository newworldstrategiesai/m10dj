-- Allow super admin to enable "Request a Song" on the public Meet page (sidebar takes over chat panel)
ALTER TABLE meet_rooms
ADD COLUMN IF NOT EXISTS request_a_song_enabled BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN meet_rooms.request_a_song_enabled IS 'When true, guests see a Request a Song button that opens the requests form in the chat panel (host org used)';
