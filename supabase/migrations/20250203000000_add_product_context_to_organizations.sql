-- Add product_context to organizations table
-- This allows filtering and separation of TipJar, DJ Dash, and M10 DJ Company organizations

ALTER TABLE organizations 
ADD COLUMN IF NOT EXISTS product_context TEXT 
DEFAULT 'm10dj' 
CHECK (product_context IN ('tipjar', 'djdash', 'm10dj'));

-- Create index for faster filtering by product context
CREATE INDEX IF NOT EXISTS idx_organizations_product_context 
ON organizations(product_context);

-- Update existing organizations to have product_context based on owner's metadata
-- This backfills existing organizations with the product context from their owner
UPDATE organizations o
SET product_context = COALESCE(
  (SELECT raw_user_meta_data->>'product_context' 
   FROM auth.users 
   WHERE id = o.owner_id),
  'm10dj'  -- Default to m10dj if not set
)
WHERE product_context IS NULL OR product_context = 'm10dj';

-- Create a function to automatically set product_context when organization is created
-- This ensures new organizations inherit the product_context from the user
CREATE OR REPLACE FUNCTION set_organization_product_context()
RETURNS TRIGGER AS $$
BEGIN
  -- Set product_context from owner's user metadata if not already set
  IF NEW.product_context IS NULL THEN
    NEW.product_context := COALESCE(
      (SELECT raw_user_meta_data->>'product_context'
       FROM auth.users 
       WHERE id = NEW.owner_id),
      'm10dj'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to automatically set product_context on insert
DROP TRIGGER IF EXISTS trigger_set_organization_product_context ON organizations;
CREATE TRIGGER trigger_set_organization_product_context
  BEFORE INSERT ON organizations
  FOR EACH ROW
  EXECUTE FUNCTION set_organization_product_context();

-- Update the existing organization creation trigger to include product_context
-- This ensures organizations created via handle_new_user_organization also get product_context
CREATE OR REPLACE FUNCTION public.handle_new_user_organization()
RETURNS TRIGGER AS $$
DECLARE
  org_name TEXT;
  org_slug TEXT;
  trial_end_date TIMESTAMP WITH TIME ZONE;
  user_product_context TEXT;
  max_attempts INTEGER := 10;
  attempt INTEGER := 0;
BEGIN
  -- Wrap in exception handler so trigger failure doesn't prevent user creation
  BEGIN
    -- Get product_context from user metadata
    user_product_context := COALESCE(
      NEW.raw_user_meta_data->>'product_context',
      'm10dj'
    );

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

    -- Create organization with product_context
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
          product_context
        ) VALUES (
          org_name,
          org_slug,
          NEW.id,
          'starter',
          'trial',
          trial_end_date,
          user_product_context
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

-- Add comment for documentation
COMMENT ON COLUMN organizations.product_context IS 
  'Product context: tipjar (TipJar.Live), djdash (DJ Dash), or m10dj (M10 DJ Company). Used for product-specific routing and feature access.';

