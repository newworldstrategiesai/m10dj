-- Fix product_context for ben-spins organization
-- This organization was created with product_context = 'm10dj' but should be 'tipjar'
-- since the user signed up through TipJar Live

-- Step 1: Check current state
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.product_context as org_product_context,
  u.id as user_id,
  u.email as owner_email,
  u.raw_user_meta_data->>'product_context' as user_product_context
FROM public.organizations o
JOIN auth.users u ON u.id = o.owner_id
WHERE o.slug = 'ben-spins'
  AND u.email = 'benspinsmusic@gmail.com';

-- Step 2: Update user metadata to have correct product_context
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{product_context}',
  '"tipjar"'
)
WHERE email = 'benspinsmusic@gmail.com';

-- Step 3: Update the organization to have correct product_context
UPDATE public.organizations
SET product_context = 'tipjar'
WHERE slug = 'ben-spins'
  AND owner_id = (SELECT id FROM auth.users WHERE email = 'benspinsmusic@gmail.com');

-- Step 4: Also update accent color to TipJar green if it's still the default
UPDATE public.organizations
SET requests_accent_color = '#10b981'
WHERE slug = 'ben-spins'
  AND (requests_accent_color IS NULL OR requests_accent_color = '#fcba00');

-- Step 5: Verify the updates
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.product_context as org_product_context,
  o.requests_accent_color,
  u.id as user_id,
  u.email as owner_email,
  u.raw_user_meta_data->>'product_context' as user_product_context
FROM public.organizations o
JOIN auth.users u ON u.id = o.owner_id
WHERE o.slug = 'ben-spins'
  AND u.email = 'benspinsmusic@gmail.com';

-- Expected result:
-- org_product_context should be 'tipjar'
-- user_product_context should be 'tipjar'
-- requests_accent_color should be '#10b981' (TipJar green)

