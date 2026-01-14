-- ================================================
-- FINAL CONTRACT DATA VERIFICATION
-- ================================================
-- Run this after applying fixes to verify everything is correct

-- Final integrity check
SELECT
    '✅ Contracts with valid contacts' as status,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
UNION ALL
SELECT
    '✅ Contracts with valid invoices' as status,
    COUNT(*) as count
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
UNION ALL
SELECT
    '✅ Quote selections with valid contracts' as status,
    COUNT(*) as count
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id)
UNION ALL
SELECT
    '✅ Total contracts' as status,
    COUNT(*) as count
FROM public.contracts
UNION ALL
SELECT
    '✅ Contracts with proper types' as status,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type IS NOT NULL AND contract_type != ''
UNION ALL
SELECT
    '✅ Quote-based contracts' as status,
    COUNT(*) as count
FROM public.contracts WHERE contract_type = 'quote_based'
UNION ALL
SELECT
    '✅ Standalone contracts' as status,
    COUNT(*) as count
FROM public.contracts WHERE contract_type IN ('nda', 'personal_agreement');

-- Check for any remaining issues
SELECT
    '⚠️ Contracts missing types' as issue,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type IS NULL OR contract_type = ''
UNION ALL
SELECT
    '⚠️ Remaining broken contact links' as issue,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
UNION ALL
SELECT
    '⚠️ Remaining broken invoice links' as issue,
    COUNT(*) as count
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
UNION ALL
SELECT
    '⚠️ Remaining broken quote links' as issue,
    COUNT(*) as count
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id);