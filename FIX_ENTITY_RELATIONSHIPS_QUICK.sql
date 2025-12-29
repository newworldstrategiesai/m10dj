-- ============================================================================
-- QUICK RUN: Fix Entity Relationships
-- ============================================================================
-- 
-- Copy this entire file and paste into Supabase SQL Editor
-- This is a standalone version of the migration file
-- 
-- ============================================================================

-- STEP 1: Add contact_id to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'events' 
    AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE public.events 
    ADD COLUMN contact_id UUID REFERENCES public.contacts(id) ON DELETE SET NULL;
    CREATE INDEX IF NOT EXISTS idx_events_contact_id ON public.events(contact_id);
    RAISE NOTICE '✅ Added contact_id to events';
  END IF;
END $$;

-- STEP 2: Sync contacts → events
CREATE OR REPLACE FUNCTION sync_contact_to_events()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.event_date IS DISTINCT FROM NEW.event_date) OR
     (OLD.event_type IS DISTINCT FROM NEW.event_type) OR
     (OLD.venue_name IS DISTINCT FROM NEW.venue_name) OR
     (OLD.venue_address IS DISTINCT FROM NEW.venue_address) OR
     (OLD.guest_count IS DISTINCT FROM NEW.guest_count) OR
     (OLD.first_name IS DISTINCT FROM NEW.first_name) OR
     (OLD.last_name IS DISTINCT FROM NEW.last_name) OR
     (OLD.email_address IS DISTINCT FROM NEW.email_address) OR
     (OLD.phone IS DISTINCT FROM NEW.phone) THEN
    
    UPDATE public.events
    SET 
      event_type = COALESCE(NEW.event_type, event_type),
      event_date = COALESCE(NEW.event_date, event_date),
      venue_name = COALESCE(NEW.venue_name, venue_name),
      venue_address = COALESCE(NEW.venue_address, venue_address),
      number_of_guests = COALESCE(NEW.guest_count, number_of_guests),
      client_name = COALESCE(TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '')), client_name),
      client_email = COALESCE(NEW.email_address, client_email),
      client_phone = COALESCE(NEW.phone, client_phone),
      updated_at = NOW()
    WHERE contact_id = NEW.id
      AND status NOT IN ('completed', 'cancelled');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_to_events ON public.contacts;
CREATE TRIGGER trigger_sync_contact_to_events
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_events();

-- STEP 3: Sync events → contacts  
CREATE OR REPLACE FUNCTION sync_event_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.contact_id IS NOT NULL AND (
     (OLD.event_date IS DISTINCT FROM NEW.event_date) OR
     (OLD.event_type IS DISTINCT FROM NEW.event_type) OR
     (OLD.venue_name IS DISTINCT FROM NEW.venue_name) OR
     (OLD.venue_address IS DISTINCT FROM NEW.venue_address) OR
     (OLD.number_of_guests IS DISTINCT FROM NEW.number_of_guests) OR
     (OLD.total_amount IS DISTINCT FROM NEW.total_amount)
  ) THEN
    UPDATE public.contacts
    SET 
      event_date = COALESCE(NEW.event_date, event_date),
      event_type = COALESCE(NEW.event_type, event_type),
      venue_name = COALESCE(NEW.venue_name, venue_name),
      venue_address = COALESCE(NEW.venue_address, venue_address),
      guest_count = COALESCE(NEW.number_of_guests, guest_count),
      quoted_price = CASE 
        WHEN NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 
        THEN NEW.total_amount 
        ELSE quoted_price 
      END,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_event_to_contact ON public.events;
CREATE TRIGGER trigger_sync_event_to_contact
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_to_contact();

-- STEP 4: Sync contacts → contracts
CREATE OR REPLACE FUNCTION sync_contact_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.event_date IS DISTINCT FROM NEW.event_date) OR
     (OLD.event_type IS DISTINCT FROM NEW.event_type) OR
     (OLD.venue_name IS DISTINCT FROM NEW.venue_name) OR
     (OLD.venue_address IS DISTINCT FROM NEW.venue_address) OR
     (OLD.guest_count IS DISTINCT FROM NEW.guest_count) OR
     (OLD.event_time IS DISTINCT FROM NEW.event_time) THEN
    
    UPDATE public.contracts
    SET 
      event_type = COALESCE(NEW.event_type, event_type),
      event_date = COALESCE(NEW.event_date, event_date),
      event_time = COALESCE(NEW.event_time::text, event_time),
      venue_name = COALESCE(NEW.venue_name, venue_name),
      venue_address = COALESCE(NEW.venue_address, venue_address),
      guest_count = COALESCE(NEW.guest_count, guest_count),
      event_name = COALESCE(
        TRIM(COALESCE(NEW.first_name, '') || ' ' || COALESCE(NEW.last_name, '') || ' - ' || COALESCE(NEW.event_type, 'Event')),
        event_name
      ),
      updated_at = NOW()
    WHERE contact_id = NEW.id
      AND status NOT IN ('signed', 'completed', 'cancelled', 'expired');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_to_contracts ON public.contacts;
