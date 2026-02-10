-- M10 DJ Company photo gallery: table + storage bucket for admin-managed gallery
-- Product: M10DJCompany.com only. Gallery images stored in Supabase Storage.

-- 1. Table: gallery_photos
CREATE TABLE IF NOT EXISTS public.gallery_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  src text NOT NULL,
  alt text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.gallery_photos IS 'M10 DJ Company public gallery photos; admin-managed via /admin/gallery';

-- 2. RLS: public read (for gallery page), write only via service role / API
ALTER TABLE public.gallery_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read gallery photos"
ON public.gallery_photos FOR SELECT
TO public
USING (true);

-- INSERT/UPDATE/DELETE: no policy for authenticated; API uses service role for writes (admin check in API).

-- 3. Storage bucket for gallery images (public read; uploads via API with service role)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'm10-gallery',
  'm10-gallery',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Public read for gallery images
DROP POLICY IF EXISTS "Public can read m10 gallery images" ON storage.objects;
CREATE POLICY "Public can read m10 gallery images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'm10-gallery');

-- INSERT/UPDATE/DELETE on storage: API uses service role for upload/delete (admin check in API).
