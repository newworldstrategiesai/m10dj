-- Fix organization creation trigger to handle errors gracefully
-- This ensures user creation doesn't fail if organization creation has issues

-- Drop and recreate the trigger function with better error handling
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  trial_end_date TIMESTAMP WITH TIME ZONE;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Wrap in exception handler so trigger failure doesn't prevent user creation
  BEGIN
    -- Generate organization name from email or use default
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'organization_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1),
      'My DJ Business'
    );

    -- Generate slug from organization name
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug);
    
    -- Ensure slug is not empty
    IF org_slug = '' OR org_slug IS NULL THEN
      org_slug := 'dj-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
    END IF;

    -- Make slug unique by appending random string if needed
    -- Limit attempts to prevent infinite loop
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) AND attempt < max_attempts LOOP
      org_slug := org_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
      attempt := attempt + 1;
    END LOOP;

    -- If still not unique after max attempts, use UUID-based slug
    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) THEN
      org_slug := 'dj-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 12);
    END IF;

    -- Calculate trial end date (14 days from now)
    trial_end_date := NOW() + INTERVAL '14 days';

    -- Create organization
    -- Check if user already has an organization first (prevents duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE owner_id = NEW.id) THEN
      BEGIN
        INSERT INTO public.organizations (
          name,
          slug,
          owner_id,
          subscription_tier,
          subscription_status,
          trial_ends_at
        ) VALUES (
          org_name,
          org_slug,
          NEW.id,
          'starter',
          'trial',
          trial_end_date
        );
      EXCEPTION
        WHEN unique_violation THEN
          -- If there's a conflict (slug or owner_id), just skip
          -- This can happen in race conditions
          NULL;
      END;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      -- Log error but don't fail the user creation
      -- In production, you might want to log this to a table
      RAISE WARNING 'Failed to create organization for user %: %', NEW.id, SQLERRM;
      -- Continue - user creation should still succeed
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add unique constraint on owner_id if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'organizations_owner_id_key'
  ) THEN
    ALTER TABLE public.organizations 
    ADD CONSTRAINT organizations_owner_id_key UNIQUE (owner_id);
  END IF;
END $$;

COMMENT ON FUNCTION public.handle_new_user_organization IS 'Automatically creates an organization when a new user signs up. Sets up 14-day free trial. Errors are caught to prevent blocking user creation.';

