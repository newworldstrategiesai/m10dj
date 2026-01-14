-- ================================================
-- QUICK CONTRACT DATA AUDIT & FIX
-- ================================================
-- Run this to quickly audit and fix contract data issues

-- Step 1: Fix missing contract types
UPDATE public.contracts
SET contract_type = 'quote_based'
WHERE quote_selection_id IS NOT NULL
  AND (contract_type IS NULL OR contract_type = '');

UPDATE public.contracts
SET contract_type = 'nda'
WHERE contact_id IS NULL
  AND recipient_email IS NOT NULL
  AND contract_type IS NULL
  AND (contract_template LIKE '%nda%' OR is_personal = false);

UPDATE public.contracts
SET contract_type = 'personal_agreement'
WHERE contact_id IS NULL
  AND recipient_email IS NOT NULL
  AND contract_type IS NULL
  AND is_personal = true;

UPDATE public.contracts
SET contract_type = 'service_agreement'
WHERE contract_type IS NULL OR contract_type = '';

-- Step 2: Fix broken relationships
UPDATE public.quote_selections
SET contract_id = NULL
WHERE contract_id IS NOT NULL
  AND contract_id NOT IN (SELECT id FROM public.contracts);

UPDATE public.contracts
SET invoice_id = NULL
WHERE invoice_id IS NOT NULL
  AND invoice_id NOT IN (SELECT id FROM public.invoices);

-- Step 3: Report results
SELECT
    'Contract Types Fixed' as action,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type IS NOT NULL
UNION ALL
SELECT
    'Orphaned References Removed' as action,
    (SELECT COUNT(*) FROM public.quote_selections WHERE contract_id IS NULL) as count
FROM public.quote_selections
LIMIT 1;