-- Create a test playlist for the super admin to verify the fix
-- This will help confirm the playlists page loads properly

INSERT INTO user_playlists (
    organization_id,
    user_id,
    name,
    description,
    video_ids,
    is_public
) VALUES (
    '2a10fa9f-c129-451d-bc4e-b669d42d521e', -- super admin's organization
    'aa23eed5-de23-4b28-bc5d-26e72077e7a8', -- super admin user ID
    'Test Playlist',
    'A test playlist to verify the playlists page loads correctly',
    '[]'::UUID[], -- empty array of video IDs
    false -- not public
);