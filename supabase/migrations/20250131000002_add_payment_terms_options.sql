-- Add payment terms options to quote_selections table
ALTER TABLE public.quote_selections 
ADD COLUMN IF NOT EXISTS payment_terms_type TEXT CHECK (payment_terms_type IN ('set_number', 'client_selects', NULL)),
ADD COLUMN IF NOT EXISTS number_of_payments INTEGER,
ADD COLUMN IF NOT EXISTS payment_schedule JSONB;

COMMENT ON COLUMN public.quote_selections.payment_terms_type IS 'Type of payment terms: "set_number" (admin sets fixed number) or "client_selects" (client chooses)';
COMMENT ON COLUMN public.quote_selections.number_of_payments IS 'Number of payments when payment_terms_type is "set_number"';
COMMENT ON COLUMN public.quote_selections.payment_schedule IS 'JSON array of payment amounts and due dates when payment_terms_type is "set_number"';

