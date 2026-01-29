-- Set Marlee Condo invoice due_date to the event date (2026-10-10).
-- Invoice: bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a | Event: 1101d07f-5f6c-4dcc-baef-1a5e24524719

UPDATE invoices i
SET due_date = e.event_date,
    updated_at = NOW()
FROM events e
WHERE e.id = i.project_id
  AND i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';

-- Verify
SELECT i.id, i.invoice_number, i.due_date, e.event_date AS event_date
FROM invoices i
LEFT JOIN events e ON e.id = i.project_id
WHERE i.id = 'bdcda9ea-dfc4-4a7d-a104-6a1d4486e35a';
