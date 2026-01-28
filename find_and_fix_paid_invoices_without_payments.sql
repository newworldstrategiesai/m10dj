-- Find and Fix Invoices Marked as "Paid" Without Payment Records
-- This script identifies invoices that are marked as "Paid" but have no corresponding payment records

-- STEP 1: Find invoices marked as "Paid" but with no payment records
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
WHERE i.invoice_status = 'Paid'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, 
         i.balance_due, i.paid_date, i.contact_id, c.first_name, c.last_name, c.email_address
HAVING COUNT(p.id) = 0  -- No payment records
ORDER BY i.total_amount DESC, i.created_at DESC;  -- Show $0 invoices last

-- STEP 2: Review the results above, then run this to fix them
-- This will revert invoices marked as "Paid" but with no payment records back to "Sent" status
-- Adjust the WHERE clause to target specific invoices if needed

DO $$
DECLARE
  v_invoice RECORD;
  v_fixed_count INT := 0;
BEGIN
  -- Find all invoices marked as "Paid" but with no payment records
  FOR v_invoice IN 
    SELECT i.id, i.invoice_number, i.total_amount, i.amount_paid
    FROM invoices i
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
    WHERE i.invoice_status = 'Paid'
    GROUP BY i.id, i.invoice_number, i.total_amount, i.amount_paid
    HAVING COUNT(p.id) = 0
  LOOP
    -- Determine appropriate status based on amount_paid
    DECLARE
      v_new_status VARCHAR(50);
    BEGIN
      IF v_invoice.amount_paid > 0 AND v_invoice.amount_paid < v_invoice.total_amount THEN
        v_new_status := 'Partial';
      ELSIF v_invoice.amount_paid = 0 THEN
        v_new_status := 'Sent';
      ELSE
        v_new_status := 'Sent'; -- Default fallback
      END IF;

      -- Update invoice to revert status
      UPDATE invoices
      SET 
        invoice_status = v_new_status,
        amount_paid = 0,
        balance_due = total_amount,
        paid_date = NULL,
        updated_at = NOW()
      WHERE id = v_invoice.id;

      v_fixed_count := v_fixed_count + 1;
      
      RAISE NOTICE 'Fixed invoice %: Changed status from Paid to %, reset amount_paid to 0', 
        v_invoice.invoice_number, v_new_status;
    END;
  END LOOP;

  RAISE NOTICE 'Fixed % invoice(s) that were marked as Paid without payment records', v_fixed_count;
END $$;

-- STEP 3: Verify the fixes
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  COUNT(p.id) as payment_count
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.invoice_status = 'Paid'
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, i.balance_due
HAVING COUNT(p.id) = 0;

-- Expected: Should return 0 rows if all issues are fixed

-- STEP 4: Find invoices with mismatched amounts (status is Paid but balance_due > 0)
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  COALESCE(SUM(p.total_amount), 0) as payment_total,
  (i.total_amount - COALESCE(SUM(p.total_amount), 0)) as calculated_balance
FROM invoices i
LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
WHERE i.invoice_status = 'Paid'
  AND i.balance_due > 0  -- Should be 0 if fully paid
GROUP BY i.id, i.invoice_number, i.invoice_status, i.total_amount, i.amount_paid, i.balance_due
ORDER BY i.created_at DESC;

-- STEP 5: Fix mismatched amounts (optional - review first)
-- This updates invoices where balance_due should be 0 based on payment records
DO $$
DECLARE
  v_invoice RECORD;
  v_payment_total NUMERIC;
BEGIN
  FOR v_invoice IN 
    SELECT 
      i.id,
      i.invoice_number,
      i.total_amount,
      i.amount_paid,
      i.balance_due,
      COALESCE(SUM(p.total_amount), 0) as payment_total
    FROM invoices i
    LEFT JOIN payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
    WHERE i.invoice_status = 'Paid'
      AND i.balance_due > 0
    GROUP BY i.id, i.invoice_number, i.total_amount, i.amount_paid, i.balance_due
    HAVING COALESCE(SUM(p.total_amount), 0) >= i.total_amount
  LOOP
    -- Payment records show invoice is fully paid, update invoice to match
    UPDATE invoices
    SET 
      amount_paid = v_invoice.payment_total,
      balance_due = 0,
      updated_at = NOW()
    WHERE id = v_invoice.id;

    RAISE NOTICE 'Fixed invoice %: Updated amount_paid to %, balance_due to 0', 
      v_invoice.invoice_number, v_invoice.payment_total;
  END LOOP;
END $$;
