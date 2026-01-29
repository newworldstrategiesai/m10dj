-- Check if an invoice is linked to a project/event.
-- In this schema: invoices.project_id → events.id (one link; "project" in UI = event).

-- For invoice bdcda9ea (Marlee):
SELECT
  i.id AS invoice_id,
  i.invoice_number,
  i.contact_id,
  i.project_id AS linked_event_id,
  e.event_name AS linked_event_name,
  e.event_date AS linked_event_date,
  e.client_name AS event_client_name,
  CASE WHEN i.project_id IS NOT NULL THEN 'Yes' ELSE 'No' END AS linked_to_event
FROM invoices i
LEFT JOIN events e ON e.id = i.project_id
WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Optional: list events for this contact (candidates to link)
SELECT
  e.id AS event_id,
  e.event_name,
  e.event_date,
  e.client_name,
  e.client_email,
  e.contact_id,
  e.submission_id
FROM events e
JOIN invoices i ON i.contact_id = e.contact_id
WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a'
ORDER BY e.event_date DESC NULLS LAST;

-- If you have an event_id to link (e.g. from the query above), run:
-- UPDATE invoices SET project_id = 'EVENT_UUID_HERE', updated_at = NOW() WHERE id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
