-- Add invoice_email_address field to invoices table
-- This allows invoices to have a different email address than the contact
-- Useful for billing emails, different departments, etc.

ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS invoice_email_address TEXT;

COMMENT ON COLUMN public.invoices.invoice_email_address IS 'Email address specific to this invoice. If set, overrides contact email_address for this invoice.';

-- Create index for email lookups
CREATE INDEX IF NOT EXISTS idx_invoices_email_address ON public.invoices(invoice_email_address) WHERE invoice_email_address IS NOT NULL;

-- Update invoice_summary view to use invoice_email_address if present, otherwise use contact email
-- Drop dependent views first
DROP VIEW IF EXISTS public.overdue_invoices CASCADE;
DROP VIEW IF EXISTS public.monthly_invoice_stats CASCADE;

-- Recreate invoice_summary view with invoice_email_address support
CREATE OR REPLACE VIEW public.invoice_summary AS
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.invoice_title,
  i.invoice_date,
  i.due_date,
  i.sent_date,
  i.paid_date,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  i.contact_id,
  i.organization_id,
  c.first_name,
  c.last_name,
  -- Use invoice_email_address if present, otherwise use contact email
  COALESCE(i.invoice_email_address, c.email_address) as email_address,
  c.phone,
  c.event_type,
  c.event_date,
  i.project_id,
  e.event_name as project_name,
  COUNT(p.id) as payment_count,
  MAX(p.transaction_date) as last_payment_date,
  CASE 
    WHEN i.invoice_status = 'Paid' THEN 'success'
    WHEN i.invoice_status = 'Overdue' THEN 'danger'
    WHEN i.invoice_status = 'Partial' THEN 'warning'
    WHEN i.invoice_status = 'Sent' THEN 'info'
    ELSE 'default'
  END as status_color,
  CASE 
    WHEN i.due_date < CURRENT_DATE AND i.invoice_status NOT IN ('Paid', 'Cancelled') THEN 
      CURRENT_DATE - i.due_date
    ELSE 0
  END as days_overdue
FROM public.invoices i
LEFT JOIN public.contacts c ON i.contact_id = c.id
LEFT JOIN public.events e ON i.project_id = e.id
LEFT JOIN public.payments p ON p.invoice_id = i.id AND p.payment_status = 'Paid'
GROUP BY 
  i.id, i.invoice_number, i.invoice_status, i.invoice_title, i.invoice_date, i.due_date,
  i.sent_date, i.paid_date, i.total_amount, i.amount_paid, i.balance_due, i.contact_id,
  i.organization_id, i.invoice_email_address, c.first_name, c.last_name, c.email_address, c.phone, c.event_type, c.event_date,
  i.project_id, e.event_name
ORDER BY i.invoice_date DESC;

-- Recreate overdue_invoices view
CREATE VIEW public.overdue_invoices AS
SELECT 
  i.*,
  c.first_name,
  c.last_name,
  COALESCE(i.invoice_email_address, c.email_address) as email_address,
  c.phone,
  CURRENT_DATE - i.due_date as days_overdue,
  i.total_amount - i.amount_paid as amount_overdue
FROM public.invoices i
JOIN public.contacts c ON i.contact_id = c.id
WHERE i.invoice_status IN ('Sent', 'Partial', 'Overdue')
  AND i.due_date < CURRENT_DATE
  AND i.balance_due > 0
ORDER BY days_overdue DESC;

-- Recreate monthly_invoice_stats view
CREATE VIEW public.monthly_invoice_stats AS
SELECT 
  DATE_TRUNC('month', invoice_date) as month,
  COUNT(*) as invoice_count,
  COUNT(*) FILTER (WHERE invoice_status = 'Paid') as paid_count,
  COUNT(*) FILTER (WHERE invoice_status = 'Overdue') as overdue_count,
  SUM(total_amount) as total_invoiced,
  SUM(amount_paid) as total_collected,
  SUM(balance_due) as total_outstanding,
  AVG(total_amount) as avg_invoice_amount
FROM public.invoices
WHERE invoice_status != 'Cancelled'
GROUP BY month
ORDER BY month DESC;

-- Grant permissions
GRANT SELECT ON public.invoice_summary TO authenticated;
GRANT SELECT ON public.invoice_summary TO service_role;
GRANT SELECT ON public.overdue_invoices TO authenticated;
GRANT SELECT ON public.overdue_invoices TO service_role;
GRANT SELECT ON public.monthly_invoice_stats TO authenticated;
GRANT SELECT ON public.monthly_invoice_stats TO service_role;

COMMENT ON VIEW public.invoice_summary IS 'Complete invoice overview with contact and payment information. Uses invoice_email_address if present, otherwise falls back to contact email_address.';
