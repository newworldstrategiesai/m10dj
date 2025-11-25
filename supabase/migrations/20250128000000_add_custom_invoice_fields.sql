-- Add custom invoice editing fields to quote_selections table
-- This allows admins to edit invoice prices after negotiation

ALTER TABLE public.quote_selections 
ADD COLUMN IF NOT EXISTS custom_line_items JSONB,
ADD COLUMN IF NOT EXISTS custom_addons JSONB,
ADD COLUMN IF NOT EXISTS is_custom_price BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.quote_selections.custom_line_items IS 'Custom line items with edited prices: [{item, description, price}]';
COMMENT ON COLUMN public.quote_selections.custom_addons IS 'Custom addons with edited prices: [{id, name, price, description}]';
COMMENT ON COLUMN public.quote_selections.is_custom_price IS 'True if admin manually edited the invoice price';

