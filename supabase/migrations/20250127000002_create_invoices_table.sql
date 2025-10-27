-- Create invoices table for comprehensive invoice management
CREATE TABLE IF NOT EXISTS public.invoices (
  -- Primary Key
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Links
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  
  -- Invoice Identity
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  invoice_status VARCHAR(50) DEFAULT 'Draft', -- 'Draft', 'Sent', 'Viewed', 'Paid', 'Partial', 'Overdue', 'Cancelled'
  
  -- Invoice Details
  invoice_title VARCHAR(255),
  invoice_description TEXT,
  
  -- Dates
  invoice_date DATE NOT NULL,
  due_date DATE NOT NULL,
  sent_date TIMESTAMP WITH TIME ZONE,
  paid_date TIMESTAMP WITH TIME ZONE,
  cancelled_date TIMESTAMP WITH TIME ZONE,
  
  -- Amounts
  subtotal NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  discount_percentage NUMERIC(5, 2),
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2), -- 8.75%
  total_amount NUMERIC(10, 2) NOT NULL,
  amount_paid NUMERIC(10, 2) DEFAULT 0,
  balance_due NUMERIC(10, 2) DEFAULT 0,
  
  -- Invoice Content (JSON for line items)
  line_items JSONB, -- [{ description, quantity, rate, amount }]
  
  -- Payment Terms
  payment_terms TEXT, -- "Net 30", "Due on receipt", custom terms
  late_fee_percentage NUMERIC(5, 2),
  
  -- Notes
  notes TEXT, -- Public notes visible to client
  internal_notes TEXT, -- Private admin notes
  
  -- Tracking
  view_count INTEGER DEFAULT 0,
  last_viewed_at TIMESTAMP WITH TIME ZONE,
  reminder_sent_count INTEGER DEFAULT 0,
  last_reminder_sent_at TIMESTAMP WITH TIME ZONE,
  
  -- Integration
  honeybook_invoice_id TEXT UNIQUE,
  external_invoice_url TEXT,
  
  -- Metadata
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by uuid REFERENCES auth.users(id)
);

-- Create indexes for better query performance
CREATE INDEX idx_invoices_contact_id ON public.invoices(contact_id);
CREATE INDEX idx_invoices_project_id ON public.invoices(project_id) WHERE project_id IS NOT NULL;
CREATE INDEX idx_invoices_invoice_number ON public.invoices(invoice_number);
CREATE INDEX idx_invoices_status ON public.invoices(invoice_status);
CREATE INDEX idx_invoices_due_date ON public.invoices(due_date);

-- Enable RLS
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;

-- RLS Policies for invoices
CREATE POLICY "Admin users can manage all invoices"
  ON public.invoices
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admin_users 
      WHERE user_id = auth.uid() 
      AND is_active = true
    )
  );

CREATE POLICY "Users can view their own invoices"
  ON public.invoices
  FOR SELECT
  TO authenticated
  USING (
    contact_id IN (
      SELECT id FROM public.contacts WHERE user_id = auth.uid()
    )
  );

-- Function to auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION update_invoices_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_invoices_timestamp
BEFORE UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION update_invoices_updated_at();

-- Function to calculate balance due
CREATE OR REPLACE FUNCTION calculate_invoice_balance()
RETURNS TRIGGER AS $$
BEGIN
  NEW.balance_due = NEW.total_amount - NEW.amount_paid;
  
  -- Auto-update status based on payment
  IF NEW.amount_paid >= NEW.total_amount THEN
    NEW.invoice_status = 'Paid';
    IF NEW.paid_date IS NULL THEN
      NEW.paid_date = NOW();
    END IF;
  ELSIF NEW.amount_paid > 0 AND NEW.amount_paid < NEW.total_amount THEN
    NEW.invoice_status = 'Partial';
  ELSIF NEW.due_date < CURRENT_DATE AND NEW.invoice_status NOT IN ('Paid', 'Cancelled') THEN
    NEW.invoice_status = 'Overdue';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_invoice_balance
BEFORE INSERT OR UPDATE ON public.invoices
FOR EACH ROW
EXECUTE FUNCTION calculate_invoice_balance();

-- Link payments to invoices (add invoice_id to payments if not exists)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payments' AND column_name = 'invoice_id'
  ) THEN
    ALTER TABLE public.payments 
    ADD COLUMN invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL;
    
    CREATE INDEX idx_payments_invoice_id ON public.payments(invoice_id) WHERE invoice_id IS NOT NULL;
  END IF;
END $$;

-- View: Invoice Summary with payment tracking
CREATE OR REPLACE VIEW public.invoice_summary AS
SELECT 
  i.id,
  i.invoice_number,
  i.invoice_status,
  i.invoice_date,
  i.due_date,
  i.total_amount,
  i.amount_paid,
  i.balance_due,
  i.contact_id,
  c.first_name,
  c.last_name,
  c.email_address,
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
  i.id, i.invoice_number, i.invoice_status, i.invoice_date, i.due_date,
  i.total_amount, i.amount_paid, i.balance_due, i.contact_id,
  c.first_name, c.last_name, c.email_address, c.phone, c.event_type, c.event_date,
  i.project_id, e.event_name
ORDER BY i.invoice_date DESC;

-- View: Overdue invoices for follow-up
CREATE OR REPLACE VIEW public.overdue_invoices AS
SELECT 
  i.*,
  c.first_name,
  c.last_name,
  c.email_address,
  c.phone,
  CURRENT_DATE - i.due_date as days_overdue,
  i.total_amount - i.amount_paid as amount_overdue
FROM public.invoices i
JOIN public.contacts c ON i.contact_id = c.id
WHERE i.invoice_status IN ('Sent', 'Partial', 'Overdue')
  AND i.due_date < CURRENT_DATE
  AND i.balance_due > 0
ORDER BY days_overdue DESC;

-- View: Monthly invoice stats
CREATE OR REPLACE VIEW public.monthly_invoice_stats AS
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

-- Function to auto-generate invoice number
CREATE OR REPLACE FUNCTION generate_invoice_number()
RETURNS TEXT AS $$
DECLARE
  year TEXT;
  month TEXT;
  sequence_num INT;
  invoice_num TEXT;
BEGIN
  year := TO_CHAR(CURRENT_DATE, 'YYYY');
  month := TO_CHAR(CURRENT_DATE, 'MM');
  
  -- Get the next sequence number for this month
  SELECT COALESCE(MAX(
    CAST(SUBSTRING(invoice_number FROM '\d+$') AS INTEGER)
  ), 0) + 1
  INTO sequence_num
  FROM public.invoices
  WHERE invoice_number LIKE 'INV-' || year || month || '%';
  
  -- Format: INV-YYYYMM-001
  invoice_num := 'INV-' || year || month || '-' || LPAD(sequence_num::TEXT, 3, '0');
  
  RETURN invoice_num;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.invoices IS 'Stores all invoices for clients with links to projects and payments';
COMMENT ON COLUMN public.invoices.line_items IS 'JSON array of line items: [{ description, quantity, rate, amount, type }]';
COMMENT ON VIEW public.invoice_summary IS 'Complete invoice overview with contact and payment information';
COMMENT ON VIEW public.overdue_invoices IS 'All overdue invoices requiring follow-up';
COMMENT ON FUNCTION generate_invoice_number() IS 'Auto-generates sequential invoice numbers in format INV-YYYYMM-###';

