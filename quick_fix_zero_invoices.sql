-- Quick Fix: Update 5 invoices from "Paid" to "Cancelled"
-- These invoices have $0.00 total and no payment records
-- 
-- IMPORTANT: First fix the trigger that's auto-marking $0 invoices as "Paid"
-- Run fix_zero_invoice_trigger_and_invoices.sql instead for complete fix

-- Step 1: Fix the trigger function (prevents future $0 invoices from being auto-marked as Paid)
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- Don't auto-mark $0 invoices as "Paid"
  IF NEW.total_amount > 0 AND NEW.amount_paid >= NEW.total_amount THEN
    NEW.invoice_status = 'Paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date = NOW();
    END IF;
  ELSIF NEW.amount_paid > 0 AND NEW.amount_paid < NEW.total_amount THEN
    IF NEW.invoice_status = 'Draft' THEN
      NEW.invoice_status = 'Partial';
    END IF;
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.invoice_status NOT IN ('Paid', 'Cancelled', 'Draft') THEN
    NEW.invoice_status = 'Overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 2: Fix the invoices (now the trigger won't override us)
UPDATE invoices
SET 
  invoice_status = 'Cancelled',
  amount_paid = 0,
  balance_due = 0,
  paid_date = NULL,
  updated_at = NOW()
WHERE invoice_number IN (
  'INV-202512-002',
  'INV-202601-023',
  'INV-202601-026',
  'INV-202601-035',
  'INV-202601-038'
)
AND invoice_status = 'Paid'
AND total_amount = 0;

-- Verify the fix
SELECT 
  invoice_number,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due,
  paid_date
FROM invoices
WHERE invoice_number IN (
  'INV-202512-002',
  'INV-202601-023',
  'INV-202601-026',
  'INV-202601-035',
  'INV-202601-038'
)
ORDER BY invoice_number;

-- Expected result: All should show invoice_status = 'Cancelled'
