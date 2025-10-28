-- Add Stripe Integration to Invoices
-- Adds fields to track Stripe payments and sessions

-- Add Stripe fields to invoices table
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS stripe_session_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_payment_intent TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT CHECK (payment_method IN ('cash', 'check', 'credit_card', 'stripe', 'venmo', 'zelle', 'other')),
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS amount_paid DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS refunded_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS refund_amount DECIMAL(10,2);

-- Add index for faster Stripe lookups
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_session ON public.invoices(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe_payment ON public.invoices(stripe_payment_intent);

-- Add comment
COMMENT ON COLUMN public.invoices.stripe_session_id IS 'Stripe Checkout Session ID';
COMMENT ON COLUMN public.invoices.stripe_payment_intent IS 'Stripe Payment Intent ID';
COMMENT ON COLUMN public.invoices.payment_method IS 'How the invoice was paid';
COMMENT ON COLUMN public.invoices.paid_at IS 'Timestamp when payment was received';
COMMENT ON COLUMN public.invoices.amount_paid IS 'Actual amount paid (may differ from total if partial)';
COMMENT ON COLUMN public.invoices.refunded_at IS 'Timestamp if payment was refunded';
COMMENT ON COLUMN public.invoices.refund_amount IS 'Amount refunded';

-- Add Stripe fields to existing payments table (if payments table already exists)
DO $$ 
BEGIN
    -- Add stripe_session_id if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'payments' 
                   AND column_name = 'stripe_session_id') THEN
        ALTER TABLE public.payments ADD COLUMN stripe_session_id TEXT;
    END IF;

    -- Add stripe_payment_intent if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'payments' 
                   AND column_name = 'stripe_payment_intent') THEN
        ALTER TABLE public.payments ADD COLUMN stripe_payment_intent TEXT;
    END IF;
END $$;

-- Add indexes for payments table (only if table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'payments') THEN
        
        CREATE INDEX IF NOT EXISTS idx_payments_stripe_session ON public.payments(stripe_session_id);
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' 
                   AND table_name = 'payments' 
                   AND column_name = 'stripe_payment_intent') THEN
            CREATE INDEX IF NOT EXISTS idx_payments_stripe_payment ON public.payments(stripe_payment_intent);
        END IF;
    END IF;
END $$;

-- Enable RLS for payments table (if it exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'payments') THEN
        
        ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
        
        -- Drop existing policies if they exist
        DROP POLICY IF EXISTS "Admin full access to payments" ON public.payments;
        DROP POLICY IF EXISTS "Clients can view own payments" ON public.payments;
        DROP POLICY IF EXISTS "Service role full access to payments" ON public.payments;
        
        -- Service role (backend) can do everything with payments
        CREATE POLICY "Service role full access to payments"
            ON public.payments
            FOR ALL
            TO service_role
            USING (true)
            WITH CHECK (true);
        
        -- Authenticated users can view payments for their contacts
        IF EXISTS (SELECT 1 FROM information_schema.tables 
                   WHERE table_schema = 'public' 
                   AND table_name = 'contacts') THEN
            CREATE POLICY "Users can view related payments"
                ON public.payments
                FOR SELECT
                TO authenticated
                USING (
                    contact_id IN (
                        SELECT id FROM public.contacts
                        WHERE contacts.user_id = auth.uid()
                    )
                );
        END IF;
    END IF;
END $$;

-- Add comments (only for columns we know exist)
DO $$
BEGIN
    -- Only add comments if the table and columns exist
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' AND table_name = 'payments') THEN
        
        COMMENT ON TABLE public.payments IS 'Detailed payment transaction records';
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'payments' 
                   AND column_name = 'stripe_session_id') THEN
            COMMENT ON COLUMN public.payments.stripe_session_id IS 'Stripe Checkout Session ID if applicable';
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_schema = 'public' AND table_name = 'payments' 
                   AND column_name = 'stripe_payment_intent') THEN
            COMMENT ON COLUMN public.payments.stripe_payment_intent IS 'Stripe Payment Intent ID if applicable';
        END IF;
    END IF;
END $$;

-- Create function to auto-update invoice status when payment is received
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
BEGIN
    -- If payment is completed, update invoice
    IF NEW.status = 'completed' AND NEW.invoice_id IS NOT NULL THEN
        UPDATE public.invoices
        SET 
            status = 'paid',
            paid_at = NEW.payment_date,
            amount_paid = NEW.amount,
            payment_method = NEW.payment_method,
            updated_at = NOW()
        WHERE id = NEW.invoice_id
        AND status != 'paid'; -- Only update if not already paid
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-update invoices on payment (only if payments table exists)
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables 
               WHERE table_schema = 'public' 
               AND table_name = 'payments') THEN
        
        DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment ON public.payments;
        CREATE TRIGGER trigger_update_invoice_on_payment
            AFTER INSERT OR UPDATE ON public.payments
            FOR EACH ROW
            EXECUTE FUNCTION update_invoice_on_payment();
    END IF;
END $$;

-- Create view for payment summary by contact
CREATE OR REPLACE VIEW public.payment_summary AS
SELECT 
    c.id as contact_id,
    c.first_name,
    c.last_name,
    c.email_address,
    COUNT(DISTINCT p.id) as total_payments,
    SUM(CASE WHEN p.status = 'completed' THEN p.amount ELSE 0 END) as total_paid,
    SUM(CASE WHEN p.status = 'pending' THEN p.amount ELSE 0 END) as total_pending,
    SUM(CASE WHEN p.status = 'refunded' THEN p.amount ELSE 0 END) as total_refunded,
    MAX(p.payment_date) as last_payment_date
FROM public.contacts c
LEFT JOIN public.payments p ON p.contact_id = c.id
GROUP BY c.id, c.first_name, c.last_name, c.email_address;

-- Grant access to view
GRANT SELECT ON public.payment_summary TO authenticated;

-- Add helpful comment
COMMENT ON VIEW public.payment_summary IS 'Summary of all payments by contact';

