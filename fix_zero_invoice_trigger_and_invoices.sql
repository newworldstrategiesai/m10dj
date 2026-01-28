-- Fix the trigger that's auto-marking $0 invoices as "Paid"
-- Then fix the 5 problematic invoices

-- STEP 1: Fix the trigger function to exclude $0 invoices
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- Auto-update status based on payment
  -- BUT: Don't auto-mark $0 invoices as "Paid" - they should be manually set or cancelled
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
  
  -- Special handling for $0 invoices: Don't auto-set to "Paid"
  -- If someone explicitly sets status to "Paid" on a $0 invoice, allow it
  -- But don't auto-set it based on amount_paid >= total_amount when both are 0
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 2: Now fix the 5 invoices (the trigger won't override us anymore)
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

-- STEP 3: Verify the fix
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

-- Expected result: All should show invoice_status = 'Cancelled' and paid_date = NULL
