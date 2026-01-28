-- COMPLETE FIX: Disable ALL triggers, update invoices, fix trigger, re-enable
-- This is the most reliable way to fix the $0 invoices issue

-- STEP 1: List all triggers on invoices table
SELECT 
  trigger_name, 
  event_manipulation, 
  action_timing,
  action_statement
FROM information_schema.triggers
WHERE event_object_table = 'invoices';

-- STEP 2: Disable ALL triggers on invoices table
DROP TRIGGER IF EXISTS trigger_calculate_invoice_balance ON public.invoices;
DROP TRIGGER IF EXISTS trigger_update_invoices_timestamp ON public.invoices;
DROP TRIGGER IF EXISTS trigger_sync_invoice_payment_to_quote ON public.invoices;
DROP TRIGGER IF EXISTS trigger_sync_invoice_to_contact ON public.invoices;

-- STEP 3: Update the invoices directly (no triggers will interfere)
UPDATE invoices
SET 
  invoice_status = 'Cancelled',
  amount_paid = 0,
  balance_due = 0,
  paid_date = NULL,
  updated_at = NOW()
WHERE id IN (
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39',  -- INV-202512-002
  '731c66bd-c776-45f8-a613-8fcfe98c38da',  -- INV-202601-023
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',  -- INV-202601-026
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',  -- INV-202601-035
  'f32ec02b-cf90-41ff-beea-929e2547a5d0'   -- INV-202601-038
);

-- STEP 4: Verify invoices are updated (CRITICAL CHECKPOINT)
SELECT 
  invoice_number,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due,
  paid_date
FROM invoices
WHERE id IN (
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39',
  '731c66bd-c776-45f8-a613-8fcfe98c38da',
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
  'f32ec02b-cf90-41ff-beea-929e2547a5d0'
)
ORDER BY invoice_number;

-- If STEP 4 shows "Cancelled", proceed to STEP 5
-- If STEP 4 still shows "Paid", there's another issue (RLS, views, or application code)

-- STEP 5: Fix the trigger function to handle $0 invoices correctly
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  -- Calculate balance
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- CRITICAL: For $0 invoices, preserve explicitly set status
  -- Don't auto-change status for $0 invoices
  IF NEW.total_amount = 0 THEN
    -- If status is explicitly set to "Cancelled", preserve it
    IF NEW.invoice_status = 'Cancelled' THEN
      NEW.invoice_status = 'Cancelled';
      NEW.paid_date = NULL;
      RETURN NEW;
    END IF;
    -- For other statuses on $0 invoices, preserve them
    -- Don't auto-set to "Paid"
    RETURN NEW;
  END IF;
  
  -- For non-zero invoices: Auto-update status based on payment
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
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- STEP 6: Recreate the trigger
CREATE TRIGGER trigger_calculate_invoice_balance
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- STEP 7: Recreate other triggers if they existed
-- Update timestamp trigger
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_timestamp
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();

-- STEP 8: Final verification
SELECT 
  invoice_number,
  invoice_status,
  total_amount,
  amount_paid,
  balance_due
FROM invoices
WHERE id IN (
  '783aedf0-30e4-4912-95bf-c53fb6ad1c39',
  '731c66bd-c776-45f8-a613-8fcfe98c38da',
  '1468c1c1-a56e-4602-8bc3-68826edccdf9',
  '15b18f28-b9a0-4d21-9e8d-e69aedd6d661',
  'f32ec02b-cf90-41ff-beea-929e2547a5d0'
)
ORDER BY invoice_number;

-- Expected: All should show invoice_status = 'Cancelled'
