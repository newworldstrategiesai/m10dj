-- Support phone-only signup: handle_new_user_organization when auth.users.email is null
-- Phone-only users get org name/slug from metadata or safe defaults (no SPLIT_PART on null email)

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
  BEGIN
    user_product_context := COALESCE(
      NEW.raw_user_meta_data->>'product_context',
      'tipjar'
    );

    CASE user_product_context
      WHEN 'tipjar' THEN
        default_accent_color := '#10b981';
      WHEN 'djdash' THEN
        default_accent_color := '#3b82f6';
      ELSE
        default_accent_color := '#fcba00';
    END CASE;

    -- Support phone-only users: NEW.email can be null; use phone or defaults for org name
    org_name := COALESCE(
      NEW.raw_user_meta_data->>'organization_name',
      NEW.raw_user_meta_data->>'full_name',
      CASE
        WHEN NEW.email IS NOT NULL THEN SPLIT_PART(NEW.email, '@', 1)
        WHEN NEW.phone IS NOT NULL THEN 'User-' || RIGHT(REGEXP_REPLACE(NEW.phone, '[^0-9]', '', 'g'), 4)
        ELSE 'My DJ Business'
      END
    );

    org_slug := LOWER(REGEXP_REPLACE(org_name, '[^a-z0-9]+', '-', 'g'));
    org_slug := TRIM(BOTH '-' FROM org_slug);

    IF org_slug = '' OR org_slug IS NULL THEN
      org_slug := 'dj-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 8);
    END IF;

    WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) AND attempt < max_attempts LOOP
      org_slug := org_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
      attempt := attempt + 1;
    END LOOP;

    IF EXISTS (SELECT 1 FROM public.organizations WHERE slug = org_slug) THEN
      org_slug := 'dj-' || SUBSTRING(REPLACE(NEW.id::TEXT, '-', ''), 1, 12);
    END IF;

    trial_end_date := NOW() + INTERVAL '14 days';

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
          NULL;
      END;
    END IF;

  EXCEPTION
    WHEN OTHERS THEN
      RAISE WARNING 'Failed to create organization for user %: %', NEW.id, SQLERRM;
  END;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION public.handle_new_user_organization IS 'Creates organization on signup. Supports email and phone-only users. Defaults to TipJar; sets product-specific accent color.';
