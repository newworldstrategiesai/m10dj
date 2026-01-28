-- Fix Specific Invoice: c43b6fe2-b130-429d-aa73-775fb50f19a8
-- This script checks and fixes the specific invoice mentioned

-- STEP 1: Check current invoice status and payment records
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  i.paid_date,
  i.contact_id,
  c.first_name || ' ' || c.last_name as contact_name,
  c.email_address,
  COUNT(p.id) as payment_count,
  COALESCE(SUM(p.total_amount), 0) as payment_total,
  COALESCE(SUM(p.gratuity), 0) as total_gratuity
FROM invoices i
LEFT JOIN contacts c ON c.id = i.contact_id
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, 
         i.balance_due, i.paid_date, i.contact_id, c.first_name, c.last_name, c.email_address;

-- STEP 2: Check payment records for this invoice
-- Note: stripe_session_id and stripe_payment_intent columns are optional and may not exist
SELECT 
  id,
  invoice_id,
  payment_name,
  total_amount,
  gratuity,
  total_amount + COALESCE(gratuity, 0) as total_payment,
  payment_status,
  payment_method,
  transaction_date,
  payment_notes,
  created_at
FROM payments
WHERE invoice_id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
ORDER BY created_at DESC;

-- STEP 2b (Optional): If Stripe columns exist, check them too
-- Uncomment this if you want to see Stripe payment IDs (may fail if columns don't exist)
/*
SELECT 
  id,
  invoice_id,
  payment_name,
  total_amount,
  gratuity,
  payment_status,
  stripe_session_id,
  stripe_payment_intent,
  created_at
FROM payments
WHERE invoice_id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
ORDER BY created_at DESC;
*/

-- STEP 3: Fix the invoice based on findings
-- Option A: If invoice is marked as Paid but has no payment records, revert to unpaid
DO $$
DECLARE
  v_invoice_id UUID := 'c43b6fe2-b130-429d-aa73-775fb50f19a8';
  v_payment_count INT;
  v_payment_total NUMERIC;
  v_invoice_total NUMERIC;
  v_amount_paid NUMERIC;
  v_new_status VARCHAR(50);
BEGIN
  -- Get payment count and total
  SELECT COUNT(*), COALESCE(SUM(total_amount), 0)
  INTO v_payment_count, v_payment_total
  FROM payments
  WHERE invoice_id = v_invoice_id
    AND payment_status = 'Paid';
  
  -- Get invoice details
  SELECT total_amount, amount_paid
  INTO v_invoice_total, v_amount_paid
  FROM invoices
  WHERE id = v_invoice_id;
  
  RAISE NOTICE 'Invoice Status Check:';
  RAISE NOTICE '  Payment Count: %', v_payment_count;
  RAISE NOTICE '  Payment Total: %', v_payment_total;
  RAISE NOTICE '  Invoice Total: %', v_invoice_total;
  RAISE NOTICE '  Amount Paid (invoice): %', v_amount_paid;
  
  -- Determine appropriate status
  IF v_payment_count = 0 THEN
    -- No payment records - revert to unpaid
    IF v_amount_paid > 0 AND v_amount_paid < v_invoice_total THEN
      v_new_status := 'Partial';
    ELSE
      v_new_status := 'Sent';
    END IF;
    
    UPDATE invoices
    SET 
      invoice_status = v_new_status,
      amount_paid = 0,
      balance_due = v_invoice_total,
      paid_date = NULL,
      updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RAISE NOTICE 'Fixed: Reverted invoice to % status (no payment records found)', v_new_status;
    
  ELSIF v_payment_total >= v_invoice_total THEN
    -- Payment records show invoice is fully paid
    UPDATE invoices
    SET 
      invoice_status = 'Paid',
      amount_paid = v_payment_total,
      balance_due = 0,
      paid_date = COALESCE(paid_date, NOW()),
      updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RAISE NOTICE 'Fixed: Updated invoice to Paid status (payment records confirm payment)';
    
  ELSIF v_payment_total > 0 THEN
    -- Partial payment
    UPDATE invoices
    SET 
      invoice_status = 'Partial',
      amount_paid = v_payment_total,
      balance_due = v_invoice_total - v_payment_total,
      updated_at = NOW()
    WHERE id = v_invoice_id;
    
    RAISE NOTICE 'Fixed: Updated invoice to Partial status (payment: %, balance: %)', 
      v_payment_total, v_invoice_total - v_payment_total;
  ELSE
    RAISE NOTICE 'No changes needed - invoice status matches payment records';
  END IF;
END $$;

-- STEP 4: Verify the fix
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  COUNT(p.id) as payment_count,
  COALESCE(SUM(p.total_amount), 0) as payment_total
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, i.balance_due;

-- Expected Results:
-- If no payment records exist:
--   invoice_status: 'Sent' or 'Partial' (depending on amount_paid)
--   amount_paid: 0
--   balance_due: total_amount
--   payment_count: 0
--
-- If payment records exist:
--   invoice_status: 'Paid' or 'Partial' (depending on payment_total vs total_amount)
--   amount_paid: payment_total
--   balance_due: total_amount - payment_total
--   payment_count: > 0
