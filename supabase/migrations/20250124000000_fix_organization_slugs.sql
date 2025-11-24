-- Fix existing organization slugs to be based on business name
-- This migration updates slugs for existing organizations that have UUID-based slugs

CREATE OR REPLACE FUNCTION public.update_organization_slugs()
RETURNS void AS $$
DECLARE
  org_record RECORD;
  new_slug TEXT;
  base_slug TEXT;
  counter INTEGER;
BEGIN
  -- Loop through organizations with UUID-based slugs (starting with 'dj-')
  FOR org_record IN 
    SELECT id, name, slug, owner_id
    FROM public.organizations
    WHERE slug LIKE 'dj-%' OR slug ~ '^[a-f0-9-]+$'
  LOOP
    -- Generate slug from organization name
    base_slug := LOWER(REGEXP_REPLACE(org_record.name, '[^a-z0-9\s]+', '', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '\s+', '-', 'g');
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- If slug is empty, try to get from user's email or name
    IF base_slug = '' OR base_slug IS NULL THEN
      SELECT 
        COALESCE(
          LOWER(REGEXP_REPLACE(SPLIT_PART(email, '@', 1), '[^a-z0-9]+', '-', 'g')),
          'dj-' || SUBSTRING(REPLACE(org_record.owner_id::TEXT, '-', ''), 1, 8)
        )
      INTO base_slug
      FROM auth.users
      WHERE id = org_record.owner_id;
    END IF;
    
    -- Ensure slug is unique
    new_slug := base_slug;
    counter := 1;
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = new_slug AND id != org_record.id) LOOP
      new_slug := base_slug || '-' || counter::TEXT;
      counter := counter + 1;
    END LOOP;
    
    -- Update the organization slug
    UPDATE public.organizations
    SET slug = new_slug
    WHERE id = org_record.id;
    
    RAISE NOTICE 'Updated organization % from slug % to %', org_record.id, org_record.slug, new_slug;
  END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Run the function to update existing slugs
SELECT public.update_organization_slugs();

-- Drop the temporary function
DROP FUNCTION IF EXISTS public.update_organization_slugs();

