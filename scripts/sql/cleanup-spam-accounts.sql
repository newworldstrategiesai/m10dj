-- =============================================================================
-- CLEANUP OBVIOUSLY SPAM ACCOUNTS (auth.users)
-- =============================================================================
-- Run in Supabase SQL Editor (Dashboard → SQL Editor). Uses auth schema.
-- Step 1: PREVIEW (run a query below to see count and sample).
-- Step 2: DELETE only after you've confirmed the list looks like spam.
-- All queries exclude users in public.admin_roles.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- QUICK COUNT: How many spam users would each strategy delete?
-- -----------------------------------------------------------------------------
-- Run these one at a time to compare.

-- Count: unconfirmed only (most bots never confirm)
-- SELECT COUNT(*) AS unconfirmed_count
-- FROM auth.users u
-- WHERE u.email_confirmed_at IS NULL
--   AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id);

-- Count: unconfirmed in last 365 days
-- SELECT COUNT(*) AS unconfirmed_last_year
-- FROM auth.users u
-- WHERE u.email_confirmed_at IS NULL
--   AND u.created_at > (NOW() - INTERVAL '365 days')
--   AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id);

-- Count: broad spam criteria (domains + keywords + random local part)
-- SELECT COUNT(*) AS broad_spam_count FROM auth.users u
-- WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
--   AND (
--     LOWER(u.email) ~ '\.(ru|tk|ml|ga|cf|gq|xyz|top|work|click|link|pw|info|biz|online|site|tech|store|shop|club|fun|live|cloud|space|stream|trade|win|racing|review|date|party|science|download|buzz|rest|design|world|today|life|email|fit|systems|solutions|technology|digital|network|agency|studio|support|consulting|management|ventures|capital|enterprises|international|group)$'
--     OR LOWER(SPLIT_PART(u.email, '@', 2)) IN ('mail.ru','yandex.ru','yandex.com','rambler.ru','list.ru','tempmail.com','guerrillamail.com','10minutemail.com','mailinator.com','throwaway.email','getnada.com','temp-mail.org','fakeinbox.com','trashmail.com','sharklasers.com','guerrillamail.info','mailnesia.com','maildrop.cc','dispostable.com','tempail.com','mohmal.com','emailondeck.com','checkyourform.xyz','mt-system.ru')
--     OR LOWER(u.email) ~ '(bitcoin|crypto|casino|viagra|cialis|noreply@|no-reply|temp\.?mail|guerrilla|10minute|throwaway|disposable)'
--     OR (u.email_confirmed_at IS NULL AND u.created_at > (NOW() - INTERVAL '365 days') AND LENGTH(SPLIT_PART(u.email, '@', 1)) >= 16 AND SPLIT_PART(u.email, '@', 1) ~ '^[a-f0-9]+$')
--   );

-- -----------------------------------------------------------------------------
-- PREVIEW A: Unconfirmed users only (catches most bot signups)
-- -----------------------------------------------------------------------------
/*
SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'organization_name' AS organization_name,
  u.raw_user_meta_data->>'product_context' AS product_context
FROM auth.users u
WHERE
  u.email_confirmed_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
ORDER BY u.created_at DESC
LIMIT 500;
*/

-- -----------------------------------------------------------------------------
-- PREVIEW B: Unconfirmed users created in last 365 days only (safer window)
-- -----------------------------------------------------------------------------
/*
SELECT
  u.id,
  u.email,
  u.created_at,
  u.raw_user_meta_data->>'organization_name' AS organization_name,
  u.raw_user_meta_data->>'product_context' AS product_context
FROM auth.users u
WHERE
  u.email_confirmed_at IS NULL
  AND u.created_at > (NOW() - INTERVAL '365 days')
  AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
ORDER BY u.created_at DESC
LIMIT 500;
*/

