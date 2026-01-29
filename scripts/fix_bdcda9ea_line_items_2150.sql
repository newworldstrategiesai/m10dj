-- Fix invoice bdcda9ea: update line_items JSONB so displayed line item shows 2150 instead of 2500.
-- Run in Supabase SQL Editor. Totals are already correct; this updates the stored line item amounts.

-- Optional: inspect current line_items before update
-- SELECT id, line_items FROM invoices WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Update: replace 2500 (or 2500.00) with 2150 in JSON numeric values
UPDATE invoices
SET 
  line_items = regexp_replace(
    line_items::text,
    ':\s*2500(\.0*)?\s*([,}])',
    ': 2150\2',
    'g'
  )::jsonb,
  updated_at = NOW()
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'
  AND line_items IS NOT NULL;

-- Verify
SELECT id, line_items, total_amount, updated_at FROM invoices WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
