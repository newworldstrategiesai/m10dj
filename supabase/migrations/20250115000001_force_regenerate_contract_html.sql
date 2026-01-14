-- Force regenerate contract HTML for the specific contract
-- This will trigger the validate-token API to regenerate with event data from contract record

UPDATE contracts
SET contract_html = NULL,
    updated_at = NOW()
WHERE signing_token = '31bb1c9803482c90e37f4fbd6361b065edfc9705bc29e30836d46b7dad6e9505';

-- Verify the contract has event data stored
SELECT 
  id,
  contract_number,
  signing_token,
  event_name,
  event_type,
  event_date,
  venue_name,
  venue_address,
  guest_count,
  CASE 
    WHEN contract_html IS NULL THEN 'Will regenerate'
    ELSE 'Has HTML'
  END as html_status
FROM contracts
WHERE signing_token = '31bb1c9803482c90e37f4fbd6361b065edfc9705bc29e30836d46b7dad6e9505';
