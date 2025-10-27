-- Create payments table for tracking financial transactions
CREATE TABLE IF NOT EXISTS public.payments (
  -- Primary Key
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  
  -- Links to other tables
  contact_id uuid REFERENCES public.contacts(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.events(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100),
  
  -- Payment Info
  payment_name VARCHAR(255), -- "1 of 2 payments / Retainer", "Final Payment", etc.
  payment_status VARCHAR(50) DEFAULT 'Pending', -- "Paid", "Pending", "Overdue", "Refunded", "Disputed"
  payment_method VARCHAR(50), -- "Credit Card", "ACH", "Venmo", "Cash", "Check"
  payment_notes TEXT,
  charge_notes TEXT,
  
  -- Dates
  due_date DATE,
  transaction_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Amounts (using NUMERIC to avoid float precision issues)
  payment_before_discount NUMERIC(10, 2) DEFAULT 0,
  discount_amount NUMERIC(10, 2) DEFAULT 0,
  non_taxable_amount NUMERIC(10, 2) DEFAULT 0,
  taxable_amount NUMERIC(10, 2) DEFAULT 0,
  tax_amount NUMERIC(10, 2) DEFAULT 0,
  tax_rate NUMERIC(5, 2), -- 8.75% stored as 8.75
  late_fee NUMERIC(10, 2) DEFAULT 0,
  gratuity NUMERIC(10, 2) DEFAULT 0,
  total_amount NUMERIC(10, 2) DEFAULT 0, -- What client paid
  
  -- Processing Fees
  transaction_fee NUMERIC(10, 2) DEFAULT 0,
  fee_rate VARCHAR(50), -- "2.9% + 25¢", "1.5% + 0¢", etc.
  instant_deposit_fee NUMERIC(10, 2) DEFAULT 0,
  instant_deposit_fee_rate NUMERIC(5, 2),
  loan_repayment NUMERIC(10, 2) DEFAULT 0,
  loan_fee NUMERIC(10, 2) DEFAULT 0,
  loan_principal NUMERIC(10, 2) DEFAULT 0,
  payment_service_fee NUMERIC(10, 2) DEFAULT 0,
  service_fee_rate NUMERIC(5, 2),
  net_amount NUMERIC(10, 2) DEFAULT 0, -- What you actually received after all fees
  
  -- Refunds/Disputes
  refunded_amount NUMERIC(10, 2) DEFAULT 0,
  disputed_date DATE,
  dispute_cover NUMERIC(10, 2) DEFAULT 0,
  dispute_fee NUMERIC(10, 2) DEFAULT 0,
  disputed_net_amount NUMERIC(10, 2) DEFAULT 0,
  
  -- Metadata
  honeybook_imported BOOLEAN DEFAULT FALSE,
  honeybook_project_name VARCHAR(255),
  
  -- Constraints
  CONSTRAINT unique_invoice_payment UNIQUE(invoice_number, payment_name)
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_payments_contact_id ON public.payments(contact_id);
CREATE INDEX IF NOT EXISTS idx_payments_project_id ON public.payments(project_id);
CREATE INDEX IF NOT EXISTS idx_payments_transaction_date ON public.payments(transaction_date);
CREATE INDEX IF NOT EXISTS idx_payments_status ON public.payments(payment_status);
CREATE INDEX IF NOT EXISTS idx_payments_due_date ON public.payments(due_date);
CREATE INDEX IF NOT EXISTS idx_payments_method ON public.payments(payment_method);

-- Enable Row Level Security
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow authenticated users (admins) to manage payments
-- Adjust this policy based on your actual admin authentication setup
CREATE POLICY "Authenticated users can manage all payments"
  ON public.payments
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- If you have an admin_users table, replace the above with:
-- CREATE POLICY "Admin users can manage all payments"
--   ON public.payments
--   FOR ALL
--   TO authenticated
--   USING (
--     EXISTS (
--       SELECT 1 FROM public.admin_users 
--       WHERE user_id = auth.uid() 
--       AND is_active = true
--     )
--   );

-- View: Outstanding Balances per Contact
CREATE OR REPLACE VIEW public.outstanding_balances AS
SELECT 
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email_address,
  c.phone,
  c.event_type,
  c.event_date,
  c.quoted_price as project_value,
  COALESCE(SUM(CASE WHEN p.payment_status = 'Paid' THEN p.total_amount ELSE 0 END), 0) as total_paid,
  COALESCE(c.quoted_price - SUM(CASE WHEN p.payment_status = 'Paid' THEN p.total_amount ELSE 0 END), c.quoted_price) as balance_due,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'Paid') as completed_payments,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'Pending') as pending_payments,
  COUNT(p.id) FILTER (WHERE p.payment_status = 'Overdue') as overdue_payments,
  MAX(p.transaction_date) as last_payment_date,
  MIN(p.due_date) FILTER (WHERE p.payment_status IN ('Pending', 'Overdue')) as next_payment_due
FROM public.contacts c
LEFT JOIN public.payments p ON c.id = p.contact_id
WHERE c.lead_status IN ('Booked', 'Proposal Sent', 'Negotiating')
  AND c.deleted_at IS NULL
