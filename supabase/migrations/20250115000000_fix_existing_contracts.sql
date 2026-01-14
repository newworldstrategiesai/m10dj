-- Fix existing contracts by clearing contract_html to trigger regeneration
-- This will cause the validate-token API to regenerate contract HTML with proper event details

-- Option 1: Clear contract_html for a specific contract by signing_token
-- Replace the token below with the actual signing token
UPDATE contracts
SET contract_html = NULL,
    updated_at = NOW()
WHERE signing_token = '31bb1c9803482c90e37f4fbd6361b065edfc9705bc29e30836d46b7dad6e9505';

-- Option 2: Clear contract_html for all contracts that might have missing event details
-- This finds contracts that:
-- 1. Have contract_html but it contains empty event details ({{event_date}}, empty venue, etc.)
-- 2. Are linked to invoices that have project_id (meaning event data should be available)
UPDATE contracts
SET contract_html = NULL,
    updated_at = NOW()
WHERE id IN (
  SELECT c.id
  FROM contracts c
  INNER JOIN invoices i ON c.invoice_id = i.id
  WHERE i.project_id IS NOT NULL
    AND (
      -- Contract HTML is missing
      c.contract_html IS NULL
      OR c.contract_html = ''
      -- Or contract HTML has unprocessed template variables
      OR c.contract_html LIKE '%{{party_a_name}}%'
      OR c.contract_html LIKE '%{{party_b_name}}%'
      -- Or contract HTML has empty event details
      OR (c.contract_html LIKE '%Event Date:%</strong>%' AND c.contract_html NOT LIKE '%Event Date:%</strong>%Mon%')
      OR (c.contract_html LIKE '%Venue:%</strong>%' AND c.contract_html LIKE '%Venue:%</strong>%</p>%')
    )
);

-- Option 3: Clear contract_html for all contracts linked to invoices (to regenerate with proper data)
-- Use this if you want to regenerate ALL invoice-linked contracts
-- UPDATE contracts
-- SET contract_html = NULL,
--     updated_at = NOW()
-- WHERE invoice_id IS NOT NULL;

-- Verify the fix by checking the contract
SELECT 
  c.id,
  c.contract_number,
  c.signing_token,
  c.status,
  CASE 
    WHEN c.contract_html IS NULL THEN 'Will regenerate on next view'
    WHEN c.contract_html = '' THEN 'Will regenerate on next view'
    ELSE 'Has HTML (' || LENGTH(c.contract_html) || ' chars)'
  END as html_status,
  i.id as invoice_id,
  i.invoice_number,
  i.project_id as event_id,
  contact.first_name || ' ' || contact.last_name as contact_name,
  event.event_name,
  event.event_date,
  event.venue_name
FROM contracts c
LEFT JOIN invoices i ON c.invoice_id = i.id
LEFT JOIN contacts contact ON contact.id = c.contact_id
LEFT JOIN events event ON event.id = i.project_id
WHERE c.signing_token = '31bb1c9803482c90e37f4fbd6361b065edfc9705bc29e30836d46b7dad6e9505';
