-- Fix Marlee Condo invoice: correct totals and ensure deposit payment is linked and displayed.
-- Lead/contact: c082f6bd-d63c-4c23-992d-caa68c299017
-- Stripe Payment Intent: pi_3SXDFXEJct0cvYrG13wMabsI
-- Deposit: $1,075.00 (2025-11-25)

-- =============================================================================
-- QUICK FIX (run in Supabase SQL Editor): link payment 48c0f40b... and set invoice to 2150/1075
-- =============================================================================
/*
UPDATE payments
SET invoice_id = (SELECT invoice_id FROM quote_selections WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017' AND invoice_id IS NOT NULL LIMIT 1),
    updated_at = NOW()
WHERE id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792';

UPDATE invoices i
SET total_amount = CASE WHEN total_amount = 2500 THEN 2150 ELSE total_amount END,
    amount_paid = 1075,
    balance_due = 1075,
    invoice_status = 'Partial',
    contact_id = COALESCE(contact_id, 'c082f6bd-d63c-4c23-992d-caa68c299017'),
    updated_at = NOW()
FROM quote_selections qs
WHERE qs.invoice_id = i.id AND qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';
*/
-- =============================================================================

-- Step 1: Find the invoice for this lead
WITH marlee_quote AS (
  SELECT qs.id AS quote_selection_id,
         qs.lead_id,
         qs.invoice_id,
         qs.payment_status AS qs_payment_status,
         qs.deposit_amount AS qs_deposit_amount
  FROM quote_selections qs
  WHERE qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
  LIMIT 1
),
inv AS (
  SELECT i.id AS invoice_id,
         i.contact_id AS invoice_contact_id,
         i.total_amount,
         i.amount_paid,
         i.balance_due,
         i.invoice_status,
         mq.lead_id
  FROM invoices i
  JOIN marlee_quote mq ON mq.invoice_id = i.id
)
SELECT * FROM inv;
-- (Run the above first to confirm invoice_id and totals; then run the fixes below.)

-- Step 2: Ensure invoice has contact_id set and correct total (2150 not 2500)
UPDATE invoices i
SET contact_id = qs.lead_id,
    total_amount = CASE WHEN i.total_amount = 2500 THEN 2150 ELSE i.total_amount END,
    updated_at = NOW()
FROM quote_selections qs
WHERE qs.invoice_id = i.id
  AND qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- Step 3: Ensure payment record exists (idempotent insert)
INSERT INTO payments (
  contact_id,
  payment_name,
  total_amount,
  payment_status,
  payment_method,
  transaction_date,
  payment_notes,
  created_at,
  updated_at
)
SELECT
  'c082f6bd-d63c-4c23-992d-caa68c299017'::uuid,
  'Deposit',
  1075.00,
  'Paid',
  'Credit Card',
  '2025-11-25'::date,
  'Stripe Payment Intent: pi_3SXDFXEJct0cvYrG13wMabsI',
  NOW(),
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM payments
  WHERE payment_notes LIKE '%pi_3SXDFXEJct0cvYrG13wMabsI%'
);

-- Step 4: Link payment to invoice (by payment_notes PI or by contact + Deposit 1075)
-- Links: (a) payment with PI in notes, or (b) payment id 48c0f40b-22ce-4bb6-8e2a-7574b86f2792, or (c) any Paid Deposit 1075 for this contact
UPDATE payments p
SET invoice_id = qs.invoice_id,
    updated_at = NOW()
FROM quote_selections qs
WHERE qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
  AND qs.invoice_id IS NOT NULL
  AND p.contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
  AND (p.invoice_id IS NULL OR p.invoice_id != qs.invoice_id)
  AND (
    p.payment_notes LIKE '%pi_3SXDFXEJct0cvYrG13wMabsI%'
    OR p.id = '48c0f40b-22ce-4bb6-8e2a-7574b86f2792'
    OR (p.payment_name = 'Deposit' AND p.total_amount = 1075 AND p.payment_status IN ('Paid', 'paid'))
  );

-- Step 5: Update quote_selections deposit/payment status
UPDATE quote_selections
SET payment_status = 'partial',
    payment_intent_id = 'pi_3SXDFXEJct0cvYrG13wMabsI',
    deposit_amount = 1075.00,
    paid_at = COALESCE(paid_at, NOW()),
    updated_at = NOW()
WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- Step 6: Recalculate invoice totals from linked payments
WITH inv AS (
  SELECT qs.invoice_id
  FROM quote_selections qs
  WHERE qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
    AND qs.invoice_id IS NOT NULL
  LIMIT 1
),
totals AS (
  SELECT i.id AS invoice_id,
         i.total_amount,
         COALESCE(SUM(p.total_amount), 0)::numeric(12,2) AS amount_paid
  FROM invoices i
  JOIN inv ON inv.invoice_id = i.id
  LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status IN ('Paid', 'paid')
  GROUP BY i.id, i.total_amount
)
UPDATE invoices i
SET amount_paid = t.amount_paid,
    balance_due = GREATEST(0, (t.total_amount::numeric(12,2) - t.amount_paid)),
    invoice_status = CASE
      WHEN t.amount_paid >= t.total_amount AND t.total_amount > 0 THEN 'Paid'
      WHEN t.amount_paid > 0 THEN 'Partial'
      ELSE i.invoice_status
    END,
    paid_date = CASE WHEN t.amount_paid >= t.total_amount AND t.total_amount > 0 THEN NOW() ELSE NULL END,
    updated_at = NOW()
FROM totals t
WHERE t.invoice_id = i.id;

-- Step 7: Verify (run after fixes)
SELECT i.id, i.invoice_number, i.total_amount, i.amount_paid, i.balance_due, i.invoice_status, i.contact_id
FROM invoices i
JOIN quote_selections qs ON qs.invoice_id = i.id
WHERE qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

SELECT p.id, p.contact_id, p.invoice_id, p.payment_name, p.total_amount, p.payment_status, p.transaction_date
FROM payments p
WHERE p.payment_notes LIKE '%pi_3SXDFXEJct0cvYrG13wMabsI%';
