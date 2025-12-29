-- ============================================
-- FIX: Invoice & Quote Selection Sync System
-- 
-- This migration:
-- 1. Fixes the broken service_selection_id FK in contracts table
-- 2. Adds sync triggers between quote_selections and invoices
-- 3. Documents the data flow with comments
-- ============================================

-- ================================================
-- 1. FIX CONTRACTS TABLE FK REFERENCE
-- The contracts table references 'service_selections' but the table is 'quote_selections'
-- ================================================

-- First, check if the broken column exists and drop it
DO $$
BEGIN
  -- Drop the old broken FK constraint if it exists
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_service_selection_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE public.contracts DROP CONSTRAINT contracts_service_selection_id_fkey;
    RAISE NOTICE '✅ Dropped broken service_selection_id FK constraint';
  END IF;
END $$;

-- Add the correct FK to quote_selections if service_selection_id column exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'service_selection_id'
  ) THEN
    -- Rename the column to be more accurate
    ALTER TABLE public.contracts RENAME COLUMN service_selection_id TO quote_selection_id;
    RAISE NOTICE '✅ Renamed service_selection_id to quote_selection_id';
  END IF;
EXCEPTION
  WHEN duplicate_column THEN
    -- Column already renamed, that's fine
    RAISE NOTICE 'ℹ️ quote_selection_id column already exists';
END $$;

-- Add the correct FK constraint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'quote_selection_id'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_quote_selection_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE public.contracts 
    ADD CONSTRAINT contracts_quote_selection_id_fkey 
    FOREIGN KEY (quote_selection_id) REFERENCES public.quote_selections(id) ON DELETE SET NULL;
    RAISE NOTICE '✅ Added correct FK constraint to quote_selections';
  END IF;
END $$;

-- ================================================
-- 2. ADD SYNC TRIGGERS BETWEEN QUOTE_SELECTIONS AND INVOICES
-- When quote_selections changes, sync to linked invoices
-- ================================================

-- Function to sync quote_selections changes to invoices
CREATE OR REPLACE FUNCTION sync_quote_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_package_name TEXT;
  v_line_items JSONB;
BEGIN
  -- Only sync if there's a linked invoice
  IF NEW.invoice_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_invoice_id := NEW.invoice_id;

  -- Build line items from quote selection
  v_line_items := '[]'::JSONB;
  
  -- Add package as first line item
  IF NEW.package_name IS NOT NULL AND NEW.package_price IS NOT NULL THEN
    v_line_items := v_line_items || jsonb_build_array(
      jsonb_build_object(
        'description', NEW.package_name,
        'type', 'package',
        'quantity', 1,
        'rate', NEW.package_price,
        'amount', NEW.package_price
      )
    );
  END IF;

  -- Add add-ons as line items
  IF NEW.addons IS NOT NULL AND jsonb_array_length(NEW.addons) > 0 THEN
    v_line_items := v_line_items || (
      SELECT COALESCE(jsonb_agg(
        jsonb_build_object(
          'description', addon->>'name',
          'type', 'addon',
          'quantity', 1,
          'rate', (addon->>'price')::NUMERIC,
          'amount', (addon->>'price')::NUMERIC
        )
      ), '[]'::JSONB)
      FROM jsonb_array_elements(NEW.addons) AS addon
    );
  END IF;

  -- Update the linked invoice
  UPDATE public.invoices
  SET 
    subtotal = NEW.total_price,
    total_amount = NEW.total_price,
    balance_due = CASE 
      WHEN NEW.payment_status = 'paid' THEN 0
      WHEN NEW.payment_status = 'partial' THEN NEW.total_price - COALESCE(amount_paid, 0)
      ELSE NEW.total_price - COALESCE(amount_paid, 0)
    END,
    line_items = v_line_items,
    invoice_status = CASE
      WHEN NEW.payment_status = 'paid' THEN 'Paid'
      WHEN NEW.payment_status = 'partial' THEN 'Partial'
      WHEN NEW.status = 'confirmed' THEN 'Sent'
      WHEN NEW.status = 'invoiced' THEN 'Sent'
      ELSE invoice_status
    END,
    updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on quote_selections
DROP TRIGGER IF EXISTS trigger_sync_quote_to_invoice ON public.quote_selections;
CREATE TRIGGER trigger_sync_quote_to_invoice
  AFTER INSERT OR UPDATE ON public.quote_selections
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_to_invoice();

