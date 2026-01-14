-- ================================================
-- FIX BROKEN CONTRACT RELATIONSHIPS
-- ================================================
-- Based on your audit results, fix the broken relationships

-- STEP 1: Remove invalid contact references
UPDATE public.contracts
SET contact_id = NULL
WHERE contact_id IS NOT NULL
  AND contact_id NOT IN (SELECT id FROM public.contacts);

-- STEP 2: Remove invalid invoice references
UPDATE public.contracts
SET invoice_id = NULL
WHERE invoice_id IS NOT NULL
  AND invoice_id NOT IN (SELECT id FROM public.invoices);

-- STEP 3: Remove invalid contract references from quotes
UPDATE public.quote_selections
SET contract_id = NULL
WHERE contract_id IS NOT NULL
  AND contract_id NOT IN (SELECT id FROM public.contracts);

-- STEP 4: For quote-based contracts missing invoices, try to find them
UPDATE public.contracts
SET invoice_id = (
    SELECT qs.invoice_id
    FROM public.quote_selections qs
    WHERE qs.contract_id = public.contracts.id
      AND qs.invoice_id IS NOT NULL
    LIMIT 1
)
WHERE contract_type = 'quote_based'
  AND invoice_id IS NULL
  AND id IN (
      SELECT c.id
      FROM public.contracts c
      JOIN public.quote_selections qs ON qs.contract_id = c.id
      WHERE qs.invoice_id IS NOT NULL
  );

-- STEP 5: For quotes missing contracts, try to find existing contracts
UPDATE public.quote_selections
SET contract_id = (
    SELECT c.id
    FROM public.contracts c
    WHERE c.quote_selection_id = public.quote_selections.id
    LIMIT 1
)
WHERE contract_id IS NULL
  AND id IN (
      SELECT qs.id
      FROM public.quote_selections qs
      JOIN public.contracts c ON c.quote_selection_id = qs.id
  );

-- STEP 6: Report what was fixed
SELECT
    'Invalid contact references removed' as action,
    COUNT(*) as count
FROM (
    SELECT 1 as dummy
    FROM public.contracts
    WHERE contact_id IS NOT NULL
      AND contact_id NOT IN (SELECT id FROM public.contacts)
) removed_contacts

UNION ALL

SELECT
    'Invalid invoice references removed' as action,
    COUNT(*) as count
FROM (
    SELECT 1 as dummy
    FROM public.contracts
    WHERE invoice_id IS NOT NULL
      AND invoice_id NOT IN (SELECT id FROM public.invoices)
) removed_invoices

UNION ALL

SELECT
    'Invalid contract references removed from quotes' as action,
    COUNT(*) as count
FROM (
    SELECT 1 as dummy
    FROM public.quote_selections
    WHERE contract_id IS NOT NULL
      AND contract_id NOT IN (SELECT id FROM public.contracts)
) removed_contracts

UNION ALL

SELECT
    'Quote-based contracts linked to invoices' as action,
    COUNT(*) as count
FROM (
    SELECT 1 as dummy
    FROM public.contracts c
    JOIN public.quote_selections qs ON qs.contract_id = c.id
    WHERE c.contract_type = 'quote_based'
      AND c.invoice_id IS NULL
      AND qs.invoice_id IS NOT NULL
) linked_invoices;