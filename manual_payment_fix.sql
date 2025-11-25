-- Manual Payment Fix for Lead: c082f6bd-d63c-4c23-992d-caa68c299017
-- Payment Intent: pi_3SXDFXEJct0cvYrG13wMabsI
-- Amount: $1,075.00 (Deposit)
-- Date: November 25, 2025

-- Step 1: Find the contact_id from the lead_id
-- The lead_id in quote_selections is typically a contacts.id directly
-- This query will show you if the lead_id exists as a contact
SELECT 
  qs.lead_id,
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email_address,
  CASE 
    WHEN c.id IS NOT NULL THEN 'lead_id is a contact_id'
    ELSE 'lead_id is NOT a contact_id - may need manual lookup'
  END as status
FROM quote_selections qs
LEFT JOIN contacts c ON c.id = qs.lead_id
WHERE qs.lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- Step 2: Insert the payment record
-- This uses the lead_id directly as contact_id (most common case)
-- If Step 1 shows the lead_id is a contact_id, use this:
INSERT INTO payments (
  contact_id,
  payment_name,
  total_amount,
  payment_status,
  payment_method,
  transaction_date,
  payment_notes,
  created_at,
  updated_at
)
SELECT 
  'c082f6bd-d63c-4c23-992d-caa68c299017'::uuid as contact_id,
  'Deposit' as payment_name,
  1075.00 as total_amount,
  'Paid' as payment_status,
  'Credit Card' as payment_method,
  '2025-11-25'::date as transaction_date,
  'Stripe Payment Intent: pi_3SXDFXEJct0cvYrG13wMabsI' as payment_notes,
  NOW() as created_at,
  NOW() as updated_at
WHERE NOT EXISTS (
  SELECT 1 FROM payments 
  WHERE payment_notes LIKE '%pi_3SXDFXEJct0cvYrG13wMabsI%'
);

-- ALTERNATIVE: If Step 1 shows lead_id is NOT a contact_id, 
-- you need to find the actual contact_id first, then run:
-- INSERT INTO payments (contact_id, payment_name, total_amount, payment_status, payment_method, transaction_date, payment_notes, created_at, updated_at)
-- VALUES ('ACTUAL_CONTACT_ID_HERE', 'Deposit', 1075.00, 'Paid', 'Credit Card', '2025-11-25', 'Stripe Payment Intent: pi_3SXDFXEJct0cvYrG13wMabsI', NOW(), NOW());

-- Step 3: Update quote_selections with payment status
-- Note: payment_status can only be: 'pending', 'partial', 'paid', 'refunded'
-- Since this is a deposit, we'll use 'partial' (not fully paid yet)
UPDATE quote_selections
SET 
  payment_status = 'partial',
  payment_intent_id = 'pi_3SXDFXEJct0cvYrG13wMabsI',
  deposit_amount = 1075.00,
  paid_at = NOW(),
  updated_at = NOW()
WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- Step 4: Verify the payment was created
SELECT 
  p.id,
  p.contact_id,
  p.payment_name,
  p.total_amount,
  p.payment_status,
  p.transaction_date,
  p.payment_notes,
  c.first_name,
  c.last_name,
  c.email_address
FROM payments p
LEFT JOIN contacts c ON p.contact_id = c.id
WHERE p.payment_notes LIKE '%pi_3SXDFXEJct0cvYrG13wMabsI%'
ORDER BY p.created_at DESC
LIMIT 1;

-- Step 5: Verify quote_selections was updated
SELECT 
  lead_id,
  payment_status,
  payment_intent_id,
  deposit_amount,
  paid_at
FROM quote_selections
WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