-- -----------------------------------------------------------------------------
-- PREVIEW C: Broad spam criteria (domains + keywords + random local part)
-- -----------------------------------------------------------------------------
/*
SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'organization_name' AS organization_name,
  u.raw_user_meta_data->>'product_context' AS product_context
FROM auth.users u
WHERE
  NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
  AND (
    LOWER(u.email) ~ '\.(ru|tk|ml|ga|cf|gq|xyz|top|work|click|link|pw|info|biz|online|site|tech|store|shop|club|fun|live|cloud|space|stream|trade|win|racing|review|date|party|science|download|buzz|rest|design|world|today|life|email|fit|systems|solutions|technology|digital|network|agency|studio|support|consulting|management|ventures|capital|enterprises|international|group)$'
    OR LOWER(SPLIT_PART(u.email, '@', 2)) IN ('mail.ru','yandex.ru','yandex.com','rambler.ru','list.ru','tempmail.com','guerrillamail.com','10minutemail.com','mailinator.com','throwaway.email','getnada.com','temp-mail.org','fakeinbox.com','trashmail.com','sharklasers.com','guerrillamail.info','mailnesia.com','maildrop.cc','dispostable.com','tempail.com','mohmal.com','emailondeck.com','checkyourform.xyz','mt-system.ru','mailvn.top','automisly.org')
    OR LOWER(u.email) ~ '(bitcoin|crypto|casino|viagra|cialis|noreply@|no-reply|temp\.?mail|guerrilla|10minute|throwaway|disposable)'
    OR (u.email_confirmed_at IS NULL AND u.created_at > (NOW() - INTERVAL '365 days') AND LENGTH(SPLIT_PART(u.email, '@', 1)) >= 16 AND SPLIT_PART(u.email, '@', 1) ~ '^[a-f0-9]+$')
  )
ORDER BY u.created_at DESC
LIMIT 1000;
*/

-- -----------------------------------------------------------------------------
-- PREVIEW D: Auth users with NO organization (never created/joined one)
-- -----------------------------------------------------------------------------
-- Catches scraped/corporate signups (e.g. dchong@cchealth.org) that signed up
-- but never created or joined an org. Run this to see auth-only "spam" accounts.

SELECT
  u.id,
  u.email,
  u.created_at,
  u.email_confirmed_at,
  u.raw_user_meta_data->>'organization_name' AS organization_name,
  u.raw_user_meta_data->>'product_context' AS product_context
FROM auth.users u
WHERE
  NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = u.id AND om.is_active = true)
ORDER BY u.created_at DESC
LIMIT 500;



-- =============================================================================
-- DELETE OPTIONS (run ONE after preview looks correct)
-- =============================================================================
-- Deleting from auth.users CASCADEs to organization_members, organizations, etc.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- DELETE 1: All unconfirmed users (except admins) – use if PREVIEW A looks good
-- -----------------------------------------------------------------------------
/*
DELETE FROM auth.users
WHERE email_confirmed_at IS NULL
  AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.users.id);
*/

-- -----------------------------------------------------------------------------
-- DELETE 2: Unconfirmed users in last 365 days only – use if PREVIEW B looks good
-- -----------------------------------------------------------------------------
/*
DELETE FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at > (NOW() - INTERVAL '365 days')
  AND NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.users.id);
*/

-- -----------------------------------------------------------------------------
-- DELETE 3: Broad spam criteria (domains + keywords + random hex local part)
-- -----------------------------------------------------------------------------
/*
DELETE FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.users.id)
  AND (
    LOWER(email) ~ '\.(ru|tk|ml|ga|cf|gq|xyz|top|work|click|link|pw|info|biz|online|site|tech|store|shop|club|fun|live|cloud|space|stream|trade|win|racing|review|date|party|science|download|buzz|rest|design|world|today|life|email|fit|systems|solutions|technology|digital|network|agency|studio|support|consulting|management|ventures|capital|enterprises|international|group)$'
    OR LOWER(SPLIT_PART(email, '@', 2)) IN ('mail.ru','yandex.ru','yandex.com','rambler.ru','list.ru','tempmail.com','guerrillamail.com','10minutemail.com','mailinator.com','throwaway.email','getnada.com','temp-mail.org','fakeinbox.com','trashmail.com','sharklasers.com','guerrillamail.info','mailnesia.com','maildrop.cc','dispostable.com','tempail.com','mohmal.com','emailondeck.com','checkyourform.xyz','mt-system.ru','mailvn.top','automisly.org')
    OR LOWER(email) ~ '(bitcoin|crypto|casino|viagra|cialis|noreply@|no-reply|temp\.?mail|guerrilla|10minute|throwaway|disposable)'
    OR (email_confirmed_at IS NULL AND created_at > (NOW() - INTERVAL '365 days') AND LENGTH(SPLIT_PART(email, '@', 1)) >= 16 AND SPLIT_PART(email, '@', 1) ~ '^[a-f0-9]+$')
  );
*/