CREATE TRIGGER trigger_sync_contact_to_contracts
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_contracts();

-- STEP 5: Sync contract signing → contacts
CREATE OR REPLACE FUNCTION sync_contract_status_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'signed' AND OLD.status != 'signed' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET 
      lead_status = 'Booked',
      lead_stage = 'Contract Signed',
      contract_signed_date = NEW.signed_at,
      contract_url = NEW.contract_pdf_url,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET lead_status = 'Completed', updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contract_status_to_contact ON public.contracts;
CREATE TRIGGER trigger_sync_contract_status_to_contact
  AFTER UPDATE ON public.contracts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contract_status_to_contact();

-- STEP 6: Sync payments → invoices
CREATE OR REPLACE FUNCTION sync_payments_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_total_paid NUMERIC(10,2);
  v_invoice_total NUMERIC(10,2);
BEGIN
  v_invoice_id := COALESCE(NEW.invoice_id, (
    SELECT id FROM public.invoices 
    WHERE contact_id = NEW.contact_id 
    AND invoice_status NOT IN ('Cancelled', 'Paid')
    ORDER BY created_at DESC LIMIT 1
  ));
  
  IF v_invoice_id IS NULL THEN RETURN NEW; END IF;
  
  SELECT COALESCE(SUM(total_amount), 0) INTO v_total_paid
  FROM public.payments
  WHERE (invoice_id = v_invoice_id OR (invoice_id IS NULL AND contact_id = NEW.contact_id))
    AND payment_status = 'Paid';
  
  SELECT total_amount INTO v_invoice_total FROM public.invoices WHERE id = v_invoice_id;
  
  UPDATE public.invoices
  SET 
    amount_paid = v_total_paid,
    balance_due = total_amount - v_total_paid,
    invoice_status = CASE 
      WHEN v_total_paid >= v_invoice_total THEN 'Paid'
      WHEN v_total_paid > 0 THEN 'Partial'
      WHEN due_date < CURRENT_DATE AND invoice_status NOT IN ('Draft', 'Cancelled') THEN 'Overdue'
      ELSE invoice_status
    END,
    paid_date = CASE 
      WHEN v_total_paid >= v_invoice_total AND paid_date IS NULL THEN NOW()
      ELSE paid_date
    END,
    updated_at = NOW()
  WHERE id = v_invoice_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_payments_to_invoice ON public.payments;
CREATE TRIGGER trigger_sync_payments_to_invoice
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.payment_status = 'Paid')
  EXECUTE FUNCTION sync_payments_to_invoice();

-- STEP 7: Sync invoices → contacts
CREATE OR REPLACE FUNCTION sync_invoice_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  IF (OLD.invoice_status IS DISTINCT FROM NEW.invoice_status) OR
     (OLD.amount_paid IS DISTINCT FROM NEW.amount_paid) THEN
    
    UPDATE public.contacts
    SET 
      payment_status = CASE 
        WHEN NEW.invoice_status = 'Paid' THEN 'paid'
        WHEN NEW.invoice_status = 'Partial' THEN 'partial'
        WHEN NEW.invoice_status = 'Overdue' THEN 'overdue'
        ELSE payment_status
      END,
      final_price = CASE 
        WHEN NEW.invoice_status = 'Paid' THEN NEW.amount_paid
        ELSE final_price
      END,
      deposit_paid = CASE
        WHEN NEW.amount_paid > 0 THEN TRUE
        ELSE deposit_paid
      END,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_invoice_to_contact ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_to_contact
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_to_contact();

-- STEP 8: Sync contact pricing → related records
CREATE OR REPLACE FUNCTION sync_contact_pricing()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.quoted_price IS DISTINCT FROM NEW.quoted_price AND NEW.quoted_price IS NOT NULL THEN
    UPDATE public.quote_selections
    SET total_price = NEW.quoted_price, updated_at = NOW()
    WHERE lead_id = NEW.id AND status = 'pending' AND (total_price = 0 OR total_price IS NULL);
    
    UPDATE public.invoices
    SET total_amount = NEW.quoted_price, balance_due = NEW.quoted_price - COALESCE(amount_paid, 0), updated_at = NOW()
    WHERE contact_id = NEW.id AND invoice_status = 'Draft';
    
    UPDATE public.contracts
    SET total_amount = NEW.quoted_price, deposit_amount = NEW.quoted_price * 0.5, updated_at = NOW()
    WHERE contact_id = NEW.id AND status = 'draft';
  END IF;
  
  IF OLD.deposit_amount IS DISTINCT FROM NEW.deposit_amount AND NEW.deposit_amount IS NOT NULL THEN
    UPDATE public.contracts SET deposit_amount = NEW.deposit_amount, updated_at = NOW()
    WHERE contact_id = NEW.id AND status IN ('draft', 'sent');
    
    UPDATE public.quote_selections SET deposit_amount = NEW.deposit_amount, updated_at = NOW()
    WHERE lead_id = NEW.id AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_pricing ON public.contacts;
CREATE TRIGGER trigger_sync_contact_pricing
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_pricing();

