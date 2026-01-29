-- Link payment 48c0f40b-22ce-4bb6-8e2a-7574b86f2792 to Marlee Condo invoice and set totals.
-- Run in Supabase SQL Editor (one shot). Uses contact_id if quote_selections has no invoice_id.

-- Optional: run this first to see which invoice (if any) will be used
-- SELECT invoice_id FROM quote_selections WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017' AND invoice_id IS NOT NULL LIMIT 1;
-- SELECT id, invoice_number, total_amount, contact_id FROM invoices WHERE contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017' AND invoice_status != 'Cancelled' ORDER BY created_at DESC LIMIT 1;

-- 1) Link payment to invoice (try quote_selections first, else invoice by contact_id)
UPDATE payments
SET invoice_id = COALESCE(
  (SELECT invoice_id FROM quote_selections
   WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017' AND invoice_id IS NOT NULL
   LIMIT 1),
  (SELECT id FROM invoices
   WHERE contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
     AND invoice_status != 'Cancelled'
   ORDER BY created_at DESC NULLS LAST
   LIMIT 1)
),
updated_at = NOW()
WHERE id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792';

-- 2) Set invoice total to 2150 (if 2500), amount_paid 1075, balance_due 1075, status Partial
--    (only the invoice we just linked the payment to)
UPDATE invoices i
SET
  total_amount = CASE WHEN i.total_amount = 2500 THEN 2150 ELSE i.total_amount END,
  amount_paid = 1075,
  balance_due = 1075,
  invoice_status = 'Partial',
  contact_id = COALESCE(i.contact_id, 'c082f6bd-d63c-4c23-992d-caa68c299017'),
  updated_at = NOW()
WHERE i.id = (SELECT invoice_id FROM payments WHERE id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792');
