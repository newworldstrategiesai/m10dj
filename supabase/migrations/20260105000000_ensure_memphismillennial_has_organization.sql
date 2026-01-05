-- Ensure memphismillennial@gmail.com has an organization
-- This migration creates an organization for the user if one doesn't exist
-- Safe to run multiple times (idempotent)

DO $$
DECLARE
  v_user_id UUID;
  v_email TEXT := 'memphismillennial@gmail.com';
  v_org_name TEXT;
  v_org_slug TEXT;
  v_trial_end_date TIMESTAMP WITH TIME ZONE;
  v_product_context TEXT;
  v_org_id UUID;
  v_requests_header_artist_name TEXT;
BEGIN
  -- Find user by email
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = v_email;
  
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', v_email;
  END IF;
  
  -- Check if organization already exists
  SELECT id INTO v_org_id
  FROM public.organizations
  WHERE owner_id = v_user_id
  LIMIT 1;
  
  IF v_org_id IS NOT NULL THEN
    RAISE NOTICE 'Organization already exists for user % (ID: %)', v_email, v_org_id;
    RETURN;
  END IF;
  
  -- Get product context from user metadata
  SELECT COALESCE(
    raw_user_meta_data->>'product_context',
    'tipjar'  -- Default to tipjar for TipJar users
  ) INTO v_product_context
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Generate organization name
  SELECT COALESCE(
    raw_user_meta_data->>'organization_name',
    raw_user_meta_data->>'full_name',
    SPLIT_PART(v_email, '@', 1),
    'My DJ Business'
  ) INTO v_org_name
  FROM auth.users
  WHERE id = v_user_id;
  
  -- Generate slug from organization name
  v_org_slug := LOWER(REGEXP_REPLACE(v_org_name, '[^a-z0-9\s]+', '', 'g'));
  v_org_slug := REGEXP_REPLACE(v_org_slug, '\s+', '-', 'g');
  v_org_slug := TRIM(BOTH '-' FROM v_org_slug);
  
  -- Ensure slug is not empty
  IF v_org_slug = '' OR v_org_slug IS NULL THEN
    v_org_slug := 'dj-' || SUBSTRING(REPLACE(v_user_id::TEXT, '-', ''), 1, 8);
  END IF;
  
  -- Make slug unique by appending a short random string if needed
  WHILE EXISTS (SELECT 1 FROM public.organizations WHERE slug = v_org_slug) LOOP
    v_org_slug := v_org_slug || '-' || SUBSTRING(MD5(RANDOM()::TEXT), 1, 6);
  END LOOP;
  
  -- Calculate trial end date (14 days from now)
  v_trial_end_date := NOW() + INTERVAL '14 days';
  
  -- Set requests_header_artist_name to organization name
  v_requests_header_artist_name := v_org_name;
  
  -- Create organization
  INSERT INTO public.organizations (
    name,
    slug,
    owner_id,
    subscription_tier,
    subscription_status,
    trial_ends_at,
    product_context,
    requests_header_artist_name
  ) VALUES (
    v_org_name,
    v_org_slug,
    v_user_id,
    'starter',
    'trial',
    v_trial_end_date,
    v_product_context,
    v_requests_header_artist_name
  )
  RETURNING id INTO v_org_id;
  
  RAISE NOTICE 'Organization created for user %: % (%)', v_email, v_org_name, v_org_slug;
  RAISE NOTICE 'Organization ID: %', v_org_id;
  
  -- The organization_members trigger should automatically create the owner membership
  -- But let's ensure it exists
  INSERT INTO public.organization_members (
    organization_id,
    user_id,
    role,
    joined_at,
    is_active
  ) VALUES (
    v_org_id,
    v_user_id,
    'owner',
    NOW(),
    true
  )
  ON CONFLICT (organization_id, user_id) DO NOTHING;
  
  RAISE NOTICE 'Owner membership created/verified';
  
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING 'Error creating organization for user %: %', v_email, SQLERRM;
    RAISE;
END $$;

-- Verify organization was created
SELECT 
  u.email,
  u.id as user_id,
  o.id as organization_id,
  o.name as organization_name,
  o.slug as organization_slug,
  o.subscription_tier,
  o.subscription_status,
  o.product_context,
  o.requests_header_artist_name,
  o.created_at
FROM auth.users u
JOIN public.organizations o ON o.owner_id = u.id
WHERE u.email = 'memphismillennial@gmail.com';

