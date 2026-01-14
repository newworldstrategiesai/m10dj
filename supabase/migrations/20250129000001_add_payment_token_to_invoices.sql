-- Add payment_token column to invoices table for secure payment links
-- This allows customers to pay invoices via a secure token without authentication

-- Add payment_token column
ALTER TABLE public.invoices
ADD COLUMN IF NOT EXISTS payment_token TEXT UNIQUE;

-- Create index for faster lookups by payment token
CREATE INDEX IF NOT EXISTS idx_invoices_payment_token ON public.invoices(payment_token) WHERE payment_token IS NOT NULL;

-- Add comment
COMMENT ON COLUMN public.invoices.payment_token IS 'Secure token for public payment access. Allows customers to pay invoices without authentication.';
