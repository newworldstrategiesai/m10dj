-- Add TipJar instant payout fee fields to organizations table
-- These allow TipJar to charge additional fees on top of Stripe's instant payout fees

ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS tipjar_instant_payout_fee_percentage DECIMAL(5,2) DEFAULT 1.00,
ADD COLUMN IF NOT EXISTS tipjar_instant_payout_fee_fixed DECIMAL(10,2) DEFAULT 0.25;

-- Add comments
COMMENT ON COLUMN public.organizations.tipjar_instant_payout_fee_percentage IS 'TipJar instant payout fee percentage (default: 1.00 for 1%). This fee is charged on top of Stripe fees. Only applies to TipJar users (product_context = tipjar).';
COMMENT ON COLUMN public.organizations.tipjar_instant_payout_fee_fixed IS 'TipJar instant payout fixed fee in dollars (default: 0.25 for $0.25). This fee is charged on top of Stripe fees and percentage fee. Only applies to TipJar users (product_context = tipjar).';

-- Set defaults for TipJar organizations (1% + $0.25 on top of Stripe's 1.5%)
-- Non-TipJar organizations will have NULL values and won't be charged TipJar fees
UPDATE public.organizations
SET 
  tipjar_instant_payout_fee_percentage = 1.00,
  tipjar_instant_payout_fee_fixed = 0.25
WHERE product_context = 'tipjar'
  AND (tipjar_instant_payout_fee_percentage IS NULL OR tipjar_instant_payout_fee_fixed IS NULL);

