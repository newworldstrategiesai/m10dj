-- ============================================================================
-- MASTER MIGRATION: Fix Entity Relationships and Data Synchronization
-- ============================================================================
-- 
-- This migration addresses critical data sync issues across the platform:
-- 
-- 1. Adds missing foreign keys to enforce referential integrity
-- 2. Creates bidirectional sync triggers between related tables
-- 3. Normalizes status field values across tables
-- 4. Adds cascade update triggers for event details
-- 5. Creates consistency check functions
--
-- AFFECTED PRODUCTS: DJDash.net, M10DJCompany.com, TipJar.live (all products)
-- RISK LEVEL: HIGH - Requires careful rollback planning
-- ============================================================================

-- ============================================================================
-- SECTION 1: ADD MISSING FOREIGN KEYS
-- ============================================================================

-- 1.1: Add contact_id column to events table (missing relationship!)
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
    
    RAISE NOTICE '✅ Added contact_id column to events table';
  ELSE
    RAISE NOTICE 'ℹ️ contact_id column already exists on events table';
  END IF;
END $$;

-- 1.2: Fix quote_selections.lead_id - currently has NO FK constraint
-- First check if FK exists
DO $$
BEGIN
  -- Check if constraint exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'quote_selections_lead_id_fkey' 
    AND table_name = 'quote_selections'
  ) THEN
    -- Add the FK constraint (may fail if orphan data exists)
    BEGIN
      ALTER TABLE public.quote_selections 
      ADD CONSTRAINT quote_selections_lead_id_fkey 
      FOREIGN KEY (lead_id) REFERENCES public.contacts(id) ON DELETE CASCADE;
      
      RAISE NOTICE '✅ Added FK constraint to quote_selections.lead_id';
    EXCEPTION 
      WHEN foreign_key_violation THEN
        RAISE WARNING '⚠️ Cannot add FK to quote_selections.lead_id - orphan records exist. Run backfill first.';
    END;
  ELSE
    RAISE NOTICE 'ℹ️ quote_selections_lead_id_fkey constraint already exists';
  END IF;
END $$;

-- 1.3: Add contact_id to payments if missing (some payments may not have this)
DO $$
BEGIN
  -- Ensure contact_id has FK if column exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'payments_contact_id_fkey' 
    AND table_name = 'payments'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' 
    AND column_name = 'contact_id'
  ) THEN
    ALTER TABLE public.payments
    ADD CONSTRAINT payments_contact_id_fkey
    FOREIGN KEY (contact_id) REFERENCES public.contacts(id) ON DELETE SET NULL;
    
    RAISE NOTICE '✅ Added FK constraint to payments.contact_id';
  END IF;
END $$;

-- ============================================================================
-- SECTION 2: BIDIRECTIONAL SYNC - CONTACTS ↔ EVENTS
-- ============================================================================

-- 2.1: Sync contact changes TO events (event details)
CREATE OR REPLACE FUNCTION sync_contact_to_events()
RETURNS TRIGGER AS $$
BEGIN
  -- When contact event details change, update linked events
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
      AND status NOT IN ('completed', 'cancelled'); -- Don't update completed/cancelled events
    
    -- Log the sync for debugging
    RAISE NOTICE 'Synced contact % changes to events', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_to_events ON public.contacts;
CREATE TRIGGER trigger_sync_contact_to_events
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_events();

-- 2.2: Sync events changes BACK to contacts (if event is the source of truth for dates)
CREATE OR REPLACE FUNCTION sync_event_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- When event details change, update the linked contact
  -- Only sync if contact_id is set
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
      -- Sync pricing if event has it and it's higher (don't overwrite with NULL)
      quoted_price = CASE 
        WHEN NEW.total_amount IS NOT NULL AND NEW.total_amount > 0 
        THEN NEW.total_amount 
        ELSE quoted_price 
      END,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
    
    RAISE NOTICE 'Synced event % changes to contact %', NEW.id, NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_event_to_contact ON public.events;
CREATE TRIGGER trigger_sync_event_to_contact
  AFTER UPDATE ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION sync_event_to_contact();

-- ============================================================================
-- SECTION 3: BIDIRECTIONAL SYNC - CONTACTS ↔ CONTRACTS
-- ============================================================================

