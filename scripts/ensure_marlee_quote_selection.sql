-- Ensure a quote_selections row exists for Marlee (Package 2, custom $2150) linked to her invoice.
-- Run in Supabase SQL Editor. Safe to run multiple times (upserts on lead_id).
-- Uses only base quote_selections columns (no customized, original_price, etc.).

-- lead_id: c082f6bd-d63c-4c23-992d-caa68c299017  |  invoice_id: bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a

INSERT INTO quote_selections (
  lead_id,
  package_id,
  package_name,
  package_price,
  addons,
  total_price,
  status,
  payment_status,
  invoice_id,
  updated_at
)
VALUES (
  'c082f6bd-d63c-4c23-992d-caa68c299017'::uuid,
  'package2',
  'Package 2',
  2150.00,
  '[]'::jsonb,
  2150.00,
  'invoiced',
  'partial',
  'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'::uuid,
  NOW()
)
ON CONFLICT (lead_id) DO UPDATE SET
  package_id = EXCLUDED.package_id,
  package_name = EXCLUDED.package_name,
  package_price = EXCLUDED.package_price,
  total_price = EXCLUDED.total_price,
  status = EXCLUDED.status,
  payment_status = EXCLUDED.payment_status,
  invoice_id = EXCLUDED.invoice_id,
  updated_at = NOW();

-- Optional: sync invoice line_items from this quote (trigger may do it; if admin_pricing_adjusted_at is set, trigger skips)
-- Uncomment to backfill invoice line_items from the quote:
-- UPDATE invoices
-- SET line_items = (
--   SELECT jsonb_build_array(
--     jsonb_build_object('description', qs.package_name, 'type', 'package', 'quantity', 1, 'rate', qs.package_price, 'amount', qs.package_price)
--   )
-- )
-- FROM quote_selections qs
-- WHERE qs.invoice_id = invoices.id AND invoices.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'
--   AND (invoices.line_items IS NULL OR jsonb_array_length(invoices.line_items) = 0);

-- Verify
SELECT id, lead_id, invoice_id, package_id, package_name, package_price, total_price, status, payment_status
FROM quote_selections
WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';
