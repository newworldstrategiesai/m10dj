-- Create a project (event) for Marlee and link invoice bdcda9ea to it.
-- Uses contact c082f6bd and invoice org; event details from thread (10/10/26, The Elliot, Somerville TN).
-- Run in Supabase SQL Editor.

-- Step 1: Create the event from invoice + contact, then link invoice to it
WITH inv AS (
  SELECT i.id AS invoice_id, i.contact_id, i.organization_id,
         c.first_name, c.last_name, c.email_address, c.phone, c.event_type
  FROM invoices i
  JOIN contacts c ON c.id = i.contact_id
  WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'
  LIMIT 1
),
new_event AS (
  INSERT INTO events (
    contact_id,
    organization_id,
    event_name,
    client_name,
    client_email,
    client_phone,
    event_type,
    event_date,
    venue_name,
    venue_address,
    status
  )
  SELECT
    inv.contact_id,
    COALESCE(inv.organization_id, (SELECT id FROM organizations LIMIT 1)),
    TRIM(COALESCE(inv.first_name,'') || ' ' || COALESCE(inv.last_name,'')) || ' - Wedding',
    TRIM(COALESCE(inv.first_name,'') || ' ' || COALESCE(inv.last_name,'')),
    inv.email_address,
    inv.phone,
    COALESCE(NULLIF(TRIM(inv.event_type), ''), 'wedding'),
    '2026-10-10'::date,
    'The Elliot',
    '10720 SR-76, Somerville, TN 38068',
    'confirmed'
  FROM inv
  RETURNING id
)
UPDATE invoices
SET project_id = (SELECT id FROM new_event),
    updated_at = NOW()
WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Step 2: Verify (invoice should now have project_id set; event exists)
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.project_id AS linked_event_id,
  e.event_name,
  e.event_date,
  e.venue_name,
  e.venue_address
FROM invoices i
LEFT JOIN events e ON e.id = i.project_id
WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
