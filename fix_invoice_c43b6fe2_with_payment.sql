-- Fix Invoice: c43b6fe2-b130-429d-aa73-775fb50f19a8
-- Invoice was for $200, client paid $230 total ($200 base + $30 gratuity)
-- Need to: Update invoice to Paid, create payment record with correct amounts

-- STEP 1: Check current invoice status
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
  COALESCE(SUM(p.total_amount), 0) as payment_total
FROM invoices i
LEFT JOIN contacts c ON c.id = i.contact_id
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, 
         i.balance_due, i.paid_date, i.contact_id, c.first_name, c.last_name, c.email_address;

-- STEP 2: Check for existing payment records
SELECT 
  id,
  invoice_id,
  payment_name,
  total_amount,
  gratuity,
  payment_status,
  payment_method,
  transaction_date,
  created_at
FROM payments
WHERE invoice_id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
ORDER BY created_at DESC;

-- STEP 3: Update invoice to Paid status with correct amounts
UPDATE invoices
SET 
  invoice_status = 'Paid',
  amount_paid = 200.00,  -- Base invoice amount (excluding gratuity)
  balance_due = 0.00,
  paid_date = COALESCE(paid_date, NOW()),  -- Use existing paid_date if set, otherwise now
  updated_at = NOW()
WHERE id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8';

-- STEP 4: Create payment record if one doesn't exist
-- Check if payment record already exists
DO $$
DECLARE
  v_invoice_id UUID := 'c43b6fe2-b130-429d-aa73-775fb50f19a8';
  v_payment_exists BOOLEAN;
  v_contact_id UUID;
  v_organization_id UUID;
BEGIN
  -- Check if payment record exists
  SELECT EXISTS(
    SELECT 1 FROM payments 
    WHERE invoice_id = v_invoice_id 
    AND payment_status = 'Paid'
  ) INTO v_payment_exists;
  
  -- Get contact_id and organization_id from invoice
  SELECT contact_id, organization_id
  INTO v_contact_id, v_organization_id
  FROM invoices
  WHERE id = v_invoice_id;
  
  -- Create payment record if it doesn't exist
  IF NOT v_payment_exists AND v_contact_id IS NOT NULL THEN
    INSERT INTO payments (
      contact_id,
      invoice_id,
      payment_name,
      total_amount,  -- Base payment amount (excluding gratuity)
      gratuity,       -- Gratuity amount (separate)
      payment_status,
      payment_method,
      transaction_date,
      payment_notes,
      organization_id,
      created_at,
      updated_at
    ) VALUES (
      v_contact_id,
      v_invoice_id,
      'Invoice Payment',
      200.00,  -- Base payment (excluding gratuity)
      30.00,   -- Gratuity amount
      'Paid',
      'Credit Card',
      CURRENT_DATE,
      'Payment processed: $200 invoice + $30 gratuity = $230 total',
      v_organization_id,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Created payment record: $200 base + $30 gratuity = $230 total';
  ELSE
    IF v_payment_exists THEN
      RAISE NOTICE 'Payment record already exists, skipping insert';
    ELSE
      RAISE NOTICE 'Could not create payment record: contact_id is NULL';
    END IF;
  END IF;
END $$;

-- STEP 5: Verify the fix
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  i.paid_date,
  COUNT(p.id) as payment_count,
  COALESCE(SUM(p.total_amount), 0) as payment_base,
  COALESCE(SUM(p.gratuity), 0) as payment_gratuity,
  COALESCE(SUM(p.total_amount), 0) + COALESCE(SUM(p.gratuity), 0) as total_payment
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.id = 'c43b6fe2-b130-429d-aa73-775fb50f19a8'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, 
         i.balance_due, i.paid_date;

-- Expected Results:
-- invoice_status: 'Paid'
-- total_amount: 200.00 (or whatever the invoice total is)
-- amount_paid: 200.00 (base amount, excluding gratuity)
-- balance_due: 0.00
-- payment_count: 1
-- payment_base: 200.00
-- payment_gratuity: 30.00
-- total_payment: 230.00
