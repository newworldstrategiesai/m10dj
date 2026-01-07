-- Add payment method enable/disable settings to organizations table
-- This allows admins to control which payment methods appear on the payment selection screen

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS requests_payment_method_card_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_payment_method_cashapp_enabled BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS requests_payment_method_venmo_enabled BOOLEAN;

-- Add comments for documentation
COMMENT ON COLUMN public.organizations.requests_payment_method_card_enabled IS 'Whether the card/Stripe payment method button is shown on the payment selection screen';
COMMENT ON COLUMN public.organizations.requests_payment_method_cashapp_enabled IS 'Whether the CashApp payment method button is shown on the payment selection screen';
COMMENT ON COLUMN public.organizations.requests_payment_method_venmo_enabled IS 'Whether the Venmo payment method button is shown on the payment selection screen';

