-- Migration: Add profile photo field to organizations
-- Supports the new TipJar profile layout with cover photo + circular profile photo
-- Affected products: TipJar.live (primary), DJDash.net, M10DJCompany.com (future use)

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'organizations'
      AND column_name = 'requests_profile_photo_url'
  ) THEN
    ALTER TABLE public.organizations
    ADD COLUMN requests_profile_photo_url TEXT DEFAULT NULL;
    COMMENT ON COLUMN public.organizations.requests_profile_photo_url IS 'Circular profile photo URL displayed overlapping the cover photo on the public requests page.';
  END IF;
END $$;
