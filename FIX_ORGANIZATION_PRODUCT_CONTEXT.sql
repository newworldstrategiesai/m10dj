-- Fix organization product_context for TipJar user
-- This user signed up through TipJar but organization was created with wrong product_context

-- Step 1: Update user metadata to have correct product_context
UPDATE auth.users
SET raw_user_meta_data = jsonb_set(
  COALESCE(raw_user_meta_data, '{}'::jsonb),
  '{product_context}',
  '"tipjar"'
)
WHERE email = 'memphismillennial@gmail.com';

-- Step 2: Update the organization to have correct product_context
UPDATE public.organizations
SET product_context = 'tipjar'
WHERE slug = 'm22'
  AND owner_id = (SELECT id FROM auth.users WHERE email = 'memphismillennial@gmail.com');

-- Step 3: Verify the updates
SELECT 
  o.id as org_id,
  o.name as org_name,
  o.slug as org_slug,
  o.product_context as org_product_context,
  o.subscription_tier,
  o.subscription_status,
  u.id as user_id,
  u.email as owner_email,
  u.raw_user_meta_data->>'product_context' as user_product_context
FROM public.organizations o
JOIN auth.users u ON u.id = o.owner_id
WHERE o.slug = 'm22'
  AND u.email = 'memphismillennial@gmail.com';

-- Expected result:
-- org_product_context should be 'tipjar'
-- user_product_context should be 'tipjar'

