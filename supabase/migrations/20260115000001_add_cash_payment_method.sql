-- Add Cash payment method enabled setting to organizations table
-- This allows admins to control whether the Cash payment option appears on the payment selection screen

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_payment_method_cash_enabled BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.organizations.requests_payment_method_cash_enabled IS 'Whether the Cash payment method button is shown on the payment selection screen. Cash payments are manual (no verification needed).';
