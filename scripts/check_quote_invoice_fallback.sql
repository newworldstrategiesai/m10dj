-- Check why quote/invoice APIs might 404 for a lead/contact ID.
-- Run in Supabase SQL Editor. Replace 'c082f6bd-d63c-4c23-992d-caa68c299017' if checking another contact.

-- 1) Contact exists?
SELECT 'contact' AS source, id, first_name, last_name, email_address
FROM contacts
WHERE id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- 2) Quote selection by lead_id?
SELECT 'quote_selections' AS source, id, lead_id, invoice_id, package_name, total_price, status
FROM quote_selections
WHERE lead_id = 'c082f6bd-d63c-4c23-992d-caa68c299017';

-- 3) Invoice by contact_id (what the API fallback uses)
SELECT 'invoices_by_contact' AS source, id, invoice_number, contact_id, total_amount, invoice_status
FROM invoices
WHERE contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
  AND invoice_status != 'Cancelled'
ORDER BY created_at DESC
LIMIT 3;

-- 4) Payment by contact_id (second fallback)
SELECT 'payments_by_contact' AS source, id, contact_id, invoice_id, total_amount, payment_status
FROM payments
WHERE contact_id = 'c082f6bd-d63c-4c23-992d-caa68c299017'
  AND invoice_id IS NOT NULL
ORDER BY created_at DESC
LIMIT 3;

-- 5) If Marlee invoice is known by ID: does it point to this contact?
SELECT 'invoice_bdcda9ea' AS source, id, contact_id, invoice_number, total_amount, invoice_status
FROM invoices
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