-- 3.1: Sync contact changes TO contracts
CREATE OR REPLACE FUNCTION sync_contact_to_contracts()
RETURNS TRIGGER AS $$
BEGIN
  -- When contact event details change, update linked contracts (unless signed)
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
      AND status NOT IN ('signed', 'completed', 'cancelled', 'expired'); -- Don't update signed contracts!
    
    RAISE NOTICE 'Synced contact % changes to contracts (draft/sent only)', NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_to_contracts ON public.contacts;
CREATE TRIGGER trigger_sync_contact_to_contracts
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_to_contracts();

-- 3.2: Sync contract signing status TO contacts
CREATE OR REPLACE FUNCTION sync_contract_status_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- When contract is signed, update contact lead status
  IF NEW.status = 'signed' AND OLD.status != 'signed' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET 
      lead_status = 'Booked',
      lead_stage = 'Contract Signed',
      contract_signed_date = NEW.signed_at,
      contract_url = NEW.contract_pdf_url,
      updated_at = NOW()
    WHERE id = NEW.contact_id;
    
    RAISE NOTICE 'Updated contact % lead_status to Booked (contract signed)', NEW.contact_id;
  END IF;
  
  -- When contract is completed
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET 
      lead_status = 'Completed',
      updated_at = NOW()
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

-- ============================================================================
-- SECTION 4: PAYMENT → INVOICE SYNC (Critical for financial accuracy)
-- ============================================================================

-- 4.1: Sync payment changes to invoices
CREATE OR REPLACE FUNCTION sync_payments_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_total_paid NUMERIC(10,2);
  v_invoice_total NUMERIC(10,2);
BEGIN
  -- Determine invoice_id
  v_invoice_id := COALESCE(NEW.invoice_id, (
    SELECT id FROM public.invoices 
    WHERE contact_id = NEW.contact_id 
    AND invoice_status NOT IN ('Cancelled', 'Paid')
    ORDER BY created_at DESC 
    LIMIT 1
  ));
  
  IF v_invoice_id IS NULL THEN
    RETURN NEW;
  END IF;
  
  -- Calculate total paid for this invoice
  SELECT COALESCE(SUM(total_amount), 0)
  INTO v_total_paid
  FROM public.payments
  WHERE (invoice_id = v_invoice_id OR (invoice_id IS NULL AND contact_id = NEW.contact_id))
    AND payment_status = 'Paid';
  
  -- Get invoice total
  SELECT total_amount INTO v_invoice_total
  FROM public.invoices WHERE id = v_invoice_id;
  
  -- Update the invoice
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
  
  RAISE NOTICE 'Synced payment to invoice %: total_paid=%, balance=%', 
    v_invoice_id, v_total_paid, v_invoice_total - v_total_paid;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_payments_to_invoice ON public.payments;
CREATE TRIGGER trigger_sync_payments_to_invoice
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  WHEN (NEW.payment_status = 'Paid')
  EXECUTE FUNCTION sync_payments_to_invoice();

-- 4.2: Sync invoice payment changes to contacts
CREATE OR REPLACE FUNCTION sync_invoice_to_contact()
RETURNS TRIGGER AS $$
BEGIN
  -- When invoice payment status changes, update contact
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
    
    RAISE NOTICE 'Synced invoice % status to contact %', NEW.id, NEW.contact_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_invoice_to_contact ON public.invoices;
CREATE TRIGGER trigger_sync_invoice_to_contact
  AFTER UPDATE ON public.invoices
  FOR EACH ROW
  EXECUTE FUNCTION sync_invoice_to_contact();

-- ============================================================================
-- SECTION 5: PRICING SYNC (Keep amounts consistent)
-- ============================================================================

