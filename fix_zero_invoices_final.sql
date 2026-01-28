-- FINAL FIX: Disable trigger, update invoices, fix trigger function, re-enable trigger
-- This ensures $0 invoices stay as "Cancelled" and don't get auto-marked as "Paid"

-- STEP 1: Check current trigger status
SELECT 
  trigger_name, 
  event_manipulation, 
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'invoices'
AND trigger_name LIKE '%balance%';

-- STEP 2: Drop ALL triggers that might interfere
DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON public.invoices;

-- STEP 3: Fix the trigger function FIRST (before recreating trigger)
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- CRITICAL FIX: For $0 invoices, preserve the status that's explicitly set
  -- Don't auto-change status for $0 invoices
  IF NEW.total_amount = 0 THEN
    -- For $0 invoices: Only calculate balance_due, preserve status
    -- If status is explicitly set to "Cancelled", keep it
    -- If status is "Paid", don't auto-set paid_date
    IF NEW.invoice_status = 'Cancelled' THEN
      -- Explicitly set to Cancelled - preserve it
      NEW.invoice_status = 'Cancelled';
      NEW.paid_date = NULL;
    END IF;
    -- Don't auto-set status to "Paid" for $0 invoices
    RETURN NEW;
  END IF;
  
  -- For non-zero invoices: Auto-update status based on payment
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.invoice_status = 'Paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date = NOW();
    END IF;
  ELSIF NEW.amount_paid > 0 AND NEW.amount_paid < NEW.total_amount THEN
    -- Partial payment - only change from Draft to Partial
    IF NEW.invoice_status = 'Draft' THEN
      NEW.invoice_status = 'Partial';
    END IF;
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.invoice_status NOT IN ('Paid', 'Cancelled', 'Draft') THEN
    NEW.invoice_status = 'Overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 4: Update the invoices (trigger is disabled, so this will stick)
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
AND total_amount = 0;

-- STEP 5: Verify invoices are updated BEFORE recreating trigger
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

-- STEP 6: Recreate the trigger with the fixed function
CREATE TRIGGER trigger_calculate_invoice_balance
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- STEP 7: Final verification - try updating one invoice to make sure trigger works correctly
-- This should NOT change the status back to "Paid"
UPDATE invoices
SET updated_at = NOW()
WHERE invoice_number = 'INV-202512-002';

-- STEP 8: Final check
SELECT 
  invoice_number,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due
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
-- The trigger is now fixed and won't auto-mark $0 invoices as "Paid"
