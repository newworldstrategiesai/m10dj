-- ============================================
-- QUICK FIX: Invoice & Quote Selection Sync
-- Run this in Supabase SQL Editor
-- ============================================

-- ================================================
-- 1. FIX CONTRACTS TABLE FK REFERENCE
-- ================================================

-- Drop the old broken FK constraint if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'contracts_service_selection_id_fkey' 
    AND table_name = 'contracts'
  ) THEN
    ALTER TABLE public.contracts DROP CONSTRAINT contracts_service_selection_id_fkey;
    RAISE NOTICE '✅ Dropped broken service_selection_id FK constraint';
  END IF;
END $$;

-- Rename service_selection_id to quote_selection_id
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'contracts' AND column_name = 'service_selection_id'
  ) THEN
    ALTER TABLE public.contracts RENAME COLUMN service_selection_id TO quote_selection_id;
    RAISE NOTICE '✅ Renamed service_selection_id to quote_selection_id';
  END IF;
EXCEPTION
  WHEN duplicate_column THEN
    RAISE NOTICE 'ℹ️ quote_selection_id column already exists';
END $$;

-- Add correct FK constraint
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
-- 2. SYNC TRIGGER: Quote → Invoice
-- ================================================

CREATE OR REPLACE FUNCTION sync_quote_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_line_items JSONB;
BEGIN
  IF NEW.invoice_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_invoice_id := NEW.invoice_id;
  v_line_items := '[]'::JSONB;
  
  -- Add package
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

  -- Add add-ons
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

  -- Update invoice
  UPDATE public.invoices
  SET 
    subtotal = NEW.total_price,
    total_amount = NEW.total_price,
    balance_due = CASE 
      WHEN NEW.payment_status = 'paid' THEN 0
      ELSE NEW.total_price - COALESCE(amount_paid, 0)
    END,
    line_items = v_line_items,
    invoice_status = CASE
      WHEN NEW.payment_status = 'paid' THEN 'Paid'
      WHEN NEW.payment_status = 'partial' THEN 'Partial'
      WHEN NEW.status = 'confirmed' THEN 'Sent'
      ELSE invoice_status
    END,
    updated_at = NOW()
  WHERE id = v_invoice_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_quote_to_invoice ON public.quote_selections;
CREATE TRIGGER trigger_sync_quote_to_invoice
  AFTER INSERT OR UPDATE ON public.quote_selections
  FOR EACH ROW
  EXECUTE FUNCTION sync_quote_to_invoice();

-- ================================================
-- 3. SYNC TRIGGER: Invoice Payment → Quote
-- ================================================

CREATE OR REPLACE FUNCTION sync_invoice_payment_to_quote()
RETURNS TRIGGER AS $$
BEGIN
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

DROP TRIGGER IF EXISTS trigger_sync_invoice_payment_to_quote ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_payment_to_quote
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_payment_to_quote();

-- ================================================
-- 4. SYNC TRIGGER: Contract Signing → Quote
-- ================================================

CREATE OR REPLACE FUNCTION sync_contract_signing_to_quote()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'signed' AND OLD.status != 'signed' THEN
    UPDATE public.quote_selections
    SET 
      status = CASE WHEN status = 'pending' THEN 'confirmed' ELSE status END,
      signature = NEW.client_signature_data,
      signed_at = NEW.signed_at,
      updated_at = NOW()
    WHERE contract_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contract_signing_to_quote ON public.contracts;
CREATE TRIGGER trigger_sync_contract_signing_to_quote
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_signing_to_quote();

-- ================================================
-- 5. HELPER FUNCTIONS
-- ================================================

