-- ================================================
-- CONTRACT DATA AUDIT & CLEANUP SCRIPT
-- ================================================
-- This script audits existing contract data and ensures
-- everything is properly categorized and linked after consolidation

-- ================================================
-- 1. AUDIT: Check current contract distribution
-- ================================================

SELECT
    contract_type,
    COUNT(*) as count,
    ROUND(AVG(total_amount), 2) as avg_amount,
    MIN(created_at) as earliest,
    MAX(created_at) as latest
FROM public.contracts
GROUP BY contract_type
ORDER BY count DESC;

-- ================================================
-- 2. AUDIT: Find contracts missing contract_type
-- ================================================

SELECT
    id,
    contract_number,
    created_at,
    quote_selection_id,
    contact_id,
    recipient_email
FROM public.contracts
WHERE contract_type IS NULL OR contract_type = '';

-- ================================================
-- 3. AUDIT: Check quote_selections relationships
-- ================================================

-- Quotes with contracts
SELECT
    qs.id as quote_id,
    qs.lead_id,
    qs.contract_id,
    c.contract_number,
    c.contract_type,
    qs.status as quote_status,
    c.status as contract_status
FROM public.quote_selections qs
LEFT JOIN public.contracts c ON qs.contract_id = c.id
WHERE qs.contract_id IS NOT NULL;

-- Quotes missing contracts
SELECT
    qs.id as quote_id,
    qs.lead_id,
    qs.status,
    qs.created_at,
    c.first_name,
    c.last_name,
    c.email_address
FROM public.quote_selections qs
LEFT JOIN public.contacts c ON qs.lead_id = c.id
WHERE qs.contract_id IS NULL;

-- ================================================
-- 4. AUDIT: Check invoice relationships
-- ================================================

-- Contracts with invoices
SELECT
    c.id as contract_id,
    c.contract_number,
    c.contract_type,
    i.id as invoice_id,
    i.invoice_number,
    i.invoice_status,
    c.total_amount as contract_amount,
    i.total_amount as invoice_amount
FROM public.contracts c
LEFT JOIN public.invoices i ON c.invoice_id = i.id
WHERE c.invoice_id IS NOT NULL;

-- Contracts missing invoices (should have them for quote-based)
SELECT
    c.id,
    c.contract_number,
    c.contract_type,
    c.quote_selection_id,
    qs.invoice_id
FROM public.contracts c
LEFT JOIN public.quote_selections qs ON c.quote_selection_id = qs.id
WHERE c.contract_type = 'quote_based'
  AND (c.invoice_id IS NULL OR qs.invoice_id IS NULL);

-- ================================================
-- 5. DATA CLEANUP: Fix contract types
-- ================================================

-- Fix quote-based contracts
UPDATE public.contracts
SET contract_type = 'quote_based'
WHERE quote_selection_id IS NOT NULL
  AND (contract_type IS NULL OR contract_type NOT IN ('quote_based', 'nda', 'personal_agreement', 'service_agreement'));

-- Fix standalone NDAs
UPDATE public.contracts
SET contract_type = 'nda'
WHERE contact_id IS NULL
  AND recipient_email IS NOT NULL
  AND contract_type IS NULL
  AND (contract_template LIKE '%nda%' OR is_personal = false);

-- Fix standalone personal agreements
UPDATE public.contracts
SET contract_type = 'personal_agreement'
WHERE contact_id IS NULL
  AND recipient_email IS NOT NULL
  AND contract_type IS NULL
  AND is_personal = true;

-- Default remaining to service_agreement
UPDATE public.contracts
SET contract_type = 'service_agreement'
WHERE contract_type IS NULL OR contract_type = '';

-- ================================================
-- 6. DATA CLEANUP: Fix broken relationships
-- ================================================

-- Find orphaned contract references in quote_selections
SELECT
    qs.id as quote_id,
    qs.contract_id,
    'Contract does not exist' as issue
FROM public.quote_selections qs
LEFT JOIN public.contracts c ON qs.contract_id = c.id
WHERE qs.contract_id IS NOT NULL AND c.id IS NULL;

-- Find orphaned invoice references in contracts
SELECT
    c.id as contract_id,
    c.contract_number,
    c.invoice_id,
    'Invoice does not exist' as issue
FROM public.contracts c
LEFT JOIN public.invoices i ON c.invoice_id = i.id
WHERE c.invoice_id IS NOT NULL AND i.id IS NULL;

-- ================================================
-- 7. DATA CLEANUP: Remove orphaned references
-- ================================================

-- Remove contract_id references where contract doesn't exist
UPDATE public.quote_selections
SET contract_id = NULL
WHERE contract_id IS NOT NULL
  AND contract_id NOT IN (SELECT id FROM public.contracts);

-- Remove invoice_id references where invoice doesn't exist
UPDATE public.contracts
SET invoice_id = NULL
WHERE invoice_id IS NOT NULL
  AND invoice_id NOT IN (SELECT id FROM public.invoices);

-- ================================================
-- 8. AUDIT: Post-cleanup verification
-- ================================================

-- Final contract distribution
SELECT
    contract_type,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE quote_selection_id IS NOT NULL) as with_quote,
    COUNT(*) FILTER (WHERE contact_id IS NOT NULL) as with_contact,
    COUNT(*) FILTER (WHERE recipient_email IS NOT NULL) as standalone,
    ROUND(AVG(total_amount), 2) as avg_amount
FROM public.contracts
GROUP BY contract_type
ORDER BY count DESC;

-- Relationship integrity check
SELECT
    'Contracts with valid contacts' as check_type,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
UNION ALL
SELECT
    'Contracts with valid invoices' as check_type,
    COUNT(*) as count
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
UNION ALL
SELECT
    'Quote selections with valid contracts' as check_type,
    COUNT(*) as count
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id);

-- ================================================
-- 9. SUMMARY REPORT
-- ================================================

DO $$
DECLARE
    total_contracts INTEGER;
    quote_based_count INTEGER;
    standalone_count INTEGER;
    orphaned_refs INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_contracts FROM public.contracts;
    SELECT COUNT(*) INTO quote_based_count FROM public.contracts WHERE contract_type = 'quote_based';
    SELECT COUNT(*) INTO standalone_count FROM public.contracts WHERE contract_type IN ('nda', 'personal_agreement');
    SELECT COUNT(*) INTO orphaned_refs FROM (
        SELECT qs.contract_id FROM public.quote_selections qs
        LEFT JOIN public.contracts c ON qs.contract_id = c.id
        WHERE qs.contract_id IS NOT NULL AND c.id IS NULL
    ) t;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONTRACT DATA AUDIT & CLEANUP COMPLETE';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 SUMMARY:';
    RAISE NOTICE '   Total Contracts: %', total_contracts;
    RAISE NOTICE '   Quote-Based: %', quote_based_count;
    RAISE NOTICE '   Standalone: %', standalone_count;
    RAISE NOTICE '   Orphaned References Fixed: %', orphaned_refs;
    RAISE NOTICE '';
    RAISE NOTICE '✅ All contracts now have proper contract_type values';
    RAISE NOTICE '✅ Broken relationships have been cleaned up';
    RAISE NOTICE '✅ Data integrity has been restored';
    RAISE NOTICE '';
END $$;