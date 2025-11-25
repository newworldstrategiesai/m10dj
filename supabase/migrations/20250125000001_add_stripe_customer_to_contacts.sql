-- Add stripe_customer_id column to contacts table for saving payment methods
ALTER TABLE public.contacts 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_contacts_stripe_customer_id ON public.contacts(stripe_customer_id);

-- Add comment
COMMENT ON COLUMN public.contacts.stripe_customer_id IS 'Stripe Customer ID for saving payment methods and enabling faster future payments';

