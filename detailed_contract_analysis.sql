-- ================================================
-- DETAILED CONTRACT ANALYSIS BASED ON YOUR RESULTS
-- ================================================

-- Based on your audit results, let's dig deeper into the issues

-- 1. Check total contracts and breakdown
SELECT
    'Total Contracts' as metric,
    COUNT(*) as count
FROM public.contracts
UNION ALL
SELECT
    'Contracts with contacts' as metric,
    COUNT(*) as count
FROM public.contracts WHERE contact_id IS NOT NULL
UNION ALL
SELECT
    'Contracts with valid contacts' as metric,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
UNION ALL
SELECT
    'Contracts with invalid contacts' as metric,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
UNION ALL
SELECT
    'Standalone contracts (no contact)' as metric,
    COUNT(*) as count
FROM public.contracts WHERE contact_id IS NULL;

-- 2. Check invoice relationships
SELECT
    'Contracts with invoices' as metric,
    COUNT(*) as count
FROM public.contracts WHERE invoice_id IS NOT NULL
UNION ALL
SELECT
    'Contracts with valid invoices' as metric,
    COUNT(*) as count
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
UNION ALL
SELECT
    'Contracts with invalid invoices' as metric,
    COUNT(*) as count
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
UNION ALL
SELECT
    'Quote-based contracts missing invoices' as metric,
    COUNT(*) as count
FROM public.contracts c
WHERE c.contract_type = 'quote_based'
  AND c.invoice_id IS NULL;

-- 3. Check quote selection relationships
SELECT
    'Total quote selections' as metric,
    COUNT(*) as count
FROM public.quote_selections
UNION ALL
SELECT
    'Quote selections with contracts' as metric,
    COUNT(*) as count
FROM public.quote_selections WHERE contract_id IS NOT NULL
UNION ALL
SELECT
    'Quote selections with valid contracts' as metric,
    COUNT(*) as count
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id)
UNION ALL
SELECT
    'Quote selections with invalid contracts' as metric,
    COUNT(*) as count
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id);

-- 4. Find specific broken relationships
SELECT
    'Broken contract-contact links' as issue_type,
    c.id as contract_id,
    c.contract_number,
    c.contact_id as invalid_contact_id
FROM public.contracts c
WHERE c.contact_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contacts WHERE id = c.contact_id)
LIMIT 5;

SELECT
    'Broken contract-invoice links' as issue_type,
    c.id as contract_id,
    c.contract_number,
    c.invoice_id as invalid_invoice_id
FROM public.contracts c
WHERE c.invoice_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.invoices WHERE id = c.invoice_id)
LIMIT 5;

SELECT
    'Broken quote-contract links' as issue_type,
    qs.id as quote_id,
    qs.lead_id,
    qs.contract_id as invalid_contract_id
FROM public.quote_selections qs
WHERE qs.contract_id IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.contracts WHERE id = qs.contract_id)
LIMIT 5;