GROUP BY c.id, c.first_name, c.last_name, c.email_address, c.phone, c.event_type, c.event_date, c.quoted_price
ORDER BY c.event_date ASC;

-- View: Monthly Revenue Report
CREATE OR REPLACE VIEW public.monthly_revenue AS
SELECT 
  DATE_TRUNC('month', transaction_date)::date as month,
  COUNT(*) as transaction_count,
  SUM(total_amount) as gross_revenue,
  SUM(tax_amount) as sales_tax_collected,
  SUM(gratuity) as tips_collected,
  SUM(transaction_fee + COALESCE(instant_deposit_fee, 0) + COALESCE(loan_fee, 0) + COALESCE(payment_service_fee, 0)) as total_fees,
  SUM(net_amount) as net_revenue,
  ROUND((SUM(transaction_fee + COALESCE(instant_deposit_fee, 0) + COALESCE(loan_fee, 0) + COALESCE(payment_service_fee, 0)) / NULLIF(SUM(total_amount), 0) * 100)::numeric, 2) as effective_fee_rate
FROM public.payments
WHERE payment_status = 'Paid'
  AND transaction_date IS NOT NULL
GROUP BY DATE_TRUNC('month', transaction_date)
ORDER BY month DESC;

-- View: Payment Method Analysis
CREATE OR REPLACE VIEW public.payment_method_stats AS
SELECT 
  payment_method,
  COUNT(*) as transaction_count,
  SUM(total_amount) as total_volume,
  AVG(total_amount) as avg_transaction_size,
  AVG(transaction_fee) as avg_fee_per_transaction,
  SUM(transaction_fee) as total_fees_paid,
  ROUND((SUM(transaction_fee) / NULLIF(SUM(total_amount), 0) * 100)::numeric, 2) as effective_fee_rate,
  SUM(net_amount) as total_net_received
FROM public.payments
WHERE payment_status = 'Paid'
  AND transaction_date >= CURRENT_DATE - INTERVAL '12 months'
  AND payment_method IS NOT NULL
GROUP BY payment_method
ORDER BY total_volume DESC;

-- View: Client Payment History Summary
CREATE OR REPLACE VIEW public.client_payment_summary AS
SELECT 
  c.id as contact_id,
  c.first_name,
  c.last_name,
  c.email_address,
  COUNT(p.id) as total_payments,
  SUM(CASE WHEN p.payment_status = 'Paid' THEN p.total_amount ELSE 0 END) as total_paid,
  SUM(CASE WHEN p.payment_status = 'Paid' THEN p.net_amount ELSE 0 END) as total_net_received,
  SUM(p.gratuity) as total_tips,
  AVG(EXTRACT(epoch FROM (p.transaction_date::timestamp - p.due_date::timestamp))/86400) FILTER (WHERE p.payment_status = 'Paid' AND p.due_date IS NOT NULL) as avg_days_late,
  MIN(p.transaction_date) as first_payment_date,
  MAX(p.transaction_date) as last_payment_date,
  STRING_AGG(DISTINCT p.payment_method, ', ' ORDER BY p.payment_method) as payment_methods_used
FROM public.contacts c
LEFT JOIN public.payments p ON c.id = p.contact_id
WHERE c.deleted_at IS NULL
GROUP BY c.id, c.first_name, c.last_name, c.email_address
HAVING COUNT(p.id) > 0
ORDER BY total_paid DESC;

-- Function to auto-update contact final_price when payments are made
CREATE OR REPLACE FUNCTION update_contact_final_price()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.payment_status = 'Paid' AND NEW.contact_id IS NOT NULL THEN
    UPDATE public.contacts
    SET final_price = (
      SELECT SUM(total_amount)
      FROM public.payments
      WHERE contact_id = NEW.contact_id
        AND payment_status = 'Paid'
    ),
    updated_at = NOW()
    WHERE id = NEW.contact_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to update contact final_price on payment
CREATE TRIGGER trigger_update_contact_final_price
  AFTER INSERT OR UPDATE ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_contact_final_price();

-- Function to mark payments as overdue
CREATE OR REPLACE FUNCTION mark_overdue_payments()
RETURNS void AS $$
BEGIN
  UPDATE public.payments
  SET payment_status = 'Overdue',
      updated_at = NOW()
  WHERE payment_status = 'Pending'
    AND due_date < CURRENT_DATE;
END;
$$ LANGUAGE plpgsql;

-- Comment on table
COMMENT ON TABLE public.payments IS 'Financial transaction tracking for all payments received from clients';
COMMENT ON VIEW public.outstanding_balances IS 'Shows contacts with unpaid balances and upcoming payments';
COMMENT ON VIEW public.monthly_revenue IS 'Monthly revenue breakdown with fees and net amounts';
COMMENT ON VIEW public.payment_method_stats IS 'Analysis of payment methods to optimize fee costs';
COMMENT ON VIEW public.client_payment_summary IS 'Per-client payment history and reliability metrics';

