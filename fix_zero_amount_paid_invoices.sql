-- Fix Invoices Marked as "Paid" with $0.00 Total and No Payment Records
-- These invoices should likely be "Cancelled" or "Draft" status, not "Paid"

-- STEP 1: Review the problematic invoices
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  i.paid_date,
  i.invoice_title,
  i.contact_id,
  c.first_name || ' ' || c.last_name as contact_name,
  c.email_address,
  COUNT(p.id) as payment_count,
  COALESCE(SUM(p.total_amount), 0) as payment_total,
  i.created_at,
  i.updated_at
FROM invoices i
LEFT JOIN contacts c ON c.id = i.contact_id
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.id IN (
  '731c66bd-c776-45f8-a613-8fcfe98c38da',
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',
  'f32ec02b-cf90-41ff-beea-929e2547a5d0',
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39'
)
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, 
         i.balance_due, i.paid_date, i.invoice_title, i.contact_id, c.first_name, 
         c.last_name, c.email_address, i.created_at, i.updated_at
ORDER BY i.created_at DESC;

-- STEP 2: Check if these invoices have any payment records at all (even pending)
SELECT 
  p.id,
  p.invoice_id,
  i.invoice_number,
  p.payment_name,
  p.total_amount,
  p.payment_status,
  p.payment_method,
  p.transaction_date,
  p.created_at
FROM payments p
JOIN invoices i ON i.id = p.invoice_id
WHERE p.invoice_id IN (
  '731c66bd-c776-45f8-a613-8fcfe98c38da',
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',
  'f32ec02b-cf90-41ff-beea-929e2547a5d0',
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39'
)
ORDER BY p.created_at DESC;

-- STEP 3: Fix these invoices
-- Since they have $0.00 total and no payment records, they should be "Cancelled" or "Draft"
-- We'll set them to "Cancelled" as they appear to be invalid/void invoices
DO $$
DECLARE
  v_invoice_id UUID;
  v_invoice_number VARCHAR;
  v_fixed_count INT := 0;
  v_invoice_ids UUID[] := ARRAY[
    '731c66bd-c776-45f8-a613-8fcfe98c38da',
    '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
    '1468c1c1-a56e-4602-8bc3-68826edccdf9',
    'f32ec02b-cf90-41ff-beea-929e2547a5d0',
    '783aedf0-30e4-4912-95bf-c53fb6ad1c39'
  ];
BEGIN
  FOREACH v_invoice_id IN ARRAY v_invoice_ids
  LOOP
    -- Get invoice number for logging
    SELECT invoice_number INTO v_invoice_number
    FROM invoices
    WHERE id = v_invoice_id;
    
    -- Check if invoice has any payment records
    DECLARE
      v_payment_count INT;
    BEGIN
      SELECT COUNT(*) INTO v_payment_count
      FROM payments
      WHERE invoice_id = v_invoice_id
        AND payment_status = 'Paid';
      
      -- Only fix if no payment records exist
      IF v_payment_count = 0 THEN
        -- Update invoice to "Cancelled" status since it's $0 and has no payments
        -- This is likely a voided/free invoice that shouldn't be marked as "Paid"
        UPDATE invoices
        SET 
          invoice_status = 'Cancelled',
          amount_paid = 0,
          balance_due = 0,
          paid_date = NULL,
          updated_at = NOW()
        WHERE id = v_invoice_id;
        
        -- Note: cancelled_date column may not exist in all database versions
        -- If you want to set it, uncomment the following after verifying the column exists:
        -- UPDATE invoices SET cancelled_date = NOW() WHERE id = v_invoice_id;
        
        v_fixed_count := v_fixed_count + 1;
        
        RAISE NOTICE 'Fixed invoice % (%): Changed status from Paid to Cancelled (no payment records, $0 total)', 
          v_invoice_number, v_invoice_id;
      ELSE
        RAISE NOTICE 'Skipped invoice % (%): Has % payment record(s)', 
          v_invoice_number, v_invoice_id, v_payment_count;
      END IF;
    END;
  END LOOP;

  RAISE NOTICE 'Fixed % invoice(s) that were marked as Paid with $0 total and no payment records', v_fixed_count;
END $$;

-- STEP 4: Verify the fixes
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
WHERE i.id IN (
  '731c66bd-c776-45f8-a613-8fcfe98c38da',
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',
  'f32ec02b-cf90-41ff-beea-929e2547a5d0',
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39'
)
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, i.balance_due
ORDER BY i.invoice_number;

-- Expected Results:
-- All invoices should now have:
--   invoice_status: 'Cancelled'
--   amount_paid: 0.00
--   balance_due: 0.00
--   payment_count: 0

-- Alternative: If you prefer "Draft" instead of "Cancelled", change line 67 to:
--   invoice_status = 'Draft',
-- And remove the cancelled_date line
