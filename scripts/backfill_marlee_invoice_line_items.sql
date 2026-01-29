-- Backfill line_items for invoice bdcda9ea (Marlee - Package 2, custom $2150).
-- Use when invoice has no line items but quote/package is known.
-- Run in Supabase SQL Editor.

DO $$
DECLARE
  v_invoice_id UUID := 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
  v_line_items JSONB;
  v_q RECORD;
BEGIN
  SELECT package_name, package_price, addons
  INTO v_q
  FROM quote_selections
  WHERE invoice_id = v_invoice_id
  LIMIT 1;

  IF FOUND AND v_q.package_name IS NOT NULL THEN
    v_line_items := jsonb_build_array(
      jsonb_build_object(
        'description', COALESCE(v_q.package_name, 'Package 2'),
        'type', 'package',
        'quantity', 1,
        'rate', COALESCE((v_q.package_price)::numeric, 2150),
        'amount', COALESCE((v_q.package_price)::numeric, 2150)
      )
    );
    IF v_q.addons IS NOT NULL AND jsonb_array_length(v_q.addons) > 0 THEN
      v_line_items := v_line_items || (
        SELECT COALESCE(jsonb_agg(
          jsonb_build_object(
            'description', addon->>'name',
            'type', 'addon',
            'quantity', 1,
            'rate', (addon->>'price')::numeric,
            'amount', (addon->>'price')::numeric
          )
        ), '[]'::jsonb)
        FROM jsonb_array_elements(v_q.addons) AS addon
      );
    END IF;
  ELSE
    v_line_items := jsonb_build_array(
      jsonb_build_object(
        'description', 'Package 2 (custom)',
        'type', 'package',
        'quantity', 1,
        'rate', 2150,
        'amount', 2150
      )
    );
  END IF;

  UPDATE invoices
  SET line_items = v_line_items, updated_at = NOW()
  WHERE id = v_invoice_id
    AND (line_items IS NULL OR line_items = '[]'::jsonb OR jsonb_array_length(line_items) = 0);

  RAISE NOTICE 'Updated line_items for invoice %', v_invoice_id;
END $$;

SELECT id, line_items, total_amount FROM invoices WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
