-- Fix Invoice Payment: $200 invoice + $30 gratuity = $230 total payment
-- This script corrects the invoice and payment records for a specific case
-- where the invoice was $200 but the client paid $230 (including $30 gratuity)

-- STEP 1: Find the invoice (replace with actual invoice number or ID)
-- Option A: Search by invoice number
-- SELECT id, invoice_number, total_amount, amount_paid, balance_due, invoice_status, contact_id
-- FROM invoices
-- WHERE invoice_number = 'INV-XXXXX';  -- Replace with actual invoice number

-- Option B: Search by contact and recent date
-- SELECT id, invoice_number, total_amount, amount_paid, balance_due, invoice_status, created_at
-- FROM invoices
-- WHERE contact_id = 'contact-uuid-here'  -- Replace with contact ID
--   AND total_amount = 200.00
--   AND created_at > '2026-01-20'  -- Adjust date as needed
-- ORDER BY created_at DESC;

-- STEP 2: Update the invoice (replace 'invoice-uuid-here' with actual invoice ID)
-- This sets the invoice as paid with the base amount ($200)
DO $$
DECLARE
  v_invoice_id UUID := 'invoice-uuid-here';  -- REPLACE WITH ACTUAL INVOICE ID
  v_invoice_total NUMERIC := 200.00;
  v_amount_paid NUMERIC := 200.00;  -- Base invoice amount (excluding gratuity)
BEGIN
  UPDATE invoices
  SET 
    invoice_status = 'Paid',
    amount_paid = v_amount_paid,
    balance_due = v_invoice_total - v_amount_paid,  -- Should be 0
    paid_date = COALESCE(paid_date, NOW()),  -- Keep existing paid_date if set
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
  RAISE NOTICE 'Updated invoice %: status=Paid, amount_paid=%, balance_due=%', 
    v_invoice_id, v_amount_paid, v_invoice_total - v_amount_paid;
END $$;

-- STEP 3: Find and update the payment record
-- The payment record should have:
--   total_amount = 200.00 (base payment, excluding gratuity)
--   gratuity = 30.00 (separate gratuity field)
DO $$
DECLARE
  v_invoice_id UUID := 'invoice-uuid-here';  -- REPLACE WITH ACTUAL INVOICE ID
  v_payment_total NUMERIC := 200.00;  -- Base payment amount
  v_gratuity NUMERIC := 30.00;  -- Gratuity amount
  v_payment_id UUID;
BEGIN
  -- Find the most recent payment for this invoice
  SELECT id INTO v_payment_id
  FROM payments
  WHERE invoice_id = v_invoice_id
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_payment_id IS NOT NULL THEN
    -- Update payment record
    UPDATE payments
    SET 
      total_amount = v_payment_total,  -- Base payment (excluding gratuity)
      gratuity = v_gratuity,  -- Gratuity amount
      payment_status = 'Paid',
      updated_at = NOW()
    WHERE id = v_payment_id;
    
    RAISE NOTICE 'Updated payment %: total_amount=%, gratuity=%, total_payment=%', 
      v_payment_id, v_payment_total, v_gratuity, v_payment_total + v_gratuity;
  ELSE
    RAISE NOTICE 'No payment record found for invoice %', v_invoice_id;
  END IF;
END $$;

-- STEP 4: Verify the updates
-- SELECT 
--   i.id as invoice_id,
--   i.invoice_number,
--   i.total_amount as invoice_total,
--   i.amount_paid,
--   i.balance_due,
--   i.invoice_status,
--   p.id as payment_id,
--   p.total_amount as payment_base,
--   p.gratuity,
--   p.total_amount + COALESCE(p.gratuity, 0) as total_payment,
--   p.payment_status
-- FROM invoices i
-- LEFT JOIN payments p ON p.invoice_id = i.id
-- WHERE i.id = 'invoice-uuid-here';  -- REPLACE WITH ACTUAL INVOICE ID

-- Expected Results:
-- invoice_total: 200.00
-- amount_paid: 200.00
-- balance_due: 0.00
-- invoice_status: Paid
-- payment_base: 200.00
-- gratuity: 30.00
-- total_payment: 230.00
