-- ================================================
-- CONTRACT DATA VERIFICATION
-- ================================================
-- Run this to see current state and what needs fixing

-- Current contract type distribution
SELECT
    'Contract Type Distribution' as report_section,
    contract_type,
    COUNT(*) as count
FROM public.contracts
GROUP BY contract_type
ORDER BY count DESC;

-- Contracts missing types
SELECT
    'Missing Contract Types' as report_section,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type IS NULL OR contract_type = '';

-- Broken relationships
SELECT
    'Broken Quote->Contract Links' as report_section,
    COUNT(*) as broken_links
FROM public.quote_selections qs
LEFT JOIN public.contracts c ON qs.contract_id = c.id
WHERE qs.contract_id IS NOT NULL AND c.id IS NULL;

SELECT
    'Broken Contract->Invoice Links' as report_section,
    COUNT(*) as broken_links
FROM public.contracts c
LEFT JOIN public.invoices i ON c.invoice_id = i.id
WHERE c.invoice_id IS NOT NULL AND i.id IS NULL;

-- Contracts that would be fixed
SELECT
    'Contracts Needing Type Assignment' as report_section,
    COUNT(*) as quote_based_would_be
FROM public.contracts
WHERE quote_selection_id IS NOT NULL
  AND (contract_type IS NULL OR contract_type NOT IN ('quote_based'));

-- Data integrity status
SELECT
    'Data Integrity Status' as report_section,
    CASE
        WHEN COUNT(*) = 0 THEN '✅ All relationships valid'
        ELSE '⚠️ ' || COUNT(*) || ' broken relationships found'
    END as status
FROM (
    SELECT qs.contract_id FROM public.quote_selections qs
    LEFT JOIN public.contracts c ON qs.contract_id = c.id
    WHERE qs.contract_id IS NOT NULL AND c.id IS NULL
    UNION ALL
    SELECT c.invoice_id FROM public.contracts c
    LEFT JOIN public.invoices i ON c.invoice_id = i.id
    WHERE c.invoice_id IS NOT NULL AND i.id IS NULL
) broken_links;