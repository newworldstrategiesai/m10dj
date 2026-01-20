-- Auto-create organization when user signs up
-- This trigger creates a default organization for new users

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
    -- Generate organization name from user metadata (set during signup)
    -- Priority: organization_name > full_name > email prefix > default
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'organization_name',
      NEW.raw_user_meta_data->>'full_name',
      SPLIT_PART(NEW.email, '@', 1),
      'My DJ Business'
    );

    -- Generate slug from organization name
    -- Remove special characters, convert to lowercase, replace spaces with hyphens
    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-z0-9\s]+', '', 'g'));
    org_slug := REGEXP_REPLACE(org_slug, '\s+', '-', 'g');
    org_slug := TRIM(BOTH '-' FROM org_slug);
    
    -- Ensure slug is not empty - use name-based fallback instead of UUID
    IF org_slug = '' OR org_slug IS NULL THEN
      -- Try to generate from email prefix
      org_slug := LOWER(REGEXP_REPLACE(SPLIT_PART(NEW.email, '@', 1), '[^a-z0-9]+', '-', 'g'));
      org_slug := TRIM(BOTH '-' FROM org_slug);
      
      -- If still empty, use a meaningful default
      IF org_slug = '' OR org_slug IS NULL THEN
        org_slug := 'dj-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
      END IF;
    END IF;

    -- Make slug unique by appending a short random string if needed
    -- Limit attempts to prevent infinite loop
    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) AND attempt < max_attempts LOOP
      org_slug := org_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 4);
      attempt := attempt + 1;
    END LOOP;

    -- If still not unique after max attempts, append a short UUID segment
    -- But keep the original name-based slug as the prefix
    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) THEN
      org_slug := org_slug || '-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6);
    END IF;

    -- Calculate trial end date (14 days from now)
    trial_end_date := NOW() + INTERVAL '14 days';

    -- Check if organization already exists for this user (prevent duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE owner_id = NEW.id) THEN
      -- Create organization
      -- Use ON CONFLICT to handle slug conflicts gracefully
      -- Audio upload is disabled by default during onboarding
      INSERT INTO public.organizations (
        name,
        slug,
        owner_id,
        subscription_tier,
        subscription_status,
        trial_ends_at,
        requests_show_audio_upload
      ) VALUES (
        org_name,
        org_slug,
        NEW.id,
        'starter',
        'trial',
        trial_end_date,
        FALSE
      )
      ON CONFLICT (slug) DO UPDATE SET
        slug = EXCLUDED.slug || '-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 6);
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

-- Create trigger to run after user is created
DROP TRIGGER IF EXISTS on_auth_user_created_organization ON auth.users;
CREATE TRIGGER on_auth_user_created_organization
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user_organization();

COMMENT ON FUNCTION public.handle_new_user_organization IS 'Automatically creates an organization when a new user signs up. Sets up 14-day free trial.';