-- -----------------------------------------------------------------------------
-- DELETE 4: Auth users with NO organization (never created/joined one)
-- -----------------------------------------------------------------------------
-- Removes scraped/corporate signups (e.g. dchong@cchealth.org) that never set up.
-- Run PREVIEW D first. Real users who signed up but never completed onboarding will be removed.
/*
DELETE FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.users.id)
  AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = auth.users.id)
  AND NOT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.users.id AND om.is_active = true);
*/



-- =============================================================================
-- CLEAN UP OBVIOUSLY SPAM CONTACTS (public.contacts)
-- =============================================================================
-- Catches Bitcoin/yandex/scam contacts (e.g. tbaron@mailvn.top, roofa2000@automisly.org).
-- Run PREVIEW below first. If your schema has FKs (contracts, invoices, etc. reference
-- contact_id), you may need to delete or null those first, or use ON DELETE CASCADE.
-- =============================================================================

-- PREVIEW: contacts with spam in name or spam email domain
SELECT id, first_name, last_name, email_address, created_at
FROM public.contacts
WHERE
  LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ~ '(yandex\.com|bitcoin|btc|adult\s+dating|sex\s+dating|withdraw|transfer.*btc|http|https|\.ru|crypto|casino|viagra|t\.me|click\s*here)'
  OR LOWER(COALESCE(first_name, '')) ~ '(yandex|bitcoin|btc|http|viagra)'
  OR LOWER(COALESCE(last_name, '')) ~ '(yandex|bitcoin|btc|http|viagra|adult\s+dating|sex\s+dating)'
  OR LOWER(COALESCE(email_address, '')) ~ '@(mailvn\.top|automisly\.org)$'
ORDER BY created_at DESC
LIMIT 500;

-- DELETE spam contacts (uncomment to run after preview)
/*
DELETE FROM public.contacts
WHERE
  LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ~ '(yandex\.com|bitcoin|btc|adult\s+dating|sex\s+dating|withdraw|transfer.*btc|http|https|\.ru|crypto|casino|viagra|t\.me|click\s*here)'
  OR LOWER(COALESCE(first_name, '')) ~ '(yandex|bitcoin|btc|http|viagra)'
  OR LOWER(COALESCE(last_name, '')) ~ '(yandex|bitcoin|btc|http|viagra|adult\s+dating|sex\s+dating)'
  OR LOWER(COALESCE(email_address, '')) ~ '@(mailvn\.top|automisly\.org)$';
*/


-- =============================================================================
-- OPTIONAL: Clean up obviously spam CONTACT_SUBMISSIONS
-- =============================================================================
-- contact_submissions store raw form data; spam may be in name/message.
-- =============================================================================

-- PREVIEW: contact_submissions with spam in name or message
/*
SELECT id, name, email, message, created_at
FROM public.contact_submissions
WHERE
  LOWER(COALESCE(name, '') || ' ' || COALESCE(message, '')) ~ '(http|https|\.ru|bitcoin|crypto|casino|viagra|yandex|t\.me|click\s*here)'
ORDER BY created_at DESC;
*/

-- DELETE spam contact_submissions (uncomment to run)
/*
DELETE FROM public.contact_submissions
WHERE
  LOWER(COALESCE(name, '') || ' ' || COALESCE(message, '')) ~ '(http|https|\.ru|bitcoin|crypto|casino|viagra|yandex|t\.me|click\s*here)';
*/
