-- IMMEDIATE FIX: Add quote_based to contract type constraint
-- Run this SQL directly in your database to fix the constraint violation error

-- Drop existing constraint
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;

-- Recreate constraint with quote_based included
ALTER TABLE public.contracts ADD CONSTRAINT contracts_contract_type_check
  CHECK (contract_type IN (
    'service_agreement',
    'addendum',
    'amendment',
    'cancellation',
    'nda',
    'personal_agreement',
    'vendor_agreement',
    'partnership',
    'general',
    'quote_based'  -- This allows quote-based contracts
  ));

-- Verify the constraint was updated
SELECT conname, conrelid::regclass, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conname = 'contracts_contract_type_check';