-- STEP 9: Diagnostic functions
CREATE OR REPLACE FUNCTION find_orphaned_contacts()
RETURNS TABLE (
  contact_id UUID, first_name TEXT, last_name TEXT, email TEXT,
  has_quote BOOLEAN, has_invoice BOOLEAN, has_contract BOOLEAN, has_event BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, c.first_name, c.last_name, c.email_address,
    EXISTS(SELECT 1 FROM quote_selections qs WHERE qs.lead_id = c.id),
    EXISTS(SELECT 1 FROM invoices i WHERE i.contact_id = c.id),
    EXISTS(SELECT 1 FROM contracts ct WHERE ct.contact_id = c.id),
    EXISTS(SELECT 1 FROM events e WHERE e.contact_id = c.id)
  FROM contacts c
  WHERE c.deleted_at IS NULL AND c.lead_status NOT IN ('Lost', 'Completed')
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_pricing_mismatches()
RETURNS TABLE (
  contact_id UUID, contact_name TEXT, contact_price NUMERIC,
  invoice_total NUMERIC, contract_total NUMERIC, quote_total NUMERIC, mismatch_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT c.id, TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
    c.quoted_price, i.total_amount, ct.total_amount, qs.total_price,
    CASE 
      WHEN c.quoted_price != i.total_amount THEN 'contact-invoice mismatch'
      WHEN c.quoted_price != ct.total_amount THEN 'contact-contract mismatch'
      WHEN i.total_amount != ct.total_amount THEN 'invoice-contract mismatch'
      WHEN qs.total_price != i.total_amount THEN 'quote-invoice mismatch'
      ELSE 'unknown'
    END
  FROM contacts c
  LEFT JOIN invoices i ON i.contact_id = c.id AND i.invoice_status != 'Cancelled'
  LEFT JOIN contracts ct ON ct.contact_id = c.id AND ct.status NOT IN ('cancelled', 'expired')
  LEFT JOIN quote_selections qs ON qs.lead_id = c.id
  WHERE c.deleted_at IS NULL AND c.quoted_price IS NOT NULL
    AND (
      (i.total_amount IS NOT NULL AND c.quoted_price != i.total_amount) OR
      (ct.total_amount IS NOT NULL AND c.quoted_price != ct.total_amount) OR
      (qs.total_price IS NOT NULL AND qs.total_price > 0 AND qs.total_price != i.total_amount)
    );
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION find_unlinked_events()
RETURNS TABLE (
  event_id UUID, event_name TEXT, client_email TEXT, event_date DATE,
  suggested_contact_id UUID, suggested_contact_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT e.id, e.event_name, e.client_email, e.event_date, c.id,
    TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, ''))
  FROM events e
  LEFT JOIN contacts c ON (
    c.email_address = e.client_email OR
    (c.first_name || ' ' || c.last_name) = e.client_name
  )
  WHERE e.contact_id IS NULL AND e.status != 'cancelled'
  ORDER BY e.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- STEP 10: Backfill functions
CREATE OR REPLACE FUNCTION backfill_event_contact_links()
RETURNS TABLE (event_id UUID, contact_id UUID, match_type TEXT) AS $$
DECLARE
  v_event RECORD;
  v_contact_id UUID;
  v_match_type TEXT;
BEGIN
  FOR v_event IN SELECT e.* FROM events e WHERE e.contact_id IS NULL AND e.status != 'cancelled'
  LOOP
    v_contact_id := NULL;
    v_match_type := NULL;
    
    IF v_event.client_email IS NOT NULL THEN
      SELECT c.id INTO v_contact_id FROM contacts c
      WHERE c.email_address = v_event.client_email AND c.deleted_at IS NULL LIMIT 1;
      IF v_contact_id IS NOT NULL THEN v_match_type := 'email'; END IF;
    END IF;
    
    IF v_contact_id IS NULL AND v_event.client_name IS NOT NULL THEN
      SELECT c.id INTO v_contact_id FROM contacts c
      WHERE LOWER(TRIM(c.first_name || ' ' || c.last_name)) = LOWER(v_event.client_name)
      AND c.deleted_at IS NULL LIMIT 1;
      IF v_contact_id IS NOT NULL THEN v_match_type := 'name'; END IF;
    END IF;
    
    IF v_contact_id IS NOT NULL THEN
      UPDATE events SET contact_id = v_contact_id WHERE id = v_event.id;
      event_id := v_event.id;
      contact_id := v_contact_id;
      match_type := v_match_type;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- DONE!
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Entity Relationship Sync Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '🔍 Run these to check for issues:';
  RAISE NOTICE '   SELECT * FROM find_orphaned_contacts() WHERE NOT has_quote OR NOT has_invoice OR NOT has_contract LIMIT 20;';
  RAISE NOTICE '   SELECT * FROM find_pricing_mismatches();';
  RAISE NOTICE '   SELECT * FROM find_unlinked_events();';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 Run this to backfill event links:';
  RAISE NOTICE '   SELECT * FROM backfill_event_contact_links();';
  RAISE NOTICE '';
END $$;

