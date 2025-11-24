-- Storage Policies for Organization Assets
-- 
-- IMPORTANT: This file contains the SQL to create storage policies.
-- Run this in Supabase SQL Editor (Dashboard → SQL Editor) with service role permissions.
-- 
-- Storage policies cannot be created via regular migrations due to permission requirements.
-- They must be created manually or through the Supabase Management API.

-- Ensure the storage bucket exists first:
-- Go to Supabase Dashboard → Storage → Create bucket "organization-assets" (Public: Yes)

-- Policy: Allow authenticated users to upload to their organization folder
DROP POLICY IF EXISTS "Users can upload to their organization folder" ON storage.objects;
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

-- Policy: Allow authenticated users to update their own organization assets
DROP POLICY IF EXISTS "Users can update their organization assets" ON storage.objects;
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

-- Policy: Allow authenticated users to delete their own organization assets
DROP POLICY IF EXISTS "Users can delete their organization assets" ON storage.objects;
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

-- Policy: Allow public read access to organization assets (for logos/favicons)
DROP POLICY IF EXISTS "Public can read organization assets" ON storage.objects;
CREATE POLICY "Public can read organization assets"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'organization-assets');

-- Policy: Allow authenticated users to list their organization folder
DROP POLICY IF EXISTS "Users can list their organization folder" ON storage.objects;
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

COMMENT ON POLICY "Users can upload to their organization folder" ON storage.objects IS 
  'Allows authenticated users to upload branding assets (logo, favicon) to their organization folder';

COMMENT ON POLICY "Public can read organization assets" ON storage.objects IS 
  'Allows public read access to organization branding assets for display on public request pages';

