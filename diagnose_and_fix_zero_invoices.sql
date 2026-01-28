-- Diagnostic and Fix Script for $0 Invoices Stuck as "Paid"
-- This will identify the issue and fix it

-- STEP 1: Check ALL triggers on invoices table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement,
  action_orientation
FROM information_schema.triggers
WHERE event_object_table = 'invoices'
ORDER BY trigger_name;

-- STEP 2: Check the current trigger function definition
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'calculate_invoice_balance';

-- STEP 3: Check current invoice status
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

-- STEP 4: Drop the trigger completely
DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON public.invoices;

-- STEP 5: Create a NEW fixed trigger function
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- CRITICAL: Only auto-set status to "Paid" if total_amount > 0
  -- For $0 invoices, preserve whatever status is explicitly set
  IF NEW.total_amount > 0 THEN
    -- Only for non-zero invoices
    IF NEW.amount_paid >= NEW.total_amount THEN
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
  ELSE
    -- For $0 invoices: Don't auto-change status
    -- Only calculate balance_due, preserve status
    -- Exception: If explicitly setting to "Paid", allow it but don't auto-set paid_date
    IF NEW.invoice_status = 'Paid' AND NEW.paid_date IS NULL THEN
      -- Don't auto-set paid_date for $0 invoices
      NULL;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Update invoices with explicit status override
-- Use a direct UPDATE that sets status BEFORE trigger runs
UPDATE invoices
SET 
  invoice_status = 'Cancelled',
  amount_paid = 0::NUMERIC,
  balance_due = 0::NUMERIC,
  paid_date = NULL,
  updated_at = NOW()
WHERE invoice_number IN (
  'INV-202512-002',
  'INV-202601-023',
  'INV-202601-026',
  'INV-202601-035',
  'INV-202601-038'
)
AND total_amount = 0::NUMERIC;

-- STEP 7: Verify the update worked (before recreating trigger)
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

-- STEP 8: Recreate trigger with fixed function
CREATE TRIGGER trigger_calculate_invoice_balance
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- STEP 9: Test that trigger doesn't override - update one invoice
UPDATE invoices
SET updated_at = NOW()
WHERE invoice_number = 'INV-202512-002';

-- STEP 10: Final verification
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

-- If invoices are STILL showing as "Paid" after STEP 7, there's another process interfering
-- Check for:
-- 1. Other triggers (see STEP 1 results)
-- 2. RLS policies that might be filtering
-- 3. Application code that's updating these invoices
-- 4. Database views that might be showing cached data
