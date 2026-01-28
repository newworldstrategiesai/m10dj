-- Fix $0 invoices by temporarily disabling the trigger, then fixing both trigger and invoices
-- This ensures the trigger doesn't override our changes

-- STEP 1: Temporarily disable the trigger
DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON public.invoices;

-- STEP 2: Fix the trigger function to exclude $0 invoices
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- Auto-update status based on payment
  -- IMPORTANT: Don't auto-mark $0 invoices as "Paid" - they should be manually set or cancelled
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
  
  -- For $0 invoices: Don't auto-set status to "Paid" based on amount_paid >= total_amount
  -- Allow manual status changes but don't force "Paid" status
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 3: Fix the 5 invoices (trigger is disabled, so it won't override)
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

-- STEP 4: Re-create the trigger with the fixed function
CREATE TRIGGER trigger_calculate_invoice_balance
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- STEP 5: Verify the fix
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
-- The trigger is now fixed and won't auto-mark $0 invoices as "Paid" anymore
