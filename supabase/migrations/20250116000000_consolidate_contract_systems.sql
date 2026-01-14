-- Consolidate Contract Systems
-- Unify quote-based and standalone contracts into a single system with contract_type differentiation

-- ================================================
-- IMMEDIATE FIX - Allow quote_based in constraint
-- ================================================
DO $$
BEGIN
  -- Drop existing constraint and recreate with quote_based added
  ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;
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
      'quote_based'  -- ADD THIS TO FIX THE IMMEDIATE ERROR
    ));
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not update constraint: %', SQLERRM;
END $$;

-- Add contract_type field to contracts table
ALTER TABLE public.contracts ADD COLUMN IF NOT EXISTS contract_type TEXT DEFAULT 'service_agreement';

-- Update existing contracts to have appropriate types
-- Quote-based contracts (have quote_selection_id) - ADD quote_based TYPE
UPDATE public.contracts
SET contract_type = 'quote_based'
WHERE quote_selection_id IS NOT NULL
  AND (contract_type IS NULL OR contract_type = '');

-- Keep existing contract types as-is for contracts that already have them
-- Default remaining contracts to service_agreement
UPDATE public.contracts
SET contract_type = 'service_agreement'
WHERE contract_type IS NULL OR contract_type = '';

-- Make quote_selection_id nullable for standalone contracts
ALTER TABLE public.contracts ALTER COLUMN quote_selection_id DROP NOT NULL;

-- Update constraint to include all valid contract types (combining with existing migration)
-- First, temporarily allow quote_based in the existing constraint
ALTER TABLE public.contracts DROP CONSTRAINT IF EXISTS contracts_contract_type_check;
ALTER TABLE public.contracts ADD CONSTRAINT contracts_contract_type_check
  CHECK (contract_type IN (
    'service_agreement',    -- DJ service contracts
    'addendum',             -- Modifications to existing contracts
    'amendment',            -- Contract amendments
    'cancellation',         -- Cancellation agreements
    'nda',                  -- Non-disclosure agreements
    'personal_agreement',   -- Personal/romantic confidentiality
    'vendor_agreement',     -- Vendor/subcontractor agreements
    'partnership',          -- Partnership agreements
    'general',              -- General purpose contracts
    'quote_based'           -- Contracts tied to quotes/selections (ADDED)
  ));

-- Create index for contract type queries
CREATE INDEX IF NOT EXISTS idx_contracts_type ON public.contracts(contract_type);

-- Update contract summary view to include contract_type
DROP VIEW IF EXISTS public.contract_summary;
CREATE OR REPLACE VIEW public.contract_summary AS
SELECT
    co.id,
    co.contract_number,
    co.contract_type,
    co.status,
    co.event_name,
    co.event_date,
    co.total_amount,
    co.signed_at,
    co.signed_by_client,
    co.signed_by_client_email,
    co.recipient_name,
    co.recipient_email,
    co.created_at,
    -- Include contact info for contracts with contacts, otherwise use recipient info
    CASE
        WHEN co.contact_id IS NOT NULL THEN con.first_name || ' ' || con.last_name
        ELSE co.recipient_name
    END as client_name,
    CASE
        WHEN co.contact_id IS NOT NULL THEN con.email_address
        ELSE co.recipient_email
    END as client_email
FROM public.contracts co
LEFT JOIN public.contacts con ON co.contact_id = con.id
ORDER BY co.created_at DESC;

-- Grant permissions
GRANT SELECT ON public.contract_summary TO authenticated;
GRANT SELECT ON public.contract_summary TO service_role;

-- Update comments
COMMENT ON COLUMN public.contracts.contract_type IS 'Type of contract: quote_based (tied to quotes), standalone_nda, standalone_personal, service_agreement';
COMMENT ON VIEW public.contract_summary IS 'Complete contract overview with client information, supporting both quote-based and standalone contracts';

-- Log the migration results
DO $$
DECLARE
    quote_count INTEGER;
    nda_count INTEGER;
    personal_count INTEGER;
    service_count INTEGER;
    other_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO quote_count FROM public.contracts WHERE contract_type = 'quote_based';
    SELECT COUNT(*) INTO nda_count FROM public.contracts WHERE contract_type = 'nda';
    SELECT COUNT(*) INTO personal_count FROM public.contracts WHERE contract_type = 'personal_agreement';
    SELECT COUNT(*) INTO service_count FROM public.contracts WHERE contract_type = 'service_agreement';
    SELECT COUNT(*) INTO other_count FROM public.contracts WHERE contract_type NOT IN ('quote_based', 'nda', 'personal_agreement', 'service_agreement');

    RAISE NOTICE 'Contract consolidation completed:';
    RAISE NOTICE '  - Quote-based contracts: %', quote_count;
    RAISE NOTICE '  - NDA contracts: %', nda_count;
    RAISE NOTICE '  - Personal agreement contracts: %', personal_count;
    RAISE NOTICE '  - Service agreement contracts: %', service_count;
    RAISE NOTICE '  - Other contract types: %', other_count;
    RAISE NOTICE '  - Total contracts: %', (quote_count + nda_count + personal_count + service_count + other_count);
END $$;