-- Function to sync invoice payments back to quote_selections
CREATE OR REPLACE FUNCTION sync_invoice_payment_to_quote()
RETURNS TRIGGER AS $$
BEGIN
  -- Find and update the linked quote_selection
  IF NEW.amount_paid IS DISTINCT FROM OLD.amount_paid OR 
     NEW.invoice_status IS DISTINCT FROM OLD.invoice_status THEN
    
    UPDATE public.quote_selections
    SET 
      payment_status = CASE
        WHEN NEW.invoice_status = 'Paid' OR NEW.balance_due <= 0 THEN 'paid'
        WHEN NEW.amount_paid > 0 THEN 'partial'
        ELSE payment_status
      END,
      status = CASE
        WHEN NEW.invoice_status = 'Paid' OR NEW.balance_due <= 0 THEN 'paid'
        WHEN NEW.invoice_status = 'Sent' AND status = 'pending' THEN 'invoiced'
        ELSE status
      END,
      paid_at = CASE
        WHEN (NEW.invoice_status = 'Paid' OR NEW.balance_due <= 0) AND paid_at IS NULL THEN NOW()
        ELSE paid_at
      END,
      updated_at = NOW()
    WHERE invoice_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on invoices
DROP TRIGGER IF EXISTS trigger_sync_invoice_payment_to_quote ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_payment_to_quote
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_payment_to_quote();

-- Function to sync contract signing to quote_selections
CREATE OR REPLACE FUNCTION sync_contract_signing_to_quote()
RETURNS TRIGGER AS $$
BEGIN
  -- When contract is signed, update quote_selection status
  IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
    UPDATE public.quote_selections
    SET 
      status = CASE 
        WHEN status = 'pending' THEN 'confirmed'
        ELSE status
      END,
      signature = NEW.client_signature_data,
      signed_at = NEW.signed_at,
      updated_at = NOW()
    WHERE contract_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on contracts
DROP TRIGGER IF EXISTS trigger_sync_contract_signing_to_quote ON public.contracts;
CREATE TRIGGER trigger_sync_contract_signing_to_quote
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_signing_to_quote();

-- ================================================
-- 3. ADD HELPER FUNCTION TO ENSURE DATA CONSISTENCY
-- ================================================

