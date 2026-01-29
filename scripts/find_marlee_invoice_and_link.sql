-- Step 1: DIAGNOSTIC – find the Marlee Condo invoice and quote state
-- Run each block in Supabase SQL Editor. Use results to get the invoice id for Step 2.

-- 1a) Contact and quote_selections for this lead (invoice_id may be null)
SELECT
  c.id AS contact_id,
  c.first_name,
  c.last_name,
  c.email_address,
  qs.id AS quote_selection_id,
  qs.lead_id,
  qs.invoice_id AS qs_invoice_id,
  qs.package_name,
  qs.total_price,
  qs.payment_status
FROM contacts c
LEFT JOIN quote_selections qs ON qs.lead_id = c.id
WHERE c.id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- 1b) Invoices that might be Marlee (by title or contact name)
SELECT i.id, i.invoice_number, i.invoice_title, i.total_amount, i.amount_paid, i.invoice_status,
       i.contact_id, c.first_name, c.last_name, c.email_address
FROM invoices i
LEFT JOIN contacts c ON c.id = i.contact_id
WHERE (i.invoice_title ILIKE '%marlee%' OR i.invoice_title ILIKE '%condo%')
   OR (c.first_name ILIKE '%marlee%' OR c.last_name ILIKE '%marlee%' OR c.last_name ILIKE '%condo%')
   OR i.contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
ORDER BY i.created_at DESC;

-- 1c) Recent invoices (if Marlee not in title/name – pick the right one)
SELECT i.id, i.invoice_number, i.invoice_title, i.total_amount, i.amount_paid, i.invoice_status,
       c.first_name, c.last_name
FROM invoices i
LEFT JOIN contacts c ON c.id = i.contact_id
WHERE i.invoice_status != 'Cancelled'
ORDER BY i.created_at DESC
LIMIT 20;


-- =============================================================================
-- Step 2: FIX – after you have the invoice id from Step 1
-- =============================================================================
-- Option A: Replace YOUR_INVOICE_ID_HERE below with the actual uuid, then run the DO block.
-- Option B: Or run the three UPDATEs under "Option B" with the id pasted in.

-- Option A (one block)
/*
DO $$
DECLARE
  inv_id uuid := 'YOUR_INVOICE_ID_HERE'::uuid;
  marlee_contact_id uuid := 'c082f6bd-d63c-4c23-992d-caa68c299017';
BEGIN
  UPDATE payments SET invoice_id = inv_id, updated_at = NOW() WHERE id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792';
  UPDATE invoices SET contact_id = marlee_contact_id, total_amount = CASE WHEN total_amount = 2500 THEN 2150 ELSE total_amount END, amount_paid = 1075, balance_due = 1075, invoice_status = 'Partial', updated_at = NOW() WHERE id = inv_id;
  UPDATE quote_selections SET invoice_id = inv_id, updated_at = NOW() WHERE lead_id = marlee_contact_id;
END $$;
*/

-- Option B (three UPDATEs – replace YOUR_INVOICE_ID_HERE in each)
-- UPDATE payments SET invoice_id = 'YOUR_INVOICE_ID_HERE'::uuid, updated_at = NOW() WHERE id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792';
-- UPDATE invoices SET contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017', total_amount = CASE WHEN total_amount = 2500 THEN 2150 ELSE total_amount END, amount_paid = 1075, balance_due = 1075, invoice_status = 'Partial', updated_at = NOW() WHERE id = 'YOUR_INVOICE_ID_HERE'::uuid;
-- UPDATE quote_selections SET invoice_id = 'YOUR_INVOICE_ID_HERE'::uuid, updated_at = NOW() WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';
