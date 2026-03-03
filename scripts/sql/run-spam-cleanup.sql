-- =============================================================================
-- RUN SPAM CLEANUP (no editing required)
-- =============================================================================
-- Run this entire script in Supabase SQL Editor.
-- Uses a transaction: change COMMIT to ROLLBACK at the end to undo (dry run).
-- =============================================================================

BEGIN;

-- -----------------------------------------------------------------------------
-- 1. Count what will be deleted (for your records)
-- -----------------------------------------------------------------------------
SELECT 'Spam contacts to delete' AS step, COUNT(*) AS cnt
FROM public.contacts
WHERE
  LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ~ '(yandex\.com|bitcoin|btc|adult\s+dating|sex\s+dating|withdraw|transfer.*btc|http|https|\.ru|crypto|casino|viagra|t\.me|click\s*here)'
  OR LOWER(COALESCE(first_name, '')) ~ '(yandex|bitcoin|btc|http|viagra)'
  OR LOWER(COALESCE(last_name, '')) ~ '(yandex|bitcoin|btc|http|viagra|adult\s+dating|sex\s+dating)'
  OR LOWER(COALESCE(email_address, '')) ~ '@(mailvn\.top|automisly\.org)$'

UNION ALL

SELECT 'Auth users with no org to delete' AS step, COUNT(*) AS cnt
FROM auth.users u
WHERE
  NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = u.id)
  AND NOT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = u.id AND om.is_active = true);

-- -----------------------------------------------------------------------------
-- 2. Delete spam contacts (Bitcoin/yandex/scam domains)
-- -----------------------------------------------------------------------------
DELETE FROM public.contacts
WHERE
  LOWER(COALESCE(first_name, '') || ' ' || COALESCE(last_name, '')) ~ '(yandex\.com|bitcoin|btc|adult\s+dating|sex\s+dating|withdraw|transfer.*btc|http|https|\.ru|crypto|casino|viagra|t\.me|click\s*here)'
  OR LOWER(COALESCE(first_name, '')) ~ '(yandex|bitcoin|btc|http|viagra)'
  OR LOWER(COALESCE(last_name, '')) ~ '(yandex|bitcoin|btc|http|viagra|adult\s+dating|sex\s+dating)'
  OR LOWER(COALESCE(email_address, '')) ~ '@(mailvn\.top|automisly\.org)$';

-- -----------------------------------------------------------------------------
-- 3. Delete auth users who never created/joined an organization
-- -----------------------------------------------------------------------------
DELETE FROM auth.users
WHERE NOT EXISTS (SELECT 1 FROM public.admin_roles ar WHERE ar.user_id = auth.users.id)
  AND NOT EXISTS (SELECT 1 FROM public.organizations o WHERE o.owner_id = auth.users.id)
  AND NOT EXISTS (SELECT 1 FROM public.organization_members om WHERE om.user_id = auth.users.id AND om.is_active = true);

-- -----------------------------------------------------------------------------
-- 4. Commit (change to ROLLBACK to undo and do a dry run)
-- -----------------------------------------------------------------------------
COMMIT;