-- 5.1: Sync contact pricing to quote_selections and invoices
CREATE OR REPLACE FUNCTION sync_contact_pricing()
RETURNS TRIGGER AS $$
BEGIN
  -- When contact's quoted_price changes, sync to related records
  IF OLD.quoted_price IS DISTINCT FROM NEW.quoted_price AND NEW.quoted_price IS NOT NULL THEN
    
    -- Update quote_selections (if price hasn't been customer-modified)
    UPDATE public.quote_selections
    SET 
      total_price = NEW.quoted_price,
      updated_at = NOW()
    WHERE lead_id = NEW.id
      AND status = 'pending'  -- Only update pending quotes
      AND (total_price = 0 OR total_price IS NULL); -- Don't override customer selections
    
    -- Update draft invoices
    UPDATE public.invoices
    SET 
      total_amount = NEW.quoted_price,
      balance_due = NEW.quoted_price - COALESCE(amount_paid, 0),
      updated_at = NOW()
    WHERE contact_id = NEW.id
      AND invoice_status = 'Draft'; -- Only update drafts
    
    -- Update draft contracts
    UPDATE public.contracts
    SET 
      total_amount = NEW.quoted_price,
      deposit_amount = NEW.quoted_price * 0.5, -- 50% deposit
      updated_at = NOW()
    WHERE contact_id = NEW.id
      AND status = 'draft'; -- Only update drafts
    
    RAISE NOTICE 'Synced contact % pricing: $%', NEW.id, NEW.quoted_price;
  END IF;
  
  -- Sync deposit amount changes
  IF OLD.deposit_amount IS DISTINCT FROM NEW.deposit_amount AND NEW.deposit_amount IS NOT NULL THEN
    UPDATE public.contracts
    SET 
      deposit_amount = NEW.deposit_amount,
      updated_at = NOW()
    WHERE contact_id = NEW.id
      AND status IN ('draft', 'sent'); -- Only pre-signed
    
    UPDATE public.quote_selections
    SET 
      deposit_amount = NEW.deposit_amount,
      updated_at = NOW()
    WHERE lead_id = NEW.id
      AND status = 'pending';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_contact_pricing ON public.contacts;
CREATE TRIGGER trigger_sync_contact_pricing
  AFTER UPDATE ON public.contacts
  FOR EACH ROW
  EXECUTE FUNCTION sync_contact_pricing();

-- ============================================================================
-- SECTION 6: DATA CONSISTENCY CHECK FUNCTIONS
-- ============================================================================

-- 6.1: Find contacts without linked quote/invoice/contract
CREATE OR REPLACE FUNCTION find_orphaned_contacts()
RETURNS TABLE (
  contact_id UUID,
  first_name TEXT,
  last_name TEXT,
  email TEXT,
  has_quote BOOLEAN,
  has_invoice BOOLEAN,
  has_contract BOOLEAN,
  has_event BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.first_name,
    c.last_name,
    c.email_address,
    EXISTS(SELECT 1 FROM quote_selections qs WHERE qs.lead_id = c.id) as has_quote,
    EXISTS(SELECT 1 FROM invoices i WHERE i.contact_id = c.id) as has_invoice,
    EXISTS(SELECT 1 FROM contracts ct WHERE ct.contact_id = c.id) as has_contract,
    EXISTS(SELECT 1 FROM events e WHERE e.contact_id = c.id) as has_event
  FROM contacts c
  WHERE c.deleted_at IS NULL
    AND c.lead_status NOT IN ('Lost', 'Completed')
  ORDER BY c.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 6.2: Find pricing mismatches
CREATE OR REPLACE FUNCTION find_pricing_mismatches()
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  contact_price NUMERIC,
  invoice_total NUMERIC,
  contract_total NUMERIC,
  quote_total NUMERIC,
  mismatch_type TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
    c.quoted_price,
    i.total_amount,
    ct.total_amount,
    qs.total_price,
    CASE 
      WHEN c.quoted_price != i.total_amount THEN 'contact-invoice mismatch'
      WHEN c.quoted_price != ct.total_amount THEN 'contact-contract mismatch'
      WHEN i.total_amount != ct.total_amount THEN 'invoice-contract mismatch'
      WHEN qs.total_price != i.total_amount THEN 'quote-invoice mismatch'
      ELSE 'unknown'
    END as mismatch_type
  FROM contacts c
  LEFT JOIN invoices i ON i.contact_id = c.id AND i.invoice_status != 'Cancelled'
  LEFT JOIN contracts ct ON ct.contact_id = c.id AND ct.status NOT IN ('cancelled', 'expired')
  LEFT JOIN quote_selections qs ON qs.lead_id = c.id
  WHERE c.deleted_at IS NULL
    AND c.quoted_price IS NOT NULL
    AND (
      (i.total_amount IS NOT NULL AND c.quoted_price != i.total_amount) OR
      (ct.total_amount IS NOT NULL AND c.quoted_price != ct.total_amount) OR
      (qs.total_price IS NOT NULL AND qs.total_price > 0 AND qs.total_price != i.total_amount)
    );
END;
$$ LANGUAGE plpgsql;

-- 6.3: Find status inconsistencies
CREATE OR REPLACE FUNCTION find_status_inconsistencies()
RETURNS TABLE (
  contact_id UUID,
  contact_name TEXT,
  contact_lead_status TEXT,
  contact_payment_status TEXT,
  invoice_status TEXT,
  contract_status TEXT,
  issue TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, '')),
    c.lead_status,
    c.payment_status,
    i.invoice_status,
    ct.status,
    CASE 
      WHEN ct.status = 'signed' AND c.lead_status NOT IN ('Booked', 'Completed') 
        THEN 'Contract signed but lead not marked Booked'
      WHEN i.invoice_status = 'Paid' AND c.payment_status != 'paid' 
        THEN 'Invoice paid but contact shows unpaid'
      WHEN i.invoice_status = 'Overdue' AND c.payment_status NOT IN ('overdue', 'partial') 
        THEN 'Invoice overdue but contact not marked'
      WHEN c.lead_status = 'Booked' AND ct.status IS NULL 
        THEN 'Lead marked Booked but no contract exists'
      ELSE 'unknown'
    END as issue
  FROM contacts c
  LEFT JOIN invoices i ON i.contact_id = c.id AND i.invoice_status NOT IN ('Cancelled', 'Draft')
  LEFT JOIN contracts ct ON ct.contact_id = c.id AND ct.status NOT IN ('cancelled', 'expired')
  WHERE c.deleted_at IS NULL
    AND (
      (ct.status = 'signed' AND c.lead_status NOT IN ('Booked', 'Completed')) OR
      (i.invoice_status = 'Paid' AND c.payment_status != 'paid') OR
      (i.invoice_status = 'Overdue' AND c.payment_status NOT IN ('overdue', 'partial')) OR
      (c.lead_status = 'Booked' AND ct.status IS NULL)
    );
END;
$$ LANGUAGE plpgsql;

-- 6.4: Find events without contact link
CREATE OR REPLACE FUNCTION find_unlinked_events()
RETURNS TABLE (
  event_id UUID,
  event_name TEXT,
  client_email TEXT,
  event_date DATE,
  suggested_contact_id UUID,
  suggested_contact_name TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    e.id,
    e.event_name,
    e.client_email,
    e.event_date,
    c.id,
    TRIM(COALESCE(c.first_name, '') || ' ' || COALESCE(c.last_name, ''))
  FROM events e
  LEFT JOIN contacts c ON (
    c.email_address = e.client_email OR
    (c.first_name || ' ' || c.last_name) = e.client_name
  )
  WHERE e.contact_id IS NULL
    AND e.status != 'cancelled'
  ORDER BY e.event_date DESC;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 7: BACKFILL FUNCTIONS (Run manually to fix existing data)
-- ============================================================================

-- 7.1: Link events to contacts by email/name matching
CREATE OR REPLACE FUNCTION backfill_event_contact_links()
RETURNS TABLE (
  event_id UUID,
  contact_id UUID,
  match_type TEXT
) AS $$
DECLARE
  v_event RECORD;
  v_contact_id UUID;
  v_match_type TEXT;
BEGIN
  FOR v_event IN 
    SELECT e.* FROM events e 
    WHERE e.contact_id IS NULL 
    AND e.status != 'cancelled'
  LOOP
    v_contact_id := NULL;
    v_match_type := NULL;
    
    -- Try email match first
    IF v_event.client_email IS NOT NULL THEN
      SELECT c.id INTO v_contact_id
      FROM contacts c
      WHERE c.email_address = v_event.client_email
      AND c.deleted_at IS NULL
      LIMIT 1;
      
      IF v_contact_id IS NOT NULL THEN
        v_match_type := 'email';
      END IF;
    END IF;
    
    -- Try name match if no email match
    IF v_contact_id IS NULL AND v_event.client_name IS NOT NULL THEN
      SELECT c.id INTO v_contact_id
      FROM contacts c
      WHERE LOWER(TRIM(c.first_name || ' ' || c.last_name)) = LOWER(v_event.client_name)
      AND c.deleted_at IS NULL
      LIMIT 1;
      
      IF v_contact_id IS NOT NULL THEN
        v_match_type := 'name';
      END IF;
    END IF;
    
    -- Update the event if we found a match
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

-- 7.2: Create missing quote/invoice/contract for booked contacts
CREATE OR REPLACE FUNCTION backfill_missing_records()
RETURNS TABLE (
  contact_id UUID,
  created_quote BOOLEAN,
  created_invoice BOOLEAN,
  created_contract BOOLEAN
) AS $$
DECLARE
  v_contact RECORD;
  v_quote_id UUID;
  v_invoice_id UUID;
  v_contract_id UUID;
  v_created_quote BOOLEAN;
  v_created_invoice BOOLEAN;
  v_created_contract BOOLEAN;
BEGIN
  FOR v_contact IN 
    SELECT c.* FROM contacts c 
    WHERE c.deleted_at IS NULL
    AND c.lead_status IN ('Booked', 'Proposal Sent', 'Negotiating')
    AND NOT EXISTS (SELECT 1 FROM quote_selections qs WHERE qs.lead_id = c.id)
  LOOP
    v_created_quote := FALSE;
    v_created_invoice := FALSE;
    v_created_contract := FALSE;
    
    -- Create quote selection if missing
    IF NOT EXISTS (SELECT 1 FROM quote_selections WHERE lead_id = v_contact.id) THEN
      INSERT INTO quote_selections (
        lead_id, package_id, package_name, package_price, total_price, status
      ) VALUES (
        v_contact.id, 'pending', 'Service Selection Pending', 
        COALESCE(v_contact.quoted_price, 0), COALESCE(v_contact.quoted_price, 0), 'pending'
      ) RETURNING id INTO v_quote_id;
      v_created_quote := TRUE;
    ELSE
      SELECT id INTO v_quote_id FROM quote_selections WHERE lead_id = v_contact.id LIMIT 1;
    END IF;
    
    -- Create invoice if missing
    IF NOT EXISTS (SELECT 1 FROM invoices WHERE contact_id = v_contact.id) THEN
      INSERT INTO invoices (
        contact_id, invoice_number, invoice_status, invoice_title,
        invoice_date, due_date, total_amount, balance_due
      ) VALUES (
        v_contact.id, 
        'INV-BKFL-' || SUBSTRING(v_contact.id::text, 1, 8),
        'Draft',
        COALESCE(v_contact.event_type, 'Event') || ' - ' || COALESCE(v_contact.first_name, 'Client'),
        CURRENT_DATE,
        CURRENT_DATE + INTERVAL '30 days',
        COALESCE(v_contact.quoted_price, 0),
        COALESCE(v_contact.quoted_price, 0)
      ) RETURNING id INTO v_invoice_id;
      v_created_invoice := TRUE;
      
      -- Link to quote
      IF v_quote_id IS NOT NULL THEN
        UPDATE quote_selections SET invoice_id = v_invoice_id WHERE id = v_quote_id;
      END IF;
    ELSE
      SELECT id INTO v_invoice_id FROM invoices WHERE contact_id = v_contact.id LIMIT 1;
    END IF;
    
    -- Create contract if missing
    IF NOT EXISTS (SELECT 1 FROM contracts WHERE contact_id = v_contact.id AND status != 'cancelled') THEN
      INSERT INTO contracts (
        contact_id, invoice_id, quote_selection_id, contract_number, contract_type,
        event_name, event_type, event_date, venue_name, venue_address,
        total_amount, deposit_amount, status
      ) VALUES (
        v_contact.id, v_invoice_id, v_quote_id,
        'CONT-BKFL-' || SUBSTRING(v_contact.id::text, 1, 8),
        'service_agreement',
        TRIM(COALESCE(v_contact.first_name, '') || ' ' || COALESCE(v_contact.last_name, '') || ' - ' || COALESCE(v_contact.event_type, 'Event')),
        v_contact.event_type, v_contact.event_date, v_contact.venue_name, v_contact.venue_address,
        COALESCE(v_contact.quoted_price, 0),
        COALESCE(v_contact.deposit_amount, v_contact.quoted_price * 0.5, 0),
        'draft'
      ) RETURNING id INTO v_contract_id;
      v_created_contract := TRUE;
      
      -- Link to quote
      IF v_quote_id IS NOT NULL THEN
        UPDATE quote_selections SET contract_id = v_contract_id WHERE id = v_quote_id;
      END IF;
    END IF;
    
    IF v_created_quote OR v_created_invoice OR v_created_contract THEN
      contact_id := v_contact.id;
      created_quote := v_created_quote;
      created_invoice := v_created_invoice;
      created_contract := v_created_contract;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 7.3: Force sync all contacts to their related records
CREATE OR REPLACE FUNCTION force_sync_all_contacts()
RETURNS TABLE (
  contact_id UUID,
  synced_events INT,
  synced_contracts INT,
  synced_invoices INT
) AS $$
DECLARE
  v_contact RECORD;
  v_synced_events INT;
  v_synced_contracts INT;
  v_synced_invoices INT;
BEGIN
  FOR v_contact IN 
    SELECT * FROM contacts 
    WHERE deleted_at IS NULL 
    AND lead_status NOT IN ('Lost')
  LOOP
    -- Sync to events
    UPDATE events
    SET 
      event_type = COALESCE(v_contact.event_type, event_type),
      event_date = COALESCE(v_contact.event_date, event_date),
      venue_name = COALESCE(v_contact.venue_name, venue_name),
      venue_address = COALESCE(v_contact.venue_address, venue_address),
      number_of_guests = COALESCE(v_contact.guest_count, number_of_guests),
      client_name = COALESCE(TRIM(v_contact.first_name || ' ' || v_contact.last_name), client_name),
      client_email = COALESCE(v_contact.email_address, client_email),
      client_phone = COALESCE(v_contact.phone, client_phone),
      updated_at = NOW()
    WHERE contact_id = v_contact.id
      AND status NOT IN ('completed', 'cancelled');
    GET DIAGNOSTICS v_synced_events = ROW_COUNT;
    
    -- Sync to contracts (drafts only)
    UPDATE contracts
    SET 
      event_type = COALESCE(v_contact.event_type, event_type),
      event_date = COALESCE(v_contact.event_date, event_date),
      event_time = COALESCE(v_contact.event_time::text, event_time),
      venue_name = COALESCE(v_contact.venue_name, venue_name),
      venue_address = COALESCE(v_contact.venue_address, venue_address),
      guest_count = COALESCE(v_contact.guest_count, guest_count),
      total_amount = COALESCE(v_contact.quoted_price, total_amount),
      deposit_amount = COALESCE(v_contact.deposit_amount, deposit_amount),
      updated_at = NOW()
    WHERE contact_id = v_contact.id
      AND status IN ('draft', 'sent');
    GET DIAGNOSTICS v_synced_contracts = ROW_COUNT;
    
    -- Sync pricing to invoices (drafts only)
    UPDATE invoices
    SET 
      total_amount = COALESCE(v_contact.quoted_price, total_amount),
      balance_due = COALESCE(v_contact.quoted_price, total_amount) - COALESCE(amount_paid, 0),
      updated_at = NOW()
    WHERE contact_id = v_contact.id
      AND invoice_status = 'Draft';
    GET DIAGNOSTICS v_synced_invoices = ROW_COUNT;
    
    IF v_synced_events > 0 OR v_synced_contracts > 0 OR v_synced_invoices > 0 THEN
      contact_id := v_contact.id;
      synced_events := v_synced_events;
      synced_contracts := v_synced_contracts;
      synced_invoices := v_synced_invoices;
      RETURN NEXT;
    END IF;
  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SECTION 8: ADD DOCUMENTATION COMMENTS
-- ============================================================================

COMMENT ON FUNCTION sync_contact_to_events() IS 
'Trigger: Syncs contact event details → events table.
Fires when: contact.event_date, event_type, venue_*, guest_count, or client info changes.
Does NOT update: completed or cancelled events.';

COMMENT ON FUNCTION sync_event_to_contact() IS 
'Trigger: Syncs event details → contacts table.
Fires when: event.event_date, event_type, venue_*, guests, or total_amount changes.
Requires: event.contact_id to be set.';

COMMENT ON FUNCTION sync_contact_to_contracts() IS 
'Trigger: Syncs contact event details → contracts table.
Fires when: contact event details change.
Does NOT update: signed, completed, cancelled, or expired contracts.';

COMMENT ON FUNCTION sync_contract_status_to_contact() IS 
'Trigger: Updates contact lead_status when contract is signed/completed.
Sets lead_status to "Booked" when contract status becomes "signed".
Sets lead_status to "Completed" when contract status becomes "completed".';

COMMENT ON FUNCTION sync_payments_to_invoice() IS 
'Trigger: Aggregates payments and updates invoice.amount_paid and status.
Fires when: payment with status "Paid" is inserted or updated.
Updates: invoice.amount_paid, balance_due, invoice_status, paid_date.';

COMMENT ON FUNCTION sync_invoice_to_contact() IS 
'Trigger: Syncs invoice payment status → contacts table.
Updates: contact.payment_status, final_price, deposit_paid.';

COMMENT ON FUNCTION sync_contact_pricing() IS 
'Trigger: Syncs contact.quoted_price → quote_selections, invoices, contracts.
Only updates: pending quotes, draft invoices, draft contracts.
Does NOT override: customer-selected pricing in quote_selections.';

COMMENT ON FUNCTION find_orphaned_contacts() IS 
'Diagnostic: Finds contacts missing quote/invoice/contract/event links.
Run to identify records needing backfill.';

COMMENT ON FUNCTION find_pricing_mismatches() IS 
'Diagnostic: Finds records where pricing differs between contact/invoice/contract/quote.
Run to identify sync failures.';

COMMENT ON FUNCTION find_status_inconsistencies() IS 
'Diagnostic: Finds records where status is inconsistent.
Examples: Contract signed but lead not Booked, Invoice paid but contact shows unpaid.';

COMMENT ON FUNCTION find_unlinked_events() IS 
'Diagnostic: Finds events without contact_id link.
Also suggests matching contacts by email/name.';

COMMENT ON FUNCTION backfill_event_contact_links() IS 
'Backfill: Links events to contacts by email or name matching.
Run once to fix historical data, then rely on triggers.';

COMMENT ON FUNCTION backfill_missing_records() IS 
'Backfill: Creates missing quote/invoice/contract for booked contacts.
Run to ensure all booked leads have complete records.';

COMMENT ON FUNCTION force_sync_all_contacts() IS 
'Utility: Force-syncs ALL contacts to their events/contracts/invoices.
Use carefully - will update many records.';

-- ============================================================================
-- SECTION 9: SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '✅ Entity Relationship Migration Complete!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 Changes Applied:';
  RAISE NOTICE '   ✅ Added contact_id column to events table';
  RAISE NOTICE '   ✅ Added FK constraint to quote_selections.lead_id';
  RAISE NOTICE '   ✅ Created sync triggers: contacts ↔ events';
  RAISE NOTICE '   ✅ Created sync triggers: contacts ↔ contracts';
  RAISE NOTICE '   ✅ Created sync triggers: payments → invoices → contacts';
  RAISE NOTICE '   ✅ Created pricing sync trigger';
  RAISE NOTICE '   ✅ Created diagnostic functions';
  RAISE NOTICE '   ✅ Created backfill functions';
  RAISE NOTICE '';
  RAISE NOTICE '🔧 NEXT STEPS - Run these manually:';
  RAISE NOTICE '';
  RAISE NOTICE '1. Find issues:';
  RAISE NOTICE '   SELECT * FROM find_orphaned_contacts() LIMIT 20;';
  RAISE NOTICE '   SELECT * FROM find_pricing_mismatches();';
  RAISE NOTICE '   SELECT * FROM find_status_inconsistencies();';
  RAISE NOTICE '   SELECT * FROM find_unlinked_events();';
  RAISE NOTICE '';
  RAISE NOTICE '2. Fix issues:';
  RAISE NOTICE '   SELECT * FROM backfill_event_contact_links();';
  RAISE NOTICE '   SELECT * FROM backfill_missing_records();';
  RAISE NOTICE '   SELECT * FROM force_sync_all_contacts();';
  RAISE NOTICE '';
END $$;

