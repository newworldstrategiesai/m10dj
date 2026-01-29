-- ============================================
-- Graceful handling of admin-altered / negotiated pricing
--
-- When a client selects a package and the admin later alters the price
-- (e.g. Package 2 at $2500 negotiated to $2150), we must:
-- 1. Not overwrite the invoice when quote_selections is updated
-- 2. Persist and display that pricing was customized
-- ============================================

-- Add column: when set, sync_quote_to_invoice will NOT overwrite
-- total_amount, subtotal, line_items, or balance_due
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS admin_pricing_adjusted_at TIMESTAMPTZ;

COMMENT ON COLUMN public.invoices.admin_pricing_adjusted_at IS
  'When set, quote->invoice sync will not overwrite amounts/line_items (admin negotiated or manual adjustment).';

-- Update sync_quote_to_invoice: skip amount/line overwrite when invoice is admin-adjusted
CREATE OR REPLACE FUNCTION sync_quote_to_invoice()
RETURNS TRIGGER AS $$
DECLARE
  v_invoice_id UUID;
  v_package_name TEXT;
  v_line_items JSONB;
  v_admin_adjusted TIMESTAMPTZ;
BEGIN
  IF NEW.invoice_id IS NULL THEN
    RETURN NEW;
  END IF;

  v_invoice_id := NEW.invoice_id;

  -- Check if admin has locked pricing on this invoice
  SELECT admin_pricing_adjusted_at INTO v_admin_adjusted
  FROM public.invoices
  WHERE id = v_invoice_id;

  -- If admin adjusted pricing, only sync status (not amounts or line_items)
  IF v_admin_adjusted IS NOT NULL THEN
    UPDATE public.invoices
    SET
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
  END IF;

  -- Normal sync: build line items from quote
  v_line_items := '[]'::JSONB;

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

COMMENT ON FUNCTION sync_quote_to_invoice() IS
  'Syncs quote_selections to linked invoice. When invoice.admin_pricing_adjusted_at is set, only invoice_status is updated (amounts preserved).';
