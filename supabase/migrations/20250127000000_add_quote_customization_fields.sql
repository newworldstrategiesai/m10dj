-- Add customization fields to quote_selections table for admin-customized packages
-- This allows tracking when admins remove features from packages

ALTER TABLE public.quote_selections 
  ADD COLUMN IF NOT EXISTS customized BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS original_price DECIMAL(10, 2),
  ADD COLUMN IF NOT EXISTS removed_features JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS customization_note TEXT;

-- Add comment
COMMENT ON COLUMN public.quote_selections.customized IS 'True if admin customized this package by removing features';
COMMENT ON COLUMN public.quote_selections.original_price IS 'Original package price before customization';
COMMENT ON COLUMN public.quote_selections.removed_features IS 'JSON array of removed features: [{item, price, description}]';
COMMENT ON COLUMN public.quote_selections.customization_note IS 'Admin note about the customization';

