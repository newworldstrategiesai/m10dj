-- FORCE FIX: Direct update using invoice IDs, bypassing any potential issues
-- This uses the invoice IDs directly and forces the status change

-- Update using invoice IDs (more reliable than invoice_number)
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

-- Verify
SELECT 
  id,
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
