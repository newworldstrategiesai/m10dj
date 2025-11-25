-- Add show_line_item_prices field to quote_selections table
-- This allows admins to control whether line item prices are displayed on invoices

ALTER TABLE public.quote_selections 
ADD COLUMN IF NOT EXISTS show_line_item_prices BOOLEAN DEFAULT TRUE;

COMMENT ON COLUMN public.quote_selections.show_line_item_prices IS 'If true, shows individual line item prices. If false, shows "Included" without prices.';

