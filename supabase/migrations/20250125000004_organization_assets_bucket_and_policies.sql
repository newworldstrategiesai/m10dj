-- Organization Assets Bucket + All Policies (one-shot for SQL Editor)
-- Run this entire file in Supabase Dashboard → SQL Editor → New query → Paste → Run
-- Creates the bucket and all 5 RLS policies for organization-assets (logos, cover/profile photos).
--
-- If the INSERT fails (e.g. permission), create the bucket in Dashboard: Storage → New bucket
-- Name: organization-assets, Public: Yes, File size limit: 5 MB, then run this script again.

-- 1. Create the bucket (idempotent: skips if already exists)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'organization-assets',
  'organization-assets',
  true,
  5242880,
  ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Drop existing policies (idempotent)
DROP POLICY IF EXISTS "Users can upload to their organization folder" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Public can read organization assets" ON storage.objects;
DROP POLICY IF EXISTS "Users can list their organization folder" ON storage.objects;

-- 3. Create all policies
CREATE POLICY "Users can upload to their organization folder"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  (storage.foldername(name))[2] = (
    SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can update their organization assets"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  (storage.foldername(name))[2] = (
    SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Users can delete their organization assets"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  (storage.foldername(name))[2] = (
    SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
  )
);

CREATE POLICY "Public can read organization assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

CREATE POLICY "Users can list their organization folder"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'organization-assets' AND
  (storage.foldername(name))[1] = 'organizations' AND
  (storage.foldername(name))[2] = (
    SELECT id::text FROM public.organizations WHERE owner_id = auth.uid()
  )
);