-- Function to manually sync a quote_selection to its invoice
CREATE OR REPLACE FUNCTION sync_quote_selection_to_invoice(p_quote_selection_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quote RECORD;
BEGIN
  SELECT * INTO v_quote FROM public.quote_selections WHERE id = p_quote_selection_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Quote selection not found: %', p_quote_selection_id;
  END IF;

  IF v_quote.invoice_id IS NULL THEN
    RAISE NOTICE 'No linked invoice for quote selection: %', p_quote_selection_id;
    RETURN FALSE;
  END IF;

  -- Trigger the sync by doing a dummy update
  UPDATE public.quote_selections
  SET updated_at = NOW()
  WHERE id = p_quote_selection_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to sync all quote_selections to their invoices
CREATE OR REPLACE FUNCTION sync_all_quotes_to_invoices()
RETURNS TABLE(quote_id UUID, invoice_id UUID, synced BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qs.id as quote_id,
    qs.invoice_id,
    sync_quote_selection_to_invoice(qs.id) as synced
  FROM public.quote_selections qs
  WHERE qs.invoice_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 4. DOCUMENTATION COMMENTS
-- ================================================

COMMENT ON TABLE public.quote_selections IS 
'SOURCE OF TRUTH for client service selections.

This is the primary table for the client-facing quote flow:
1. Client visits /quote/[id] → selects package & addons
2. Updates quote_selections with their choices
3. Triggers sync to linked invoices table

Flow:
  Contact Created → auto-creates quote_selections, invoices, contracts (all linked)
  Client Selects Services → updates quote_selections → syncs to invoices
  Client Signs Contract → updates contracts → syncs to quote_selections
  Client Makes Payment → updates invoices → syncs to quote_selections

Related tables:
  - invoices (formal invoice with line items for accounting)
  - contracts (service agreement)
  - payments (actual payment records)';

COMMENT ON TABLE public.invoices IS 
'Formal invoice records for accounting and PDF generation.

Synced FROM quote_selections via triggers when:
  - Package/add-ons change
  - Total price changes
  - Payment status changes

Used by:
  - Admin dashboard (/admin/invoices)
  - PDF invoice generation
  - Accounting reports

Note: quote_selections is the source of truth for pricing.
This table stores the formal invoice representation.';

COMMENT ON TABLE public.contracts IS 
'Service agreements and contracts.

Links to:
  - contact_id: The client
  - invoice_id: The related invoice
  - quote_selection_id: The service selection (corrected FK)

Status flow:
  draft → sent → viewed → signed → completed

When signed, triggers update to quote_selections.status';

COMMENT ON FUNCTION sync_quote_to_invoice() IS 
'Trigger function: Syncs quote_selections changes → invoices.
Updates line_items, totals, and status.';

COMMENT ON FUNCTION sync_invoice_payment_to_quote() IS 
'Trigger function: Syncs invoice payment changes → quote_selections.
Updates payment_status when invoice is paid.';

COMMENT ON FUNCTION sync_contract_signing_to_quote() IS 
'Trigger function: Syncs contract signing → quote_selections.
Updates status to confirmed when contract is signed.';

-- ================================================
-- 5. ADD INDEX FOR FASTER SYNC LOOKUPS
-- ================================================

CREATE INDEX IF NOT EXISTS idx_quote_selections_invoice_id 
  ON public.quote_selections(invoice_id) 
  WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_selections_contract_id 
  ON public.quote_selections(contract_id) 
  WHERE contract_id IS NOT NULL;

-- ================================================
-- 6. SYNC TRIGGER: Quote → Contract (Pricing/Details)
-- When quote_selections price changes, update linked contract
-- ================================================

CREATE OR REPLACE FUNCTION sync_quote_to_contract()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync if there's a linked contract
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Update the linked contract with current quote data
  UPDATE public.contracts
  SET 
    total_amount = NEW.total_price,
    deposit_amount = NEW.total_price * 0.5, -- 50% deposit
    updated_at = NOW()
  WHERE id = NEW.contract_id
    AND status IN ('draft', 'sent', 'viewed'); -- Don't update signed contracts
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on quote_selections for contract sync
DROP TRIGGER IF EXISTS trigger_sync_quote_to_contract ON public.quote_selections;
CREATE TRIGGER trigger_sync_quote_to_contract
  AFTER UPDATE OF total_price ON public.quote_selections
  FOR EACH ROW
  WHEN (OLD.total_price IS DISTINCT FROM NEW.total_price)
  EXECUTE FUNCTION sync_quote_to_contract();

-- ================================================
-- 7. FUNCTION TO PREVENT DUPLICATE CONTRACTS
-- ================================================

-- Function to check if contract already exists for a quote
CREATE OR REPLACE FUNCTION get_or_create_contract_for_quote(
  p_quote_id UUID,
  p_contact_id UUID,
  p_org_id UUID DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
  v_contract_id UUID;
  v_quote RECORD;
  v_contact RECORD;
  v_contract_number TEXT;
BEGIN
  -- Get quote data
  SELECT * INTO v_quote FROM public.quote_selections WHERE id = p_quote_id OR lead_id = p_quote_id LIMIT 1;
  
  -- Check if quote already has a contract
  IF v_quote.contract_id IS NOT NULL THEN
    -- Verify contract exists
    SELECT id INTO v_contract_id FROM public.contracts WHERE id = v_quote.contract_id;
    IF v_contract_id IS NOT NULL THEN
      RETURN v_contract_id;
    END IF;
  END IF;

  -- Check if there's already a contract for this contact
  SELECT id INTO v_contract_id 
  FROM public.contracts 
  WHERE contact_id = p_contact_id 
    AND status NOT IN ('cancelled', 'expired')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_contract_id IS NOT NULL THEN
    -- Link existing contract to quote if not linked
    IF v_quote.contract_id IS NULL THEN
      UPDATE public.quote_selections SET contract_id = v_contract_id WHERE id = v_quote.id;
    END IF;
    RETURN v_contract_id;
  END IF;

  -- Get contact data
  SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
  
  -- Generate contract number
  v_contract_number := 'CONT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
    LPAD((SELECT COALESCE(COUNT(*) + 1, 1) FROM public.contracts WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 3, '0');

  -- Create new contract
  INSERT INTO public.contracts (
    contact_id,
    quote_selection_id,
    organization_id,
    contract_number,
    contract_type,
    event_name,
    event_type,
    event_date,
    venue_name,
    venue_address,
    total_amount,
    deposit_amount,
    status
  ) VALUES (
    p_contact_id,
    v_quote.id,
    COALESCE(p_org_id, v_quote.organization_id, v_contact.organization_id),
    v_contract_number,
    'service_agreement',
    COALESCE(v_contact.event_type, 'Event') || ' - ' || COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, ''),
    v_contact.event_type,
    v_contact.event_date,
    v_contact.venue_name,
    v_contact.venue_address,
    COALESCE(v_quote.total_price, 0),
    COALESCE(v_quote.total_price, 0) * 0.5,
    'draft'
  )
  RETURNING id INTO v_contract_id;

  -- Link contract to quote
  UPDATE public.quote_selections SET contract_id = v_contract_id WHERE id = v_quote.id;

  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. FUNCTION TO SYNC EXISTING CONTRACTS
-- ================================================

CREATE OR REPLACE FUNCTION sync_quote_selection_to_contract(p_quote_selection_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quote RECORD;
BEGIN
  SELECT * INTO v_quote FROM public.quote_selections WHERE id = p_quote_selection_id;
  
  IF NOT FOUND OR v_quote.contract_id IS NULL THEN
    RETURN FALSE;
  END IF;

  -- Update contract with current quote data
  UPDATE public.contracts
  SET 
    total_amount = v_quote.total_price,
    deposit_amount = v_quote.total_price * 0.5,
    updated_at = NOW()
  WHERE id = v_quote.contract_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Function to sync all quotes to their contracts
CREATE OR REPLACE FUNCTION sync_all_quotes_to_contracts()
RETURNS TABLE(quote_id UUID, contract_id UUID, synced BOOLEAN) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    qs.id as quote_id,
    qs.contract_id,
    sync_quote_selection_to_contract(qs.id) as synced
  FROM public.quote_selections qs
  WHERE qs.contract_id IS NOT NULL;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 9. ADD INDEX FOR CONTRACT LOOKUPS
-- ================================================

CREATE INDEX IF NOT EXISTS idx_contracts_quote_selection_id 
  ON public.contracts(quote_selection_id) 
  WHERE quote_selection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_contact_status 
  ON public.contracts(contact_id, status);

-- ================================================
-- 10. UPDATE DOCUMENTATION
-- ================================================

COMMENT ON FUNCTION sync_quote_to_contract() IS 
'Trigger function: Syncs quote_selections.total_price → contracts.
Only updates draft/sent/viewed contracts (not signed ones).';

COMMENT ON FUNCTION get_or_create_contract_for_quote(UUID, UUID, UUID) IS 
'Gets existing contract or creates new one for a quote.
Prevents duplicate contracts by checking:
1. Quote already has contract_id
2. Contact already has a contract
Returns the contract ID.';

COMMENT ON FUNCTION sync_quote_selection_to_contract(UUID) IS 
'Manually sync a single quote_selection to its linked contract.';

COMMENT ON FUNCTION sync_all_quotes_to_contracts() IS 
'Sync all quote_selections to their linked contracts.';

-- ================================================
-- SUCCESS MESSAGE
-- ================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Invoice/Quote/Contract Sync System Fixed!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes made:';
  RAISE NOTICE '   1. Fixed contracts FK: service_selection_id → quote_selection_id';
  RAISE NOTICE '   2. Added sync trigger: quote_selections → invoices';
  RAISE NOTICE '   3. Added sync trigger: invoices → quote_selections (payments)';
  RAISE NOTICE '   4. Added sync trigger: contracts → quote_selections (signing)';
  RAISE NOTICE '   5. Added sync trigger: quote_selections → contracts (pricing)';
  RAISE NOTICE '   6. Added get_or_create_contract_for_quote() to prevent duplicates';
  RAISE NOTICE '   7. Added documentation comments on all tables';
  RAISE NOTICE '   8. Added helper functions for manual sync';
  RAISE NOTICE '';
  RAISE NOTICE '🔄 Data Flow:';
  RAISE NOTICE '   quote_selections (source of truth)';
  RAISE NOTICE '        ↓ (sync trigger)';
  RAISE NOTICE '   invoices (formal accounting)';
  RAISE NOTICE '        ↓ (sync trigger)';
  RAISE NOTICE '   contracts (service agreements)';
  RAISE NOTICE '';
  RAISE NOTICE '📝 To manually sync all quotes:';
  RAISE NOTICE '   SELECT * FROM sync_all_quotes_to_invoices();';
  RAISE NOTICE '   SELECT * FROM sync_all_quotes_to_contracts();';
  RAISE NOTICE '';
END $$;

