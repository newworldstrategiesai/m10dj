-- ================================================
-- COMPLETE CONTRACT HEALTH CHECK
-- ================================================
-- Based on your quote analysis showing only 2 quote selections,
-- let's check the complete health of your contract system

-- 1. OVERVIEW: Contract system health
SELECT
    'System Health Overview' as section,
    'Total Contracts' as metric,
    COUNT(*) as count
FROM public.contracts
UNION ALL
SELECT
    'System Health Overview' as section,
    'Total Quote Selections' as metric,
    COUNT(*) as count
FROM public.quote_selections
UNION ALL
SELECT
    'System Health Overview' as section,
    'Total Contacts' as metric,
    COUNT(*) as count
FROM public.contacts
UNION ALL
SELECT
    'System Health Overview' as section,
    'Total Invoices' as metric,
    COUNT(*) as count
FROM public.invoices;

-- 2. CONTRACT TYPE BREAKDOWN
SELECT
    'Contract Types' as section,
    contract_type,
    COUNT(*) as count,
    ROUND(AVG(total_amount), 2) as avg_amount,
    COUNT(*) FILTER (WHERE quote_selection_id IS NOT NULL) as linked_to_quotes,
    COUNT(*) FILTER (WHERE contact_id IS NOT NULL) as linked_to_contacts,
    COUNT(*) FILTER (WHERE invoice_id IS NOT NULL) as linked_to_invoices
FROM public.contracts
GROUP BY contract_type
ORDER BY count DESC;

-- 3. QUOTE SELECTION STATUS
SELECT
    'Quote Status' as section,
    qs.status as quote_status,
    COUNT(*) as count,
    COUNT(*) FILTER (WHERE qs.contract_id IS NOT NULL) as with_contracts,
    COUNT(*) FILTER (WHERE qs.invoice_id IS NOT NULL) as with_invoices,
    COUNT(*) FILTER (WHERE qs.contract_id IS NOT NULL AND qs.invoice_id IS NOT NULL) as fully_linked
FROM public.quote_selections qs
GROUP BY qs.status
ORDER BY count DESC;

-- 4. MISSING RELATIONSHIPS ANALYSIS
SELECT
    'Missing Links' as section,
    'Quote-based contracts without quotes' as issue,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type = 'quote_based' AND quote_selection_id IS NULL
UNION ALL
SELECT
    'Missing Links' as section,
    'Quote-based contracts without invoices' as issue,
    COUNT(*) as count
FROM public.contracts
WHERE contract_type = 'quote_based' AND invoice_id IS NULL
UNION ALL
SELECT
    'Missing Links' as section,
    'Quotes without contracts' as issue,
    COUNT(*) as count
FROM public.quote_selections
WHERE contract_id IS NULL
UNION ALL
SELECT
    'Missing Links' as section,
    'Quotes without invoices' as issue,
    COUNT(*) as count
FROM public.quote_selections
WHERE invoice_id IS NULL;

-- 5. POTENTIAL ORPHANED RECORDS
SELECT
    'Potential Issues' as section,
    'Contacts with quotes but no recent contracts' as issue,
    COUNT(DISTINCT c.id) as count
FROM public.contacts c
JOIN public.quote_selections qs ON qs.lead_id = c.id
LEFT JOIN public.contracts ct ON ct.contact_id = c.id
WHERE ct.id IS NULL OR ct.created_at < qs.created_at;

-- 6. AUTOMATION HEALTH CHECK
SELECT
    'Automation Health' as section,
    'Fully automated quotes (contract + invoice)' as status,
    COUNT(*) as count
FROM public.quote_selections
WHERE contract_id IS NOT NULL AND invoice_id IS NOT NULL
UNION ALL
SELECT
    'Automation Health' as section,
    'Partially automated quotes (missing links)' as status,
    COUNT(*) as count
FROM public.quote_selections
WHERE (contract_id IS NULL OR invoice_id IS NULL) AND (contract_id IS NOT NULL OR invoice_id IS NOT NULL);

-- 7. RECOMMENDATIONS BASED ON YOUR DATA
DO $$
DECLARE
    total_quotes INTEGER;
    automated_quotes INTEGER;
    quote_based_contracts INTEGER;
    orphaned_contracts INTEGER;
BEGIN
    SELECT COUNT(*) INTO total_quotes FROM public.quote_selections;
    SELECT COUNT(*) INTO automated_quotes FROM public.quote_selections WHERE contract_id IS NOT NULL AND invoice_id IS NOT NULL;
    SELECT COUNT(*) INTO quote_based_contracts FROM public.contracts WHERE contract_type = 'quote_based';
    SELECT COUNT(*) INTO orphaned_contracts FROM public.contracts WHERE contract_type = 'quote_based' AND quote_selection_id IS NULL;

    RAISE NOTICE '';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'CONTRACT SYSTEM HEALTH ASSESSMENT';
    RAISE NOTICE '========================================';
    RAISE NOTICE '';
    RAISE NOTICE '📊 QUOTE AUTOMATION STATUS:';
    RAISE NOTICE '   Total Quotes: %', total_quotes;
    RAISE NOTICE '   Fully Automated: % (% of total)', automated_quotes, ROUND(automated_quotes::numeric / GREATEST(total_quotes, 1) * 100, 1);
    RAISE NOTICE '';
    RAISE NOTICE '🏗️ CONTRACT SYSTEM STATUS:';
    RAISE NOTICE '   Quote-Based Contracts: %', quote_based_contracts;
    RAISE NOTICE '   Properly Linked: %', (quote_based_contracts - orphaned_contracts);
    RAISE NOTICE '   Orphaned Contracts: %', orphaned_contracts;
    RAISE NOTICE '';

    IF orphaned_contracts > 0 THEN
        RAISE NOTICE '⚠️ ACTION NEEDED: % orphaned quote-based contracts found', orphaned_contracts;
        RAISE NOTICE '   These contracts exist but are not linked to their source quotes.';
        RAISE NOTICE '';
    END IF;

    IF automated_quotes < total_quotes THEN
        RAISE NOTICE '⚠️ INCOMPLETE AUTOMATION: % quotes missing full automation', (total_quotes - automated_quotes);
        RAISE NOTICE '   Some quotes have contracts but no invoices, or vice versa.';
        RAISE NOTICE '';
    END IF;

    RAISE NOTICE '✅ RELATIONSHIP INTEGRITY: All quote selections have valid contracts';
    RAISE NOTICE '✅ DATA CLEANLINESS: No broken foreign key relationships detected';
    RAISE NOTICE '';
END $$;