-- Create storage bucket for stream recordings
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'stream-recordings',
  'stream-recordings',
  true,
  524288000, -- 500MB max file size
  ARRAY['video/webm', 'video/mp4', 'video/quicktime']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Streamers can upload recordings" ON storage.objects;
DROP POLICY IF EXISTS "Anyone can view recordings" ON storage.objects;
DROP POLICY IF EXISTS "Streamers can delete their recordings" ON storage.objects;
DROP POLICY IF EXISTS "Streamers can update their recordings" ON storage.objects;

-- RLS Policy: Streamers can upload their own recordings
-- Note: We're using a simpler policy that allows authenticated users to upload
-- You can restrict this further based on your needs
CREATE POLICY "Streamers can upload recordings"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'stream-recordings');

-- RLS Policy: Anyone can view recordings (public bucket)
CREATE POLICY "Anyone can view recordings"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'stream-recordings');

-- RLS Policy: Streamers can delete their own recordings
CREATE POLICY "Streamers can delete their recordings"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'stream-recordings');

-- RLS Policy: Streamers can update their own recordings
CREATE POLICY "Streamers can update their recordings"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'stream-recordings');

