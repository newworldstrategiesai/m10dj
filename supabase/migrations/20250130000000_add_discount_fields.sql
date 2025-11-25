-- Add discount fields to quote_selections table
ALTER TABLE public.quote_selections 
ADD COLUMN IF NOT EXISTS discount_type TEXT CHECK (discount_type IS NULL OR discount_type IN ('percentage', 'flat')),
ADD COLUMN IF NOT EXISTS discount_value DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS discount_note TEXT;

COMMENT ON COLUMN public.quote_selections.discount_type IS 'Type of discount: percentage or flat rate';
COMMENT ON COLUMN public.quote_selections.discount_value IS 'Discount amount (percentage value 0-100 or flat dollar amount)';
COMMENT ON COLUMN public.quote_selections.discount_note IS 'Optional note explaining the discount reason';

