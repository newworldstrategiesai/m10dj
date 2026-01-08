-- Fix product_context default to 'tipjar' instead of 'm10dj'
-- This ensures new signups default to TipJar if product_context isn't set in user metadata
-- TipJar is the primary product, so it should be the default

-- Update the organization creation trigger to default to 'tipjar'
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  trial_end_date TIMESTAMP WITH TIME ZONE;
  user_product_context TEXT;
  default_accent_color TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Wrap in exception handler so trigger failure doesn't prevent user creation
  BEGIN
    -- Get product_context from user metadata
    -- DEFAULT TO 'tipjar' instead of 'm10dj' (TipJar is the primary product)
    user_product_context := COALESCE(
      NEW.raw_user_meta_data->>'product_context',
      'tipjar'  -- Changed from 'm10dj' to 'tipjar' as default
    );

    -- Set default accent color based on product context
    CASE user_product_context
      WHEN 'tipjar' THEN
        default_accent_color := '#10b981'; -- TipJar green
      WHEN 'djdash' THEN
        default_accent_color := '#3b82f6'; -- DJ Dash blue
      ELSE
        default_accent_color := '#fcba00'; -- M10DJ gold (or tipjar if defaulted above)
    END CASE;

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

    -- Create organization with product_context and accent color
    -- Check if user already has an organization first (prevents duplicates)
    IF NOT EXISTS (SELECT 1 FROM public.organizations WHERE owner_id = NEW.id) THEN
      BEGIN
        INSERT INTO public.organizations (
          name,
          slug,
          owner_id,
          subscription_tier,
          subscription_status,
          trial_ends_at,
          product_context,
          requests_accent_color
        ) VALUES (
          org_name,
          org_slug,
          NEW.id,
          'starter',
          'trial',
          trial_end_date,
          user_product_context,
          default_accent_color
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

-- Also update the BEFORE INSERT trigger function to default to 'tipjar'
CREATE OR REPLACE FUNCTION set_organization_product_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Set product_context from owner's user metadata if not already set
  -- DEFAULT TO 'tipjar' instead of 'm10dj'
  IF NEW.product_context IS NULL THEN
    NEW.product_context := COALESCE(
      (SELECT raw_user_meta_data->>'product_context'
       FROM auth.users 
       WHERE id = NEW.owner_id),
      'tipjar'  -- Changed from 'm10dj' to 'tipjar' as default
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update comment to reflect the change
COMMENT ON FUNCTION public.handle_new_user_organization IS 'Automatically creates an organization when a new user signs up. Sets up 14-day free trial and product-specific default accent color (TipJar: green #10b981, DJ Dash: blue #3b82f6, M10DJ: gold #fcba00). Defaults to TipJar if product_context is not set in user metadata.';