CREATE OR REPLACE FUNCTION sync_quote_selection_to_invoice(p_quote_selection_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_quote RECORD;
BEGIN
  SELECT * INTO v_quote FROM public.quote_selections WHERE id = p_quote_selection_id;
  
  IF NOT FOUND OR v_quote.invoice_id IS NULL THEN
    RETURN FALSE;
  END IF;

  UPDATE public.quote_selections SET updated_at = NOW() WHERE id = p_quote_selection_id;
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

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
-- 6. ADD INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_quote_selections_invoice_id 
  ON public.quote_selections(invoice_id) WHERE invoice_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_quote_selections_contract_id 
  ON public.quote_selections(contract_id) WHERE contract_id IS NOT NULL;

-- ================================================
-- 6. SYNC TRIGGER: Quote → Contract
-- ================================================

CREATE OR REPLACE FUNCTION sync_quote_to_contract()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contract_id IS NULL THEN
    RETURN NEW;
  END IF;

  UPDATE public.contracts
  SET 
    total_amount = NEW.total_price,
    deposit_amount = NEW.total_price * 0.5,
    updated_at = NOW()
  WHERE id = NEW.contract_id
    AND status IN ('draft', 'sent', 'viewed');
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_quote_to_contract ON public.quote_selections;
CREATE TRIGGER trigger_sync_quote_to_contract
  AFTER UPDATE OF total_price ON public.quote_selections
  FOR EACH ROW
  WHEN (OLD.total_price IS DISTINCT FROM NEW.total_price)
  EXECUTE FUNCTION sync_quote_to_contract();

-- ================================================
-- 7. PREVENT DUPLICATE CONTRACTS
-- ================================================

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
  SELECT * INTO v_quote FROM public.quote_selections WHERE id = p_quote_id OR lead_id = p_quote_id LIMIT 1;
  
  IF v_quote.contract_id IS NOT NULL THEN
    SELECT id INTO v_contract_id FROM public.contracts WHERE id = v_quote.contract_id;
    IF v_contract_id IS NOT NULL THEN
      RETURN v_contract_id;
    END IF;
  END IF;

  SELECT id INTO v_contract_id 
  FROM public.contracts 
  WHERE contact_id = p_contact_id 
    AND status NOT IN ('cancelled', 'expired')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF v_contract_id IS NOT NULL THEN
    IF v_quote.contract_id IS NULL THEN
      UPDATE public.quote_selections SET contract_id = v_contract_id WHERE id = v_quote.id;
    END IF;
    RETURN v_contract_id;
  END IF;

  SELECT * INTO v_contact FROM public.contacts WHERE id = p_contact_id;
  
  v_contract_number := 'CONT-' || TO_CHAR(CURRENT_DATE, 'YYYYMMDD') || '-' || 
    LPAD((SELECT COALESCE(COUNT(*) + 1, 1) FROM public.contracts WHERE DATE(created_at) = CURRENT_DATE)::TEXT, 3, '0');

  INSERT INTO public.contracts (
    contact_id, quote_selection_id, organization_id, contract_number, contract_type,
    event_name, event_type, event_date, venue_name, venue_address,
    total_amount, deposit_amount, status
  ) VALUES (
    p_contact_id, v_quote.id,
    COALESCE(p_org_id, v_quote.organization_id, v_contact.organization_id),
    v_contract_number, 'service_agreement',
    COALESCE(v_contact.event_type, 'Event') || ' - ' || COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, ''),
    v_contact.event_type, v_contact.event_date, v_contact.venue_name, v_contact.venue_address,
    COALESCE(v_quote.total_price, 0), COALESCE(v_quote.total_price, 0) * 0.5, 'draft'
  )
  RETURNING id INTO v_contract_id;

  UPDATE public.quote_selections SET contract_id = v_contract_id WHERE id = v_quote.id;
  RETURN v_contract_id;
END;
$$ LANGUAGE plpgsql;

-- ================================================
-- 8. CONTRACT SYNC HELPERS
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

  UPDATE public.contracts
  SET 
    total_amount = v_quote.total_price,
    deposit_amount = v_quote.total_price * 0.5,
    updated_at = NOW()
  WHERE id = v_quote.contract_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

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
-- 9. ADDITIONAL INDEXES
-- ================================================

CREATE INDEX IF NOT EXISTS idx_contracts_quote_selection_id 
  ON public.contracts(quote_selection_id) WHERE quote_selection_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_contracts_contact_status 
  ON public.contracts(contact_id, status);

-- ================================================
-- DONE!
-- ================================================

SELECT '✅ Invoice/Quote/Contract sync system installed!' as status;
SELECT '📝 To sync all existing data:' as instructions;
SELECT '   SELECT * FROM sync_all_quotes_to_invoices();' as sync_invoices;
SELECT '   SELECT * FROM sync_all_quotes_to_contracts();' as sync_contracts;

