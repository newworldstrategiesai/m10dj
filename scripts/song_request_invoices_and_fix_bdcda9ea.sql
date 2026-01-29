-- =============================================================================
-- 1) CANCEL INVOICES CREATED FROM SONG REQUESTS (they should not exist)
-- 2) FIX INVOICE bdcda9ea: total 2150, 1075 (50%) received, status Partial
-- =============================================================================
-- Run in Supabase SQL Editor. Review output of SELECTs before running UPDATEs.
-- =============================================================================

-- -----------------------------------------------------------------------------
-- STEP 1: Identify invoices that came from song requests (by invoice_title)
-- Note: crowd_requests may not have invoice_id column; we use title pattern only.
-- -----------------------------------------------------------------------------
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_title,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.contact_id
FROM invoices i
WHERE i.invoice_title ILIKE 'Song Request:%'
ORDER BY i.created_at DESC;

-- -----------------------------------------------------------------------------
-- STEP 2: Cancel those song-request invoices (so they don't clutter the list)
-- -----------------------------------------------------------------------------
UPDATE invoices
SET 
  invoice_status = 'Cancelled',
  amount_paid = 0,
  balance_due = 0,
  paid_date = NULL,
  updated_at = NOW()
WHERE invoice_title ILIKE 'Song Request:%';

-- -----------------------------------------------------------------------------
-- STEP 3: Fix specific invoice bdcda9ea (should be 2150 total, 1075 received, Partial)
-- -----------------------------------------------------------------------------
-- Current (wrong): 2500 total, 0 received
-- Correct: 2150 total, 1075 received, 1075 balance_due, status Partial

UPDATE invoices
SET 
  total_amount = 2150,
  amount_paid = 1075,
  balance_due = 1075,
  invoice_status = 'Partial',
  updated_at = NOW()
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Optional: ensure a payment record exists for the 1075 (if you use payments table for history)
-- Uncomment and run if you want one payment row for the 50% received.
/*
INSERT INTO payments (
  contact_id,
  invoice_id,
  organization_id,
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
  i.contact_id,
  i.id,
  i.organization_id,
  'Deposit / 50%',
  1075,
  'Paid',
  'Other',
  CURRENT_DATE,
  'Retroactive correction: 50% received',
  NOW(),
  NOW()
FROM invoices i
WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'
  AND NOT EXISTS (
    SELECT 1 FROM payments p 
    WHERE p.invoice_id = i.id AND p.payment_status = 'Paid'
  );
*/

-- -----------------------------------------------------------------------------
-- STEP 4: Verify
-- -----------------------------------------------------------------------------
SELECT 
  invoice_number,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due
FROM invoices
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Confirm song-request invoices are cancelled (optional)
SELECT invoice_number, invoice_status, invoice_title
FROM invoices
WHERE invoice_title ILIKE 'Song Request:%'
ORDER BY created_at DESC
LIMIT 